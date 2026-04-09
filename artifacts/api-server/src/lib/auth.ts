import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env["SESSION_SECRET"] || "dev-secret-change-in-production";
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "30d";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(merchantId: string): string {
  return jwt.sign({ sub: merchantId, type: "access" }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(merchantId: string): string {
  return jwt.sign({ sub: merchantId, type: "refresh" }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): { sub: string } {
  return jwt.verify(token, JWT_SECRET) as { sub: string };
}

export function verifyRefreshToken(token: string): { sub: string } {
  const payload = jwt.verify(token, JWT_SECRET) as { sub: string; type: string };
  if (payload.type !== "refresh") throw new Error("Invalid token type");
  return payload;
}
