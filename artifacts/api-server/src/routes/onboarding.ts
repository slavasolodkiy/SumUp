import { Router } from "express";
import { db } from "@workspace/db";
import { onboardingSessionsTable, merchantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { SubmitOnboardingStepBody, SubmitKycVerificationBody } from "@workspace/api-zod";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const _dir = dirname(fileURLToPath(import.meta.url));
const QUESTION_TREE_PATH = resolve(_dir, "../../../../docs/onboarding/question-tree.json");
let _questionTreeCache: unknown = null;

function getQuestionTree(): unknown {
  if (_questionTreeCache) return _questionTreeCache;
  try {
    _questionTreeCache = JSON.parse(readFileSync(QUESTION_TREE_PATH, "utf-8"));
  } catch {
    _questionTreeCache = { error: "question-tree.json not found", path: QUESTION_TREE_PATH };
  }
  return _questionTreeCache;
}

const QUESTION_STEPS = [
  "q_country", "q_business_type", "q_personal_name", "q_dob", "q_personal_address",
  "q_phone", "q_phone_otp", "q_business_name", "q_business_category", "q_monthly_turnover",
  "q_id_type", "q_upload_document", "q_selfie", "q_bank_details", "q_review"
];

const BUSINESS_STEPS = [
  "q_country", "q_business_type", "q_company_name", "q_company_reg_number", "q_company_address",
  "q_vat", "q_director_details", "q_ubo", "q_company_documents", "q_company_personal_id",
  "q_id_type", "q_upload_document", "q_selfie", "q_bank_details", "q_review"
];

const COUNTRIES = [
  { code: "GB", name: "United Kingdom", currency: "GBP", languages: ["en"], bank_format: "sort_code+account", regulatory_framework: "FCA" },
  { code: "DE", name: "Germany", currency: "EUR", languages: ["de", "en"], bank_format: "IBAN+BIC", regulatory_framework: "BaFin" },
  { code: "FR", name: "France", currency: "EUR", languages: ["fr", "en"], bank_format: "IBAN+BIC", regulatory_framework: "ACPR" },
  { code: "ES", name: "Spain", currency: "EUR", languages: ["es", "en"], bank_format: "IBAN+BIC", regulatory_framework: "Banco de España" },
  { code: "IT", name: "Italy", currency: "EUR", languages: ["it", "en"], bank_format: "IBAN+BIC", regulatory_framework: "Banca d'Italia" },
  { code: "AT", name: "Austria", currency: "EUR", languages: ["de", "en"], bank_format: "IBAN+BIC", regulatory_framework: "FMA" },
  { code: "BE", name: "Belgium", currency: "EUR", languages: ["fr", "nl", "en"], bank_format: "IBAN+BIC", regulatory_framework: "NBB" },
  { code: "NL", name: "Netherlands", currency: "EUR", languages: ["nl", "en"], bank_format: "IBAN+BIC", regulatory_framework: "DNB" },
  { code: "CH", name: "Switzerland", currency: "CHF", languages: ["de", "fr", "it", "en"], bank_format: "IBAN+BIC", regulatory_framework: "FINMA" },
  { code: "SE", name: "Sweden", currency: "SEK", languages: ["sv", "en"], bank_format: "IBAN+BIC", regulatory_framework: "Finansinspektionen" },
  { code: "DK", name: "Denmark", currency: "DKK", languages: ["da", "en"], bank_format: "IBAN+BIC", regulatory_framework: "Finanstilsynet" },
  { code: "NO", name: "Norway", currency: "NOK", languages: ["nb", "en"], bank_format: "IBAN+BIC", regulatory_framework: "Finanstilsynet NO" },
  { code: "FI", name: "Finland", currency: "EUR", languages: ["fi", "sv", "en"], bank_format: "IBAN+BIC", regulatory_framework: "FIN-FSA" },
  { code: "PL", name: "Poland", currency: "PLN", languages: ["pl", "en"], bank_format: "IBAN+BIC", regulatory_framework: "KNF" },
  { code: "IE", name: "Ireland", currency: "EUR", languages: ["en", "ga"], bank_format: "IBAN+BIC", regulatory_framework: "CBI" },
  { code: "PT", name: "Portugal", currency: "EUR", languages: ["pt", "en"], bank_format: "IBAN+BIC", regulatory_framework: "Banco de Portugal" },
  { code: "CZ", name: "Czech Republic", currency: "CZK", languages: ["cs", "en"], bank_format: "IBAN+BIC", regulatory_framework: "CNB" },
  { code: "US", name: "United States", currency: "USD", languages: ["en"], bank_format: "routing+account", regulatory_framework: "FinCEN" },
  { code: "BR", name: "Brazil", currency: "BRL", languages: ["pt-BR"], bank_format: "CPF+bank_code+agency+account", regulatory_framework: "BACEN" },
  { code: "AU", name: "Australia", currency: "AUD", languages: ["en"], bank_format: "BSB+account", regulatory_framework: "AUSTRAC" },
];

function getNextStep(currentStep: string, answers: Record<string, unknown>): string {
  const businessType = answers["business_type"] as string || "individual";
  const isCompany = ["registered_company", "partnership", "charity"].includes(businessType);
  const steps = isCompany ? BUSINESS_STEPS : QUESTION_STEPS;
  const idx = steps.indexOf(currentStep);
  if (idx === -1 || idx >= steps.length - 1) return "complete";
  return steps[idx + 1];
}

function getProgress(currentStep: string, answers: Record<string, unknown>): number {
  const businessType = answers["business_type"] as string || "individual";
  const isCompany = ["registered_company", "partnership", "charity"].includes(businessType);
  const steps = isCompany ? BUSINESS_STEPS : QUESTION_STEPS;
  const idx = steps.indexOf(currentStep);
  if (idx === -1) return 0;
  return Math.round((idx / (steps.length - 1)) * 100);
}

function buildNextQuestion(step: string, answers: Record<string, unknown>) {
  const country = answers["country"] as string || "GB";
  const questionMap: Record<string, object> = {
    q_country: {
      id: "q_country", type: "select", question: "Where is your business based?", field: "country",
      options: COUNTRIES.map(c => ({ value: c.code, label: c.name }))
    },
    q_business_type: {
      id: "q_business_type", type: "select", question: "Which best describes your business?", field: "business_type",
      options: [
        { value: "individual", label: "I'm an individual (not registered)" },
        { value: "sole_trader", label: "Sole trader / self-employed" },
        { value: "registered_company", label: "Registered company (Ltd, GmbH, SAS, etc.)" },
        { value: "partnership", label: "Partnership" },
        { value: "charity", label: "Charity / non-profit" },
      ]
    },
    q_personal_name: { id: "q_personal_name", type: "name", question: "What is your full legal name?", hint: "Use your name exactly as it appears on your ID" },
    q_dob: { id: "q_dob", type: "date", question: "What is your date of birth?", field: "date_of_birth" },
    q_personal_address: { id: "q_personal_address", type: "address", question: "What is your home address?" },
    q_phone: { id: "q_phone", type: "tel", question: "What is your mobile number?", hint: "We'll send a verification code", field: "phone" },
    q_phone_otp: { id: "q_phone_otp", type: "otp", question: "Enter the 6-digit code sent to your phone", field: "phone_otp" },
    q_business_name: { id: "q_business_name", type: "text", question: "What is your business or trading name?", hint: "This will appear on receipts", field: "business_name" },
    q_business_category: {
      id: "q_business_category", type: "select", question: "What type of business are you?", field: "business_category",
      options: [
        { value: "food_drink", label: "Food & Drink" },
        { value: "retail", label: "Retail" },
        { value: "health_beauty", label: "Health & Beauty" },
        { value: "sport_fitness", label: "Sport & Fitness" },
        { value: "services", label: "Services" },
        { value: "events", label: "Events & Entertainment" },
        { value: "charity", label: "Charity & Non-profit" },
        { value: "other", label: "Other" },
      ]
    },
    q_monthly_turnover: {
      id: "q_monthly_turnover", type: "select", question: "What is your estimated monthly card turnover?", field: "estimated_monthly_turnover",
      options: [
        { value: "0-1000", label: "Under £1,000 / €1,000" },
        { value: "1001-5000", label: "£1,001 – £5,000" },
        { value: "5001-15000", label: "£5,001 – £15,000" },
        { value: "15001-50000", label: "£15,001 – £50,000" },
        { value: "50001+", label: "Over £50,000" },
      ]
    },
    q_id_type: {
      id: "q_id_type", type: "select", question: "What type of ID document will you use?", field: "id_type",
      options: country === "US" || country === "AU"
        ? [{ value: "passport", label: "Passport" }, { value: "driving_licence", label: "Driving licence" }]
        : [{ value: "passport", label: "Passport" }, { value: "national_id", label: "National ID card" }, { value: "driving_licence", label: "Driving licence" }]
    },
    q_upload_document: { id: "q_upload_document", type: "document_upload", question: "Upload a photo of your identity document", field: "document_front_base64" },
    q_selfie: { id: "q_selfie", type: "liveness_check", question: "Take a selfie to verify your identity", hint: "Look directly at the camera", field: "selfie_base64" },
    q_bank_details: { id: "q_bank_details", type: "bank_details", question: "Add your bank account for payouts" },
    q_review: { id: "q_review", type: "review", question: "Review your information before submitting" },
    q_company_name: { id: "q_company_name", type: "text", question: "What is your company's legal name?", field: "company_name" },
    q_company_reg_number: { id: "q_company_reg_number", type: "text", question: "What is your company registration number?", hint: "Find this on your certificate of incorporation", field: "company_registration_number" },
    q_company_address: { id: "q_company_address", type: "address", question: "What is your registered company address?" },
    q_vat: { id: "q_vat", type: "toggle_text", question: "Are you VAT registered?", field: "vat_registered" },
    q_director_details: { id: "q_director_details", type: "person_details", question: "Tell us about the company director / authorised signatory" },
    q_ubo: { id: "q_ubo", type: "ubo_declaration", question: "Are there any individuals who own 25% or more of the company?", field: "has_ubo" },
    q_company_documents: { id: "q_company_documents", type: "document_upload", question: "Upload your certificate of incorporation", field: "certificate_of_incorporation" },
    q_company_personal_id: { id: "q_company_personal_id", type: "info", question: "We also need to verify the identity of the authorised signatory." },
  };
  return questionMap[step] || null;
}

const router = Router();

router.get("/onboarding/session", requireAuth, async (req, res) => {
  const [session] = await db.select().from(onboardingSessionsTable)
    .where(eq(onboardingSessionsTable.merchantId, req.merchantId!))
    .orderBy(onboardingSessionsTable.createdAt)
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "NotFound", message: "No onboarding session found" });
    return;
  }

  const answers = session.answers as Record<string, unknown>;
  res.json(formatSession(session, buildNextQuestion(session.currentStep, answers)));
});

