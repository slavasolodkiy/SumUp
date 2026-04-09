import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";

const uniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.payos.io`;

describe("Auth routes", () => {
  const email = uniqueEmail();
  const password = "TestPass123!";
  let accessToken: string;
  let refreshToken: string;

  it("POST /api/auth/register — creates account", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password, first_name: "Test", last_name: "User" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("access_token");
    expect(res.body).toHaveProperty("refresh_token");
    expect(res.body.merchant.email).toBe(email);

    accessToken = res.body.access_token;
    refreshToken = res.body.refresh_token;
  });

  it("POST /api/auth/register — rejects duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password, first_name: "Dup", last_name: "User" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Conflict");
  });

  it("POST /api/auth/login — valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("access_token");
    expect(res.body.merchant.email).toBe(email);

    refreshToken = res.body.refresh_token;
  });

  it("POST /api/auth/login — wrong password returns 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("POST /api/auth/refresh — rotates token pair", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refresh_token: refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("access_token");
    expect(res.body).toHaveProperty("refresh_token");
    expect(typeof res.body.access_token).toBe("string");
    expect(typeof res.body.refresh_token).toBe("string");

    const oldToken = refreshToken;
    accessToken = res.body.access_token;
    refreshToken = res.body.refresh_token;
    expect(refreshToken).not.toBe(oldToken);
  });

  it("POST /api/auth/refresh — old token rejected after rotation", async () => {
    const currentToken = refreshToken;
    const rotateRes = await request(app)
      .post("/api/auth/refresh")
      .send({ refresh_token: currentToken });
    expect(rotateRes.status).toBe(200);

    const newToken = rotateRes.body.refresh_token;
    expect(newToken).not.toBe(currentToken);

    const reuseOld = await request(app)
      .post("/api/auth/refresh")
      .send({ refresh_token: currentToken });
    expect(reuseOld.status).toBe(401);
  });

  it("POST /api/auth/logout — invalidates session", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password });
    const token = loginRes.body.access_token;

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(logoutRes.status).toBe(204);
  });
});
