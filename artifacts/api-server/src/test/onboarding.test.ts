import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";

const uniqueEmail = () => `onboard-test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.payos.io`;

async function registerAndGetToken(): Promise<string> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: uniqueEmail(), password: "TestPass123!", first_name: "Onboard", last_name: "Tester" });
  return res.body.access_token as string;
}

describe("Onboarding routes", () => {
  let token: string;

  beforeAll(async () => {
    token = await registerAndGetToken();
  });

  it("GET /api/onboarding/countries — returns country list", async () => {
    const res = await request(app).get("/api/onboarding/countries");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(10);
    const gb = res.body.find((c: { code: string }) => c.code === "GB");
    expect(gb).toBeDefined();
    expect(gb.currency).toBe("GBP");
  });

  it("GET /api/onboarding/question-tree — returns full branching tree from JSON file", async () => {
    const res = await request(app).get("/api/onboarding/question-tree");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("version");
    expect(res.body).toHaveProperty("root");
    expect(res.body).toHaveProperty("nodes");
    expect(res.body.root).toBe("q_country");
    expect(Object.keys(res.body.nodes).length).toBeGreaterThan(5);
  });

  it("POST /api/onboarding/session — starts a new session", async () => {
    const res = await request(app)
      .post("/api/onboarding/session")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("current_step");
    expect(res.body).toHaveProperty("next_question");
    expect(res.body.next_question?.id).toBe("q_country");
  });

  it("GET /api/onboarding/session — returns current session", async () => {
    const res = await request(app)
      .get("/api/onboarding/session")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("current_step");
  });

  it("POST /api/onboarding/session/step — advances to next question (individual flow)", async () => {
    const res = await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${token}`)
      .send({ step_id: "q_country", answer: { country: "GB" } });

    expect(res.status).toBe(200);
    expect(res.body.next_question?.id).toBe("q_business_type");
  });

  it("POST /api/onboarding/session/step — individual branch skips company steps", async () => {
    await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${token}`)
      .send({ step_id: "q_business_type", answer: { business_type: "individual" } });

    const session = await request(app)
      .get("/api/onboarding/session")
      .set("Authorization", `Bearer ${token}`);

    expect(["q_personal_name", "q_dob"].includes(session.body.current_step)).toBe(true);
  });

  it("POST /api/onboarding/session/step — company branch takes different path", async () => {
    const companyToken = await registerAndGetToken();
    await request(app)
      .post("/api/onboarding/session")
      .set("Authorization", `Bearer ${companyToken}`);

    await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${companyToken}`)
      .send({ step_id: "q_country", answer: { country: "DE" } });

    const branchRes = await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${companyToken}`)
      .send({ step_id: "q_business_type", answer: { business_type: "registered_company" } });

    expect(branchRes.status).toBe(200);
    const nextId = branchRes.body.next_question?.id;
    expect(nextId).toBe("q_company_name");
  });
});