router.post("/onboarding/session", requireAuth, async (req, res) => {
  const existing = await db.select().from(onboardingSessionsTable)
    .where(eq(onboardingSessionsTable.merchantId, req.merchantId!))
    .limit(1);

  if (existing.length > 0) {
    const answers = existing[0].answers as Record<string, unknown>;
    res.status(201).json(formatSession(existing[0], buildNextQuestion(existing[0].currentStep, answers)));
    return;
  }

  const [session] = await db.insert(onboardingSessionsTable).values({
    merchantId: req.merchantId!,
    currentStep: "q_country",
    status: "in_progress",
    answers: {},
    progressPercent: 0,
  }).returning();

  res.status(201).json(formatSession(session, buildNextQuestion("q_country", {})));
});

router.post("/onboarding/session/step", requireAuth, async (req, res) => {
  const parsed = SubmitOnboardingStepBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "step_id and answer required" });
    return;
  }

  const [session] = await db.select().from(onboardingSessionsTable)
    .where(eq(onboardingSessionsTable.merchantId, req.merchantId!))
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "NotFound", message: "No session found" });
    return;
  }

  const currentAnswers = session.answers as Record<string, unknown>;
  const newAnswers = { ...currentAnswers, ...parsed.data.answer };
  const nextStep = getNextStep(parsed.data.step_id, newAnswers);
  const progress = getProgress(nextStep, newAnswers);

  let newStatus = session.status;
  if (nextStep === "complete" || parsed.data.step_id === "q_review") {
    newStatus = "submitted";
    const turnover = newAnswers["estimated_monthly_turnover"] as string;
    if (turnover === "50001+") {
      newStatus = "manual_review";
    } else {
      setTimeout(async () => {
        await db.update(onboardingSessionsTable)
          .set({ status: "approved" })
          .where(eq(onboardingSessionsTable.id, session.id));
        await db.update(merchantsTable)
          .set({ status: "active", onboardingStatus: "approved", country: (newAnswers["country"] as string) || "GB", updatedAt: new Date() })
          .where(eq(merchantsTable.id, req.merchantId!));
      }, 2000);
    }
  }

  const [updated] = await db.update(onboardingSessionsTable)
    .set({
      currentStep: nextStep === "complete" ? "q_review" : nextStep,
      answers: newAnswers,
      progressPercent: progress,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(onboardingSessionsTable.id, session.id))
    .returning();

  if (newAnswers["country"]) {
    await db.update(merchantsTable)
      .set({ country: newAnswers["country"] as string, onboardingStatus: "in_progress", status: "onboarding_in_progress", updatedAt: new Date() })
      .where(eq(merchantsTable.id, req.merchantId!));
  }

  const nextQ = nextStep === "complete" ? null : buildNextQuestion(nextStep, newAnswers);
  res.json(formatSession(updated, nextQ));
});

