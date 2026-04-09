import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const isProduction = process.env["NODE_ENV"] === "production";

if (isProduction && !process.env["SESSION_SECRET"]) {
  throw new Error(
    "FATAL: SESSION_SECRET environment variable must be set in production. " +
    "Generate one with: openssl rand -hex 32"
  );
}

export const JWT_SECRET =
  process.env["SESSION_SECRET"] ?? "dev-secret-DO-NOT-USE-IN-PRODUCTION";

const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "30d";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(merchantId: string): string {
  return jwt.sign(
    { sub: merchantId, type: "access", jti: crypto.randomUUID() },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(merchantId: string): string {
  return jwt.sign(
    { sub: merchantId, type: "refresh", jti: crypto.randomUUID() },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyAccessToken(token: string): { sub: string } {
  return jwt.verify(token, JWT_SECRET) as { sub: string };
}

export function verifyRefreshToken(token: string): { sub: string; type: string } {
  const payload = jwt.verify(token, JWT_SECRET) as { sub: string; type: string };
  if (payload.type !== "refresh") throw new Error("Invalid token type");
  return payload;
}
