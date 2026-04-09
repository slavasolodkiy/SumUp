import { Router } from "express";
import { db } from "@workspace/db";
import { onboardingSessionsTable, merchantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { SubmitOnboardingStepBody, SubmitKycVerificationBody } from "@workspace/api-zod";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Question tree loader ────────────────────────────────────────────────────

const _dir = dirname(fileURLToPath(import.meta.url));
const QUESTION_TREE_PATH = resolve(_dir, "../../../../docs/onboarding/question-tree.json");

interface TreeNode {
  id: string;
  type: string;
  question: string;
  field?: string;
  required?: string[];
  options?: Array<{ value: string; label: string }>;
  next?: Record<string, string>;
}

interface QuestionTree {
  version: string;
  root: string;
  nodes: Record<string, TreeNode>;
}

let _treeCache: QuestionTree | null = null;

function getTree(): QuestionTree {
  if (_treeCache) return _treeCache;
  try {
    _treeCache = JSON.parse(readFileSync(QUESTION_TREE_PATH, "utf-8")) as QuestionTree;
  } catch (err) {
    throw new Error(`Failed to load question-tree.json at ${QUESTION_TREE_PATH}: ${err}`);
  }
  return _treeCache;
}

// ── Tree engine ────────────────────────────────────────────────────────────

/**
 * Resolve the next step by evaluating the current node's `next` map
 * against the submitted answer.
 *
 * Resolution order:
 *  1. If the node has a `field`, look up the answer value for that field in `next`
 *  2. Fall back to `next.default`
 *  3. If nothing matches, return "complete"
 */
function resolveNextStep(nodeId: string, answers: Record<string, unknown>): string {
  const tree = getTree();
  const node = tree.nodes[nodeId];
  if (!node || !node.next) return "complete";

  const nextMap = node.next;

  if (node.field) {
    const answerValue = String(answers[node.field] ?? "");
    if (answerValue && nextMap[answerValue]) return nextMap[answerValue]!;
  }

  return nextMap["default"] ?? "complete";
}

/**
 * Compute progress as the approximate position of `nodeId` in the reachable path
 * from the root, following default/first-option branches.
 */
function computeProgress(nodeId: string, answers: Record<string, unknown>): number {
  const tree = getTree();
  const visited = new Set<string>();
  let current = tree.root;
  let position = 0;
  let total = 0;
  let found = false;

  while (current !== "complete" && !visited.has(current)) {
    visited.add(current);
    total++;
    if (current === nodeId) {
      found = true;
      position = total;
    }
    const node = tree.nodes[current];
    if (!node) break;
    current = resolveNextStep(current, answers);
  }

  if (!found) return 0;
  return Math.min(100, Math.round((position / Math.max(total, 1)) * 100));
}

/**
 * Validate required fields for the current node.
 * Returns a list of missing field names.
 */
function validateStep(nodeId: string, answer: Record<string, unknown>): string[] {
  const tree = getTree();
  const node = tree.nodes[nodeId];
  if (!node) return [];

  const missing: string[] = [];

  if (node.required && Array.isArray(node.required)) {
    for (const field of node.required) {
      const v = answer[field];
      if (v === undefined || v === null || v === "") missing.push(field);
    }
    return missing;
  }

  if (node.field && ["select", "text", "tel", "date"].includes(node.type)) {
    const v = answer[node.field];
    if (v === undefined || v === null || v === "") missing.push(node.field);
  }

  return missing;
}

// ── Country list (kept local — read from tree on open endpoint) ────────────

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
  { code: "DK", name: "Denmark", currency: "DKK", languages: ["da", "en"], bank_format: "IBAN+BIC|Reg+Kontonummer (local)", regulatory_framework: "Finanstilsynet" },
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

// ── Question renderer ───────────────────────────────────────────────────────

function buildNextQuestion(stepId: string, answers: Record<string, unknown>): TreeNode | null {
  const tree = getTree();
  const node = tree.nodes[stepId];
  if (!node) return null;

  if (node.id === "q_id_type") {
    const country = String(answers["country"] ?? "GB");
    const options = country === "US" || country === "AU"
      ? [{ value: "passport", label: "Passport" }, { value: "driving_licence", label: "Driving licence" }]
      : [{ value: "passport", label: "Passport" }, { value: "national_id", label: "National ID card" }, { value: "driving_licence", label: "Driving licence" }];
    return { ...node, options };
  }

  return node;
}

// ── Router ─────────────────────────────────────────────────────────────────

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
    const answers = existing[0]!.answers as Record<string, unknown>;
    res.status(200).json(formatSession(existing[0]!, buildNextQuestion(existing[0]!.currentStep, answers)));
    return;
  }

  const tree = getTree();
  const [session] = await db.insert(onboardingSessionsTable).values({
    merchantId: req.merchantId!,
    currentStep: tree.root,
    status: "in_progress",
    answers: {},
    progressPercent: 0,
  }).returning();

  res.status(201).json(formatSession(session!, buildNextQuestion(tree.root, {})));
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
    res.status(404).json({ error: "NotFound", message: "No session found. POST /onboarding/session first." });
    return;
  }

  // ── Integrity enforcement: step must match current session step ──────────
  if (parsed.data.step_id !== session.currentStep) {
    res.status(409).json({
      error: "StepConflict",
      message: `Cannot submit step "${parsed.data.step_id}" — session is currently on step "${session.currentStep}".`,
      expected_step: session.currentStep,
      submitted_step: parsed.data.step_id,
    });
    return;
  }

  // ── Required field validation ──────────────────────────────────────────
  const missingFields = validateStep(parsed.data.step_id, parsed.data.answer);
  if (missingFields.length > 0) {
    res.status(422).json({
      error: "ValidationError",
      message: `Required fields missing: ${missingFields.join(", ")}`,
      missing_fields: missingFields,
    });
    return;
  }

  const currentAnswers = session.answers as Record<string, unknown>;
  const newAnswers = { ...currentAnswers, ...parsed.data.answer };

  // ── Next step resolution from question tree ────────────────────────────
  const nextStep = resolveNextStep(parsed.data.step_id, newAnswers);
  const progress = computeProgress(nextStep, newAnswers);

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

  const persistStep = nextStep === "complete" ? "q_review" : nextStep;

  const [updated] = await db.update(onboardingSessionsTable)
    .set({
      currentStep: persistStep,
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
  res.json(formatSession(updated!, nextQ));
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
  res.json(getTree());
});

function formatSession(s: typeof onboardingSessionsTable.$inferSelect, nextQuestion: TreeNode | null) {
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
