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

async function setupSession(token: string): Promise<void> {
  await request(app)
    .post("/api/onboarding/session")
    .set("Authorization", `Bearer ${token}`);
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
    // Runtime list is a curated subset of 20 countries
    // (research CSV has 26; these are the countries where PayOS is active)
    expect(res.body.length).toBe(20);
    const gb = res.body.find((c: { code: string }) => c.code === "GB");
    expect(gb).toBeDefined();
    expect(gb.currency).toBe("GBP");
  });

  it("GET /api/onboarding/countries — DK entry has correct bank_format and regulatory_framework", async () => {
    const res = await request(app).get("/api/onboarding/countries");
    expect(res.status).toBe(200);
    const dk = res.body.find((c: { code: string }) => c.code === "DK");
    expect(dk).toBeDefined();
    expect(dk.currency).toBe("DKK");
    // bank_format must NOT be the regulatory body name (prior bug: "Finanstilsynet")
    expect(dk.bank_format).not.toBe("Finanstilsynet");
    expect(dk.bank_format).toContain("IBAN");
    expect(dk.regulatory_framework).toBeDefined();
    expect(dk.regulatory_framework).toContain("Finanstilsynet");
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

  it("POST /api/onboarding/session — starts a new session at tree root", async () => {
    const res = await request(app)
      .post("/api/onboarding/session")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("current_step");
    expect(res.body.current_step).toBe("q_country");
    expect(res.body.next_question?.id).toBe("q_country");
  });

  it("GET /api/onboarding/session — returns current session", async () => {
    const res = await request(app)
      .get("/api/onboarding/session")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("current_step");
  });

  it("POST /api/onboarding/session/step — advances to next question", async () => {
    const res = await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${token}`)
      .send({ step_id: "q_country", answer: { country: "GB" } });

    expect(res.status).toBe(200);
    expect(res.body.next_question?.id).toBe("q_business_type");
    expect(res.body.current_step).toBe("q_business_type");
  });

  // ── Integrity: out-of-order step returns 409 ─────────────────────────────

  it("POST /api/onboarding/session/step — 409 when submitting wrong step", async () => {
    const freshToken = await registerAndGetToken();
    await setupSession(freshToken);

    const res = await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_business_type", answer: { business_type: "individual" } });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("StepConflict");
    expect(res.body.expected_step).toBe("q_country");
    expect(res.body.submitted_step).toBe("q_business_type");
  });

  it("POST /api/onboarding/session/step — 409 when skipping ahead multiple steps", async () => {
    const freshToken = await registerAndGetToken();
    await setupSession(freshToken);

    await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_country", answer: { country: "GB" } });

    const res = await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_personal_name", answer: { first_name: "Alice", last_name: "Smith" } });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("StepConflict");
    expect(res.body.expected_step).toBe("q_business_type");
  });

  it("POST /api/onboarding/session/step — 409 when re-submitting a completed step", async () => {
    const freshToken = await registerAndGetToken();
    await setupSession(freshToken);

    await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_country", answer: { country: "GB" } });

    const resubmit = await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_country", answer: { country: "DE" } });

    expect(resubmit.status).toBe(409);
    expect(resubmit.body.expected_step).toBe("q_business_type");
  });

  // ── Branch integrity ────────────────────────────────────────────────────

  it("POST /api/onboarding/session/step — individual branch goes to q_personal_name", async () => {
    const freshToken = await registerAndGetToken();
    await setupSession(freshToken);

    await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_country", answer: { country: "GB" } });

    const res = await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_business_type", answer: { business_type: "individual" } });

    expect(res.status).toBe(200);
    expect(res.body.next_question?.id).toBe("q_personal_name");
  });

  it("POST /api/onboarding/session/step — company branch goes to q_company_name", async () => {
    const freshToken = await registerAndGetToken();
    await setupSession(freshToken);

    await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_country", answer: { country: "DE" } });

    const res = await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_business_type", answer: { business_type: "registered_company" } });

    expect(res.status).toBe(200);
    expect(res.body.next_question?.id).toBe("q_company_name");
  });

  it("POST /api/onboarding/session/step — sole_trader branch goes to q_personal_name", async () => {
    const freshToken = await registerAndGetToken();
    await setupSession(freshToken);

    await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_country", answer: { country: "FR" } });

    const res = await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_business_type", answer: { business_type: "sole_trader" } });

    expect(res.status).toBe(200);
    expect(res.body.next_question?.id).toBe("q_personal_name");
  });

  // ── 422 Required-fields validation ──────────────────────────────────────

  it("POST /api/onboarding/session/step — 422 when required field missing (country step)", async () => {
    const freshToken = await registerAndGetToken();
    await setupSession(freshToken);

    const res = await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_country", answer: {} });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("ValidationError");
    expect(Array.isArray(res.body.missing_fields)).toBe(true);
    expect(res.body.missing_fields).toContain("country");
  });

  it("POST /api/onboarding/session/step — 422 when answer key present but value empty", async () => {
    const freshToken = await registerAndGetToken();
    await setupSession(freshToken);

    const res = await request(app)
      .post("/api/onboarding/session/step")
      .set("Authorization", `Bearer ${freshToken}`)
      .send({ step_id: "q_country", answer: { country: "" } });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("ValidationError");
    expect(res.body.missing_fields).toContain("country");
  });
});
