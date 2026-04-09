# Progress Log

## Format: [date] [phase] — Description

---

## April 2026

### Phase 1: Research + Evidence Collection ✅

- [2026-04-09] Phase 1 start
- [2026-04-09] docs/research/web-analysis.md — Completed (public sources only, cited)
- [2026-04-09] docs/research/ios-analysis.md — Completed (App Store public data + hypotheses)
- [2026-04-09] docs/research/android-analysis.md — Completed (Play Store public data + hypotheses)
- [2026-04-09] docs/research/tech-stack-observed.md — Completed (observed + hypotheses with confidence scores)
- [2026-04-09] docs/research/external-integrations.md — Completed (public API + partner integrations)
- [2026-04-09] docs/research/public-api-opportunities.md — Completed (public API analysis + adapter patterns)

### Phase 1b: Onboarding Decomposition ✅

- [2026-04-09] docs/onboarding/onboarding-master-map.md — Completed (all phases, branches, risk flags)
- [2026-04-09] docs/onboarding/question-tree.json — Completed (full branching tree, all entity types)
- [2026-04-09] docs/onboarding/country-language-matrix.csv — Completed (26 countries, languages, ID types, banking formats, regulatory frameworks)
- [2026-04-09] docs/onboarding/individual-vs-business-flows.md — Completed (5 entity types, KYC vs KYB decision logic, fallback paths)
- [2026-04-09] docs/onboarding/kyc-kyb-decision-table.csv — Completed (decision matrix for all entity types)

### Phase 2: Architecture Proposal ✅

- [2026-04-09] docs/architecture/ — Mermaid diagram + service topology
- [2026-04-09] OpenAPI spec written (lib/api-spec/openapi.yaml) — all services defined

### Phase 3: Scaffold Monorepo + Backend ✅

- [2026-04-09] Web app artifact created (react-vite at /)
- [2026-04-09] **Mobile app NOT created** — deferred; design doc only at docs/architecture/mobile-plan.md
- [2026-04-09] Backend routes implemented across auth, onboarding, merchant, payments, products
- [2026-04-09] Database schema defined (Drizzle ORM)

### Phase 4: Onboarding Engine ✅

- [2026-04-09] Backend onboarding state machine implemented (tree-based, driven from question-tree.json)
- [2026-04-09] Branching logic for individual/sole_trader/company flows
- [2026-04-09] KYC simulation service
- [2026-04-09] Country-aware question resolution

### Phase 5: Web Frontend ✅ | Mobile — DEFERRED ❌

- [2026-04-09] Web frontend: Merchant dashboard, onboarding flow, payments UI — IMPLEMENTED
- [2026-04-09] **Mobile frontend: NOT IMPLEMENTED** — Expo app is not in this repo. Marked deferred in Phase F.

### Phase 6: Tests + Docs ✅

- [2026-04-09] Architecture diagram (Mermaid) added
- [2026-04-09] docker-compose.yml added
- [2026-04-09] README.md with local run instructions
- [2026-04-09] Integration tests for onboarding branching logic

---

## Known Gaps

1. Real payment processing (uses simulation — no live card data)
2. Real KYC provider integration (uses mock/simulated responses)
3. Real Bluetooth card reader pairing (mobile simulates reader)
4. Production email/SMS delivery (uses mock responses)
5. Real bank account validation (mock IBAN/sort code validation)
6. Webhook delivery to external systems (stubs only)
7. **Mobile app (Expo) — NOT IMPLEMENTED** — deferred to a future phase
8. App Store / Play Store submission configuration (mobile deferred)
9. Full i18n translation strings (English only, architecture supports multi-language)
10. Production-grade rate limiting and DDoS protection

## Next 10 Prioritized Tasks

1. Integrate real KYC provider (Onfido or Jumio API — requires vendor contract)
2. Integrate real payment acquirer (requires acquiring contract)
3. Add full i18n string support for all 29 supported languages
4. Implement real SMS/email OTP delivery (Twilio/SendGrid)
5. Add production-grade fraud scoring model
6. Implement webhook delivery system with retry logic
7. Add Apple Pay / Google Pay to web checkout
8. Build multi-language onboarding question tree resolution
9. Add advanced analytics dashboard (cohort analysis, funnel metrics)
10. **Implement Expo mobile app** (reader pairing, transaction flow, onboarding — currently deferred)

---

### Phase A–F: Multi-Phase Hardening Plan ✅

- [2026-04-09] Phase A — README.md, docker-compose.yml, .env.example created
- [2026-04-09] Phase B — TypeScript errors fixed: `req.params["transactionId"]` (payments.ts), `req.params["productId"]` (products.ts×3), refund mutation `data: {}` (transactions.tsx). `pnpm run typecheck` clean.
- [2026-04-09] Phase C — `GET /api/onboarding/question-tree` now loads from `docs/onboarding/question-tree.json` (single source of truth, cached in-memory)
- [2026-04-09] Phase D — Auth hardening: JWT `jti` for uniqueness; refresh token validated against DB-stored copy; token rotation attack prevention (reuse returns 401); auth rate limiter (20 req/15min, skipped in test); body size limit 1MB; `SESSION_SECRET` startup crash guard in production
- [2026-04-09] Phase E — Vitest integration tests: 21 tests across auth/payments/onboarding suites.
- [2026-04-09] Phase F — **Mobile app explicitly deferred (NOT IMPLEMENTED).** Design doc at docs/architecture/mobile-plan.md.

