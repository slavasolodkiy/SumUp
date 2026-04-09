# PayOS - Merchant Dashboard Reference System

## Overview

SumUp-inspired multi-platform payments reference system built as a pnpm workspace monorepo. All research uses HYPOTHESIS labels — no proprietary assets.

## Architecture

- **`artifacts/api-server`** — Express 5 backend, port 8080, serves all `/api/*` routes
- **`artifacts/web-app`** — React + Vite merchant dashboard, proxied at `/`
- **`lib/api-spec`** — OpenAPI spec (openapi.yaml), codegen source of truth
- **`lib/api-client-react`** — Orval-generated TanStack Query hooks + custom fetcher
- **`lib/api-zod`** — Orval-generated Zod validation schemas
- **`lib/db`** — Drizzle ORM schema + client (PostgreSQL)
- **`docs/`** — Research docs (web/iOS/Android analysis, question trees, country matrix)

## Demo Credentials

Email: `demo@payos.com` / Password: `Demo1234!`

## API Routes

| Route | Description |
|-------|-------------|
| POST /api/auth/register | Create merchant + issue JWT |
| POST /api/auth/login | Login, issue access + refresh tokens |
| POST /api/auth/refresh | Refresh access token |
| POST /api/auth/logout | Revoke tokens |
| GET /api/merchants/me | Get authenticated merchant |
| PUT /api/merchants/me | Update merchant profile |
| GET /api/merchants/me/summary | Dashboard stats (today/week/month volume, top products, recent txs) |
| GET/POST /api/onboarding/session | Get or create onboarding session |
| POST /api/onboarding/session/step | Submit one onboarding answer, returns next question |
| POST /api/onboarding/session/kyc/verify | Simulate KYC verification |
| GET /api/onboarding/countries | 20 supported countries |
| GET /api/payments/transactions | List transactions (paginated, filterable) |
| POST /api/payments/transactions | Create transaction |
| GET /api/payments/transactions/:id | Get single transaction |
| POST /api/payments/transactions/:id/refund | Refund transaction |
| POST /api/payments/checkouts | Create payment link |
| GET /api/payments/checkouts | List checkouts |
| GET /api/payments/summary | Volume summary by period |
| GET /api/payments/payouts | List payouts |
| GET /api/products | List products |
| POST /api/products | Create product |
| GET/PUT/DELETE /api/products/:id | Manage product |
| GET /api/products/categories | List product categories |

## Database Tables

- `merchants` — id, email, password_hash, first_name, last_name, business_name, business_category, country, status, onboarding_status
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

JWT-based: access token (1h) + refresh token (30d) stored in localStorage. Custom fetcher (`lib/api-client-react/src/custom-fetch.ts`) uses `setAuthTokenGetter()` to attach Bearer tokens. Auto-refresh on 401.

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

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
