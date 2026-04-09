/**
 * Seed script — creates a reproducible demo dataset.
 * Safe to re-run: skips creation if demo@payos.com already exists.
 *
 * Usage:  pnpm --filter @workspace/scripts run seed
 */

import { db, merchantsTable, productsTable, transactionsTable, payoutsTable, onboardingSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const DEMO_EMAIL = "demo@payos.com";
const DEMO_PASSWORD = "Demo1234!";

// ── helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomAmount(min: number, max: number): string {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// ── main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱  PayOS seed script starting…");

  // ── 1. Merchant ────────────────────────────────────────────────────────
  const [existing] = await db
    .select()
    .from(merchantsTable)
    .where(eq(merchantsTable.email, DEMO_EMAIL))
    .limit(1);

  if (existing) {
    console.log(`⏭   Demo merchant already exists (${DEMO_EMAIL}) — skipping.`);
    console.log("    To reset: DELETE FROM merchants WHERE email = 'demo@payos.com'");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const [merchant] = await db
    .insert(merchantsTable)
    .values({
      email: DEMO_EMAIL,
      passwordHash,
      firstName: "Alex",
      lastName: "Demo",
      status: "active",
      onboardingStatus: "approved",
      country: "GB",
      businessName: "Demo Coffee Co.",
      businessType: "sole_trader",
      businessCategory: "food_drink",
    })
    .returning();

  if (!merchant) throw new Error("Failed to insert demo merchant");
  console.log(`✅  Merchant created: ${merchant.email} (id: ${merchant.id})`);

  // ── 2. Onboarding session (completed) ──────────────────────────────────
  await db.insert(onboardingSessionsTable).values({
    merchantId: merchant.id,
    currentStep: "q_review",
    status: "approved",
    progressPercent: 100,
    kycStatus: "approved",
    answers: {
      country: "GB",
      business_type: "sole_trader",
      first_name: "Alex",
      last_name: "Demo",
      date_of_birth: "1988-06-15",
      phone: "+447700900123",
      business_name: "Demo Coffee Co.",
      business_category: "food_drink",
      estimated_monthly_turnover: "5001-15000",
      id_type: "passport",
    },
  });
  console.log("✅  Onboarding session created (status: approved)");

  // ── 3. Products ────────────────────────────────────────────────────────
  const productDefs = [
    { name: "Flat White", description: "Double espresso with steamed milk", price: "3.50", category: "food_drink", sku: "COFFEE-001" },
    { name: "Oat Latte", description: "Espresso with oat milk", price: "4.00", category: "food_drink", sku: "COFFEE-002" },
    { name: "Almond Croissant", description: "Freshly baked almond croissant", price: "3.20", category: "food_drink", sku: "FOOD-001" },
    { name: "Reusable Cup", description: "12oz bamboo cup — 20p discount on hot drinks", price: "8.00", category: "retail", sku: "MERCH-001" },
    { name: "Coffee Beans 250g", description: "House blend, medium roast", price: "9.50", category: "retail", sku: "MERCH-002" },
  ] as const;

  const products = await db
    .insert(productsTable)
    .values(productDefs.map((p) => ({
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      sku: p.sku,
      merchantId: merchant.id,
      currency: "GBP",
    })))
    .returning();

  console.log(`✅  ${products.length} products created`);

  // ── 4. Transactions (30, spread over 30 days) ──────────────────────────
  const statuses = ["successful", "successful", "successful", "successful", "refunded", "failed"] as const;
  const methods = ["card", "card", "card", "tap_to_pay"] as const;
  const schemes = ["visa", "mastercard", "amex"] as const;

  const txRows = Array.from({ length: 30 }, (_, i) => {
    const product = products[i % products.length]!;
    const status = pick(statuses);
    const dayOffset = Math.floor((i / 30) * 29);
    const createdAt = daysAgo(29 - dayOffset);
    createdAt.setHours(8 + Math.floor(Math.random() * 10));
    createdAt.setMinutes(Math.floor(Math.random() * 60));

    return {
      merchantId: merchant.id,
      amount: status === "failed" ? product.price : randomAmount(3, 25),
      currency: "GBP",
      status,
      paymentMethod: pick(methods),
      cardLastFour: String(1000 + Math.floor(Math.random() * 9000)),
      cardScheme: pick(schemes),
      productId: product.id,
      productName: product.name,
      description: product.name,
      refundedAt: status === "refunded" ? new Date(createdAt.getTime() + 3_600_000) : undefined,
      createdAt,
    };
  });

  await db.insert(transactionsTable).values(txRows);
  console.log(`✅  ${txRows.length} transactions created`);

  // ── 5. Payouts (3) ────────────────────────────────────────────────────
  await db.insert(payoutsTable).values([
    { merchantId: merchant.id, amount: "127.40", currency: "GBP", status: "paid", payoutDate: daysAgo(2).toISOString().split("T")[0]!, reference: "PAY-2026-001" },
    { merchantId: merchant.id, amount: "243.80", currency: "GBP", status: "paid", payoutDate: daysAgo(9).toISOString().split("T")[0]!, reference: "PAY-2026-002" },
    { merchantId: merchant.id, amount: "98.60", currency: "GBP", status: "paid", payoutDate: daysAgo(16).toISOString().split("T")[0]!, reference: "PAY-2026-003" },
  ]);
  console.log("✅  3 payouts created");

  console.log("");
  console.log("🎉  Seed complete!");
  console.log(`    Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