### Phase v1.1: Truth-Gap Closure ✅

- [2026-04-09] Phase 1 — Docs/Reality Alignment: README fixed (migrate→push, seed commands, docker note, onboarding paths, build constraints)
- [2026-04-09] Phase 2 — Dev UX: `lib/db` gained `migrate` alias for `drizzle-kit push`; real `seed` script in `scripts/src/seed.ts` (idempotent, creates 1 merchant + 5 products + 30 transactions + 3 payouts)
- [2026-04-09] Phase 3 — Docker Compose: `artifacts/api-server/Dockerfile.dev` + `artifacts/web-app/Dockerfile.dev` created; `docker compose config` validates cleanly; `version:` obsolete field removed
- [2026-04-09] Phase 4 — CI: a GitHub Actions workflow was created (later permanently removed — see v1.4 policy: no GitHub Actions CI)
- [2026-04-09] Phase 5 — Onboarding Integrity: Step engine replaced with tree-based resolver from question-tree.json; `step_id !== current_step` → 409 StepConflict enforced; required field validation (422 on missing fields); 8 tests covering out-of-order, re-submit, skip-ahead, individual/company/sole_trader branch divergence
- [2026-04-09] Phase 6 — Verification: typecheck ✅ (4/4 clean), tests ✅ (25/25), api-server build ✅, docker compose config ✅, seed ✅

### Phase v1.2: Cross-Platform + Quality Improvements ✅

- [2026-04-09] Phase 1 — Docs truth restored: progress-log.md Phase 3/5 mobile claims corrected; architecture-diagram.md updated to modular-monolith pattern; mobile removed from diagram (marked DEFERRED)
- [2026-04-09] Phase 2 — A GitHub Actions workflow was created during this phase (later permanently removed in v1.4 — not present in HEAD)
- [2026-04-09] Phase 3 — Cross-platform: `preinstall` now uses `scripts/check-package-manager.mjs` (Node.js, works on Linux/macOS/Windows); rollup/esbuild overrides documented as Linux x64 only in README
- [2026-04-09] Phase 4 — Onboarding polish: added 422 required-field tests (2 new tests → 27 total); fixed DK bank_format in country-language-matrix.csv (added local Reg+Kontonummer note); README test count corrected to 27
- [2026-04-09] Verification: typecheck ✅ (4/4 clean), tests ✅ (27/27)

---

### Phase v1.3: Zero Truth Gaps + Cross-Platform Fix ✅

- [2026-04-09] Phase 1 — A GitHub Actions workflow was transiently restored then permanently removed in v1.4
- [2026-04-09] Phase 2 — `scripts/check-package-manager.mjs`: replaced URL pathname with `fileURLToPath(import.meta.url)` + `dirname()` (cross-platform Node.js path resolution)
- [2026-04-09] Phase 3 — DK COUNTRIES entry fixed: `bank_format: "IBAN+BIC|Reg+Kontonummer (local)"`, `regulatory_framework: "Finanstilsynet"` (separated previously conflated values); country count documented as 20 runtime / 26 CSV; DK integrity test added
- [2026-04-09] Phase 4 — All stale test counts corrected to 28 (verified); CSV country count corrected to 26 (verified)

Verified outputs (v1.3, Linux x64 / Replit):
- `pnpm run typecheck` → 4/4 packages clean
- `pnpm --filter @workspace/api-server run test` → 28/28 pass
- `pnpm --filter @workspace/api-server run build` → ⚡ Done in ~1.2s

### Phase v1.4: No-CI Truthful State ✅

**Policy (permanent):** This repository has no GitHub Actions CI. The quality gate runs locally via `pnpm run verify:replit` on Replit / Linux x64.

State at v1.4 start:
- GitHub Actions workflow file — ABSENT (correct per policy)
- README.md — still referenced it → REMOVED; CI section replaced with Quality Gate section
- replit.md — still referenced it → REMOVED
- docs/progress-log.md — multiple historical references → CORRECTED to use neutral wording

Changes:
- [2026-04-09] Phase 1 — All GitHub Actions workflow references removed from README.md, replit.md, docs/progress-log.md; CI section replaced with "Quality Gate (Replit / Linux)" in README.md
- [2026-04-09] Phase 2 — `scripts/check-no-github-ci.mjs` created: fails if the workflow file exists OR if tracked docs reference it; `verify:policy` and `verify:replit` scripts added to package.json
- [2026-04-09] Phase 3 — Counts confirmed consistent: 20 runtime countries, 26 CSV countries, 28 tests

Verified outputs (Linux x64 / Replit):
- `pnpm run verify:policy` → ✅ all checks pass
- `pnpm run typecheck` → 4/4 packages clean
- `pnpm --filter @workspace/api-server run test` → 28/28 pass
- `pnpm --filter @workspace/api-server run build` → ⚡ Done

Current HEAD truth table:
- GitHub Actions workflow file exists: **NO**
- Any doc references the workflow file path: **NO**
- Runtime country count: **20**
- CSV country count: **26**
- Test count: **28**
- Supported environment: **Linux x64 only** (pnpm-workspace.yaml excludes all other platform binaries)
