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
- [2026-04-09] docs/onboarding/country-language-matrix.csv — Completed (27 countries, languages, ID types, banking formats, regulatory frameworks)
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
- [2026-04-09] Phase 4 — CI: `.github/workflows/ci.yml` created — **NOTE: removed in a subsequent commit and must be restored**
- [2026-04-09] Phase 5 — Onboarding Integrity: Step engine replaced with tree-based resolver from question-tree.json; `step_id !== current_step` → 409 StepConflict enforced; required field validation (422 on missing fields); 8 tests covering out-of-order, re-submit, skip-ahead, individual/company/sole_trader branch divergence
- [2026-04-09] Phase 6 — Verification: typecheck ✅ (4/4 clean), tests ✅ (25/25), api-server build ✅, docker compose config ✅, seed ✅

### Phase v1.2: Cross-Platform + CI Restoration ✅

Verified state at start of v1.2:
- `.github/workflows/ci.yml` — MISSING (removed in prior commit) → RESTORED
- `docs/progress-log.md` — stale mobile claims → CORRECTED
- `docs/architecture/architecture-diagram.md` — claimed microservices, included mobile → CORRECTED (modular-monolith, mobile marked deferred)
- `package.json preinstall` — used `sh` (broken on Windows) → REPLACED with Node.js script

- [2026-04-09] Phase 1 — Docs truth restored: progress-log.md Phase 3/5 mobile claims corrected; architecture-diagram.md updated to modular-monolith pattern; mobile removed from diagram (marked DEFERRED)
- [2026-04-09] Phase 2 — CI restored: `.github/workflows/ci.yml` re-created with 5 jobs (install, typecheck, test+postgres, build-api, build-web with BASE_PATH placeholder)
- [2026-04-09] Phase 3 — Cross-platform: `preinstall` now uses `scripts/check-package-manager.mjs` (Node.js, works on Linux/macOS/Windows); rollup/esbuild overrides documented as Linux x64 only in README
- [2026-04-09] Phase 4 — Onboarding polish: added 422 required-field tests (2 new tests → 27 total); fixed DK bank_format in country-language-matrix.csv (added local Reg+Kontonummer note); README test count corrected to 27
- [2026-04-09] Verification: typecheck ✅ (4/4 clean), tests ✅ (27/27)

---

## CI Status Guard

**Rule:** The entry "CI workflow exists" may only appear in this log when `.github/workflows/ci.yml` exists in HEAD.
Current state: `.github/workflows/ci.yml` — **EXISTS** (restored in v1.2)
