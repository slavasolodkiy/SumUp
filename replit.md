# PayOS - Merchant Dashboard Reference System

## Overview

SumUp-inspired multi-platform payments reference system built as a pnpm workspace monorepo. All research uses HYPOTHESIS labels — no proprietary assets.

## Architecture

- **`artifacts/api-server`** — Express 5 backend, serves all `/api/*` routes
- **`artifacts/web-app`** — React + Vite merchant dashboard
- **`lib/api-spec`** — OpenAPI spec (openapi.yaml), codegen source of truth
- **`lib/api-client-react`** — Orval-generated TanStack Query hooks + custom fetcher
- **`lib/api-zod`** — Orval-generated Zod validation schemas
- **`lib/db`** — Drizzle ORM schema + client (PostgreSQL)
- **`docs/`** — Research docs, onboarding question tree, country matrix

## Demo Credentials

Email: `demo@payos.com` / Password: `Demo1234!`

## API Routes

| Route | Description |
|-------|-------------|
| POST /api/auth/register | Create merchant + issue JWT |
| POST /api/auth/login | Login, issue access + refresh tokens |
| POST /api/auth/refresh | Rotate refresh token pair |
| POST /api/auth/logout | Revoke tokens |
| GET /api/merchants/me | Get authenticated merchant |
| PUT /api/merchants/me | Update merchant profile |
| GET /api/merchants/me/summary | Dashboard stats |
| GET/POST /api/onboarding/session | Get or create onboarding session |
| POST /api/onboarding/session/step | Submit one onboarding answer (body: `step_id`, `answer`) |
| POST /api/onboarding/session/kyc/verify | Simulate KYC verification |
| GET /api/onboarding/countries | 20 supported countries |
| GET /api/onboarding/question-tree | Full branching question tree (loaded from docs/onboarding/question-tree.json) |
| GET /api/payments/transactions | List transactions (paginated, filterable) |
| POST /api/payments/transactions | Create transaction (requires `payment_method` field) |
| GET /api/payments/transactions/:id | Get single transaction |
| POST /api/payments/transactions/:id/refund | Refund transaction |
| POST /api/payments/checkouts | Create payment link |
| GET /api/payments/checkouts | List checkouts |
| GET /api/payments/summary | Volume summary by period |
| GET /api/payments/payouts | List payouts |
| GET /api/products | List products |
| POST /api/products | Create product |
| GET/PUT/DELETE /api/products/:id | Manage product |

## Database Tables

- `merchants` — id, email, password_hash, first_name, last_name, business_name, business_category, country, status, onboarding_status, refresh_token
- `onboarding_sessions` — id, merchant_id, current_step, status, answers (JSONB), progress_percent, kyc_session_id, kyc_status
- `transactions` — id, merchant_id, amount, currency, status, payment_method, card_last_four, card_scheme, product_id, product_name, description
- `products` — id, merchant_id, name, price, currency, category, sku, active, image_url
- `checkouts` — id, merchant_id, amount, currency, title, description, status, checkout_url
- `payouts` — id, merchant_id, amount, currency, status, payout_date, reference

## Web App Pages

- `/login` — Email/password login with demo credentials hint
- `/register` — New merchant registration
- `/onboarding` — Multi-step KYC/KYB wizard (driven by API question tree)
- `/dashboard` — Summary stats, recent transactions, top products
- `/transactions` — Paginated transaction list with refund capability
- `/products` — Product CRUD
- `/payouts` — Payout history
- `/checkout` — Create & manage payment links
- `/settings` — Merchant profile editing

## Auth Pattern

JWT-based: access + refresh tokens (both include `jti` for uniqueness). Stored in localStorage. Refresh tokens stored in DB — validated on each rotation; reusing a rotated token returns 401 (token rotation security). Custom fetcher (`lib/api-client-react/src/custom-fetch.ts`) uses `setAuthTokenGetter()` to attach Bearer tokens. Auto-refresh on 401.

## Security Hardening (Phase D)

- JWT tokens include `jti` (unique ID per token) to prevent same-second collisions
- Refresh token verified against DB-stored copy on each rotation (prevents token reuse after rotation)
- Auth endpoints rate-limited: 20 requests per 15 min per IP (skipped in test mode)
- `SESSION_SECRET` required in production — server crashes on startup if missing
- Request body size limited to 1MB
- Passwords hashed with bcrypt (cost factor 12)

## Onboarding (Phase C - SOT)

- `docs/onboarding/question-tree.json` is the single source of truth for all onboarding questions
- `GET /api/onboarding/question-tree` serves this file directly (cached in-memory)
- Individual vs company branching logic in `artifacts/api-server/src/routes/onboarding.ts`
- **Runtime: 20 countries** (curated active list served by `GET /api/onboarding/countries`)
- **Research CSV: 26 countries** (`docs/onboarding/country-language-matrix.csv` — broader research set, not all active in runtime)
- 5 entity types (individual, sole_trader, registered_company, partnership, charity)

## Testing (Phase E)

- Integration tests: `pnpm --filter @workspace/api-server run test`
- **28 tests** across 3 suites: auth, payments, onboarding
- Vitest + Supertest; runs against live DATABASE_URL
- No GitHub Actions CI — quality gate runs locally via `pnpm run verify:replit`

## Mobile App

NOT YET IMPLEMENTED. See `docs/architecture/mobile-plan.md` for planned Expo design.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Testing**: Vitest + Supertest

## Key Commands

- `pnpm run verify:policy` — policy guard: confirms no GitHub Actions CI workflow file or doc references exist
- `pnpm run verify:replit` — full local quality gate: policy + typecheck + api build + api tests (Linux x64 / Replit)
- `pnpm run typecheck` — full typecheck across all packages (4/4 clean)
- `pnpm --filter @workspace/api-server run build` — build API server (web-app builds at Replit deploy time)
- `pnpm --filter @workspace/api-server run test` — run 28 integration tests (auth + payments + onboarding)
- `pnpm --filter @workspace/scripts run seed` — seed demo data (idempotent — skips if demo@payos.com exists)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (also aliased as `migrate`)
- `pnpm --filter @workspace/db run migrate` — alias for `push` (drizzle-kit schema-push, no migration files)
- `docker compose config` — validate docker-compose.yml (requires Docker Engine, not available in Replit hosted env)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
