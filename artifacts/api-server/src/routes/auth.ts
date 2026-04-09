import { Router } from "express";
import { db } from "@workspace/db";
import { merchantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../lib/auth.js";
import { RegisterMerchantBody, LoginMerchantBody, RefreshTokenBody } from "@workspace/api-zod";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterMerchantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "Invalid request body" });
    return;
  }

  const { email, password, first_name, last_name } = parsed.data;

  const existing = await db.select().from(merchantsTable).where(eq(merchantsTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Conflict", message: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const accessToken = generateAccessToken("temp");
  const refreshToken = generateRefreshToken("temp");

  const [merchant] = await db.insert(merchantsTable).values({
    email,
    passwordHash,
    firstName: first_name,
    lastName: last_name,
    status: "pending_onboarding",
    onboardingStatus: "not_started",
    country: "",
    refreshToken,
  }).returning();

  const finalAccess = generateAccessToken(merchant.id);
  const finalRefresh = generateRefreshToken(merchant.id);

  await db.update(merchantsTable).set({ refreshToken: finalRefresh }).where(eq(merchantsTable.id, merchant.id));

  res.status(201).json({
    access_token: finalAccess,
    refresh_token: finalRefresh,
    expires_in: 3600,
    merchant: formatMerchant(merchant),
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginMerchantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "Invalid request body" });
    return;
  }

  const { email, password } = parsed.data;

  const [merchant] = await db.select().from(merchantsTable).where(eq(merchantsTable.email, email)).limit(1);
  if (!merchant) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  const valid = await comparePassword(password, merchant.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  const accessToken = generateAccessToken(merchant.id);
  const refreshToken = generateRefreshToken(merchant.id);

  await db.update(merchantsTable).set({ refreshToken, updatedAt: new Date() }).where(eq(merchantsTable.id, merchant.id));

  res.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    merchant: formatMerchant(merchant),
  });
});

router.post("/auth/refresh", async (req, res) => {
  const parsed = RefreshTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "refresh_token required" });
    return;
  }

  try {
    const payload = verifyRefreshToken(parsed.data.refresh_token);
    const [merchant] = await db.select().from(merchantsTable).where(eq(merchantsTable.id, payload.sub)).limit(1);
    if (!merchant) {
      res.status(401).json({ error: "Unauthorized", message: "Merchant not found" });
      return;
    }

    const accessToken = generateAccessToken(merchant.id);
    const refreshToken = generateRefreshToken(merchant.id);
    await db.update(merchantsTable).set({ refreshToken, updatedAt: new Date() }).where(eq(merchantsTable.id, merchant.id));

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      merchant: formatMerchant(merchant),
    });
  } catch {
    res.status(401).json({ error: "Unauthorized", message: "Invalid refresh token" });
  }
});

router.post("/auth/logout", async (req, res) => {
  const header = req.headers["authorization"];
  if (header && header.startsWith("Bearer ")) {
    try {
      const { verifyAccessToken } = await import("../lib/auth.js");
      const payload = verifyAccessToken(header.slice(7));
      await db.update(merchantsTable).set({ refreshToken: null, updatedAt: new Date() }).where(eq(merchantsTable.id, payload.sub));
    } catch {
    }
  }
  res.status(204).send();
});

function formatMerchant(m: typeof merchantsTable.$inferSelect) {
  return {
    id: m.id,
    email: m.email,
    first_name: m.firstName,
    last_name: m.lastName,
    status: m.status,
    country: m.country,
    business_name: m.businessName,
    business_type: m.businessType,
    business_category: m.businessCategory,
    onboarding_status: m.onboardingStatus,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  };
}

export { router as authRouter, formatMerchant };