router.post("/onboarding/session/kyc/verify", requireAuth, async (req, res) => {
  const parsed = SubmitKycVerificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ValidationError", message: "id_type required" });
    return;
  }

  const sessionId = `kyc_sim_${Date.now()}`;
  const randomOutcome = Math.random();
  let status: "pending" | "approved" | "rejected" | "manual_review";
  let message: string;

  if (randomOutcome < 0.85) {
    status = "approved";
    message = "Identity verified successfully";
  } else if (randomOutcome < 0.92) {
    status = "manual_review";
    message = "Your documents are being reviewed by our team";
  } else {
    status = "rejected";
    message = "We could not verify your identity. Please try again with clearer photos.";
  }

  await db.update(onboardingSessionsTable)
    .set({ kycSessionId: sessionId, kycStatus: status, updatedAt: new Date() })
    .where(eq(onboardingSessionsTable.merchantId, req.merchantId!));

  res.json({ status, session_id: sessionId, message });
});

router.get("/onboarding/countries", async (_req, res) => {
  res.json(COUNTRIES);
});

router.get("/onboarding/question-tree", (_req, res) => {
  res.json(getQuestionTree());
});

function formatSession(s: typeof onboardingSessionsTable.$inferSelect, nextQuestion: object | null) {
  return {
    id: s.id,
    merchant_id: s.merchantId,
    current_step: s.currentStep,
    status: s.status,
    answers: s.answers,
    next_question: nextQuestion,
    progress_percent: s.progressPercent,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

export { router as onboardingRouter };
