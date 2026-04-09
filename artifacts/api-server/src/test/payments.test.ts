import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";

const uniqueEmail = () => `pay-test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.payos.io`;

describe("Payments routes", () => {
  let accessToken: string;
  let transactionId: string;

  beforeAll(async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "TestPass123!", first_name: "Pay", last_name: "Test" });
    accessToken = res.body.access_token;
  });

  it("GET /api/payments/transactions — requires auth", async () => {
    const res = await request(app).get("/api/payments/transactions");
    expect(res.status).toBe(401);
  });

  it("GET /api/payments/transactions — returns list when authed", async () => {
    const res = await request(app)
      .get("/api/payments/transactions")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items ?? res.body)).toBe(true);
  });

  it("POST /api/payments/transactions — creates transaction", async () => {
    const res = await request(app)
      .post("/api/payments/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 4999, currency: "GBP", payment_method: "card", description: "Test coffee" });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(4999);
    expect(res.body.status).toBe("successful");
    transactionId = res.body.id;
  });

  it("GET /api/payments/transactions/:id — fetches by id", async () => {
    const res = await request(app)
      .get(`/api/payments/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(transactionId);
  });

  it("GET /api/payments/transactions/:id — 404 for unknown id", async () => {
    const res = await request(app)
      .get("/api/payments/transactions/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it("POST /api/payments/transactions/:id/refund — refunds transaction", async () => {
    const res = await request(app)
      .post(`/api/payments/transactions/${transactionId}/refund`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("refunded");
  });

  it("GET /api/payments/summary — returns revenue stats", async () => {
    const res = await request(app)
      .get("/api/payments/summary?period=month")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("total_volume");
    expect(res.body).toHaveProperty("total_transactions");
    expect(Array.isArray(res.body.daily_breakdown)).toBe(true);
  });
});
