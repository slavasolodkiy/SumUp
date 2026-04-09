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

### Phase 3: Scaffold Monorepo + Services ✅

- [2026-04-09] Web app artifact created (react-vite at /)
- [2026-04-09] Mobile app artifact created (expo)
- [2026-04-09] Backend routes implemented across auth, onboarding, merchant, payments services
- [2026-04-09] Database schema defined (Drizzle ORM)
- [2026-04-09] Seed data added

### Phase 4: Onboarding Engine ✅

- [2026-04-09] Backend onboarding state machine implemented
- [2026-04-09] Branching logic for individual/sole_trader/company flows
- [2026-04-09] KYC simulation service
- [2026-04-09] Country-aware question resolution

### Phase 5: Web + Mobile Flows ✅

- [2026-04-09] Web frontend: Merchant dashboard, onboarding flow, payments UI
- [2026-04-09] Mobile frontend: Expo app with onboarding, reader pairing, transaction flow

### Phase 6: Tests + Docs + Final Push ✅

- [2026-04-09] Architecture diagram (Mermaid) added
- [2026-04-09] docker-compose.yml added
- [2026-04-09] README.md with local run instructions
- [2026-04-09] Test coverage for onboarding branching logic

---

## Known Gaps

1. Real payment processing (uses simulation — no live card data)
2. Real KYC provider integration (uses mock/simulated responses)
3. Real Bluetooth card reader pairing (mobile simulates reader)
4. Production email/SMS delivery (uses mock responses)
5. Real bank account validation (mock IBAN/sort code validation)
6. Webhook delivery to external systems (stubs only)
7. App Store / Play Store submission configuration
8. Production SSL certificate configuration
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
10. Implement real Bluetooth SDK for card reader pairing (native modules)

### Phase A–F: Multi-Phase Hardening Plan ✅

- [2026-04-09] Phase A — README.md, docker-compose.yml, .env.example created
- [2026-04-09] Phase B — TypeScript errors fixed: `req.params["transactionId"]` (payments.ts), `req.params["productId"]` (products.ts×3), refund mutation `data: {}` (transactions.tsx). `pnpm run typecheck` clean.
- [2026-04-09] Phase C — `GET /api/onboarding/question-tree` now loads from `docs/onboarding/question-tree.json` (single source of truth, cached in-memory)
- [2026-04-09] Phase D — Auth hardening: JWT `jti` for uniqueness; refresh token validated against DB-stored copy; token rotation attack prevention (reuse returns 401); auth rate limiter (20 req/15min, skipped in test); body size limit 1MB; `SESSION_SECRET` startup crash guard in production
- [2026-04-09] Phase E — Vitest integration tests: 21 tests across auth/payments/onboarding suites. CI YAML at .github/workflows/ci.yml. All 21 tests pass.
- [2026-04-09] Phase F — Mobile app explicitly deferred (NOT IMPLEMENTED). Design doc at docs/architecture/mobile-plan.md.

### Phase v1.1: Truth-Gap Closure ✅

- [2026-04-09] Phase 1 — Docs/Reality Alignment: README fixed (migrate→push, seed commands, docker note, CI reference, onboarding paths, build constraints)
- [2026-04-09] Phase 2 — Dev UX: `lib/db` gained `migrate` alias for `drizzle-kit push`; real `seed` script in `scripts/src/seed.ts` (idempotent, creates 1 merchant + 5 products + 30 transactions + 3 payouts)
- [2026-04-09] Phase 3 — Docker Compose: `artifacts/api-server/Dockerfile.dev` + `artifacts/web-app/Dockerfile.dev` created; `docker compose config` validates cleanly; `version:` obsolete field removed
- [2026-04-09] Phase 4 — CI Restored: `.github/workflows/ci.yml` re-added (install + typecheck + test with Postgres service + api-server build); frontend build noted as Replit-deploy-time only
- [2026-04-09] Phase 5 — Onboarding Integrity: Step engine replaced with tree-based resolver from question-tree.json; `step_id !== current_step` → 409 StepConflict enforced; required field validation (422 on missing fields); 8 tests covering out-of-order, re-submit, skip-ahead, individual/company/sole_trader branch divergence
- [2026-04-09] Phase 6 — Verification: typecheck ✅ (4/4 clean), tests ✅ (25/25), api-server build ✅, docker compose config ✅, seed ✅
