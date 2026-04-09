# PayOS — Merchant Dashboard Reference Platform

A comprehensive SumUp-inspired multi-platform payments reference system built as a developer learning exercise.

> **Legal note:** All SumUp observations are based on publicly available information only (website, App Store/Play Store listings, public documentation). Implementation details are HYPOTHETICAL — clearly labelled throughout docs. This project is not affiliated with SumUp.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Replit Proxy (HTTPS)                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
        ▼                                ▼
┌───────────────┐              ┌──────────────────┐
│  Web App      │              │  API Server       │
│  React/Vite   │◄────REST────►│  Express + Drizzle│
│  port: $PORT  │              │  port: $PORT      │
└───────────────┘              └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │   PostgreSQL DB   │
                               │   (Replit-managed)│
                               └──────────────────┘
```

## Packages

| Package | Description |
|---------|-------------|
| `artifacts/web-app` | React + Vite merchant dashboard |
| `artifacts/api-server` | Express REST API with JWT auth |
| `lib/api-spec` | OpenAPI 3 specification |
| `lib/api-zod` | Zod validators generated from OpenAPI |
| `lib/api-client-react` | React Query hooks generated from OpenAPI |
| `lib/db` | Drizzle ORM schema (schema-push workflow, no migration files) |
| `docs/` | Research, architecture, onboarding docs |

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+ (or Docker — see below)

> **Platform note:** The workspace is configured for **Linux x64 only**. Binary overrides in `pnpm-workspace.yaml` exclude all non-Linux rollup, esbuild, lightningcss, and tailwindcss-oxide natives. On Windows, use WSL2 or Docker. On macOS, remove the relevant overrides before installing.

### 1. Clone & install

```bash
git clone <repo-url>
cd payos
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and SESSION_SECRET
```

### 3. Push database schema

```bash
# This project uses drizzle-kit schema-push (not migration files).
pnpm --filter @workspace/db run push
```

### 4. Seed demo data (optional)

```bash
pnpm --filter @workspace/scripts run seed
```

This creates:
- **Demo account:** `demo@payos.com` / `Demo1234!`
- 5 products, 30 transactions, completed onboarding

### 5. Start development servers

```bash
# In two separate terminals:
pnpm --filter @workspace/api-server run dev   # API
pnpm --filter @workspace/web-app run dev       # Web
```

---

## Docker Compose (local development)

> **Note:** This requires Docker Desktop / Docker Engine. The Replit hosted environment does not have a Docker daemon and cannot run `docker compose up`. The `docker-compose.yml` is provided for local developer setup only.

```bash
# Validate the compose file
docker compose config

# Start all services (builds Dockerfiles on first run)
docker compose up --build
```

Services:
- `db` — PostgreSQL 15 (port 5432)
- `api` — API server (port 4000)
- `web` — Vite dev server (port 5173)

First run runs `drizzle-kit push` automatically and seeds demo data.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes (prod) | 32-byte hex secret for JWT signing. Generate: `openssl rand -hex 32` |
| `PORT` | Yes | Port for each service (set automatically by Replit) |
| `NODE_ENV` | No | `development` / `production` / `test` |

> **Security:** In production the server will **crash on startup** if `SESSION_SECRET` is not set.

---

## API Reference

Full OpenAPI spec: [`lib/api-spec/openapi.yaml`](lib/api-spec/openapi.yaml)

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → tokens |
| POST | `/api/auth/refresh` | Rotate refresh token |
| POST | `/api/auth/logout` | Invalidate refresh token |

### Merchants

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/merchants/me` | Get merchant profile |
| PUT | `/api/merchants/me` | Update profile |
| GET | `/api/merchants/me/summary` | Revenue stats |

### Payments

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/payments/transactions` | Create transaction |
| GET | `/api/payments/transactions` | List transactions |
| GET | `/api/payments/transactions/:id` | Get transaction |
| POST | `/api/payments/transactions/:id/refund` | Refund |
| GET | `/api/payments/summary` | Revenue summary |
| POST | `/api/payments/checkouts` | Create checkout link |
| GET | `/api/payments/checkouts` | List checkout links |
| GET | `/api/payments/payouts` | List payouts |

### Products

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/products` | Create product |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Onboarding

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/onboarding/session` | Start onboarding session |
| GET | `/api/onboarding/session` | Get current session |
| POST | `/api/onboarding/session/step` | Submit step answer (`step_id` must equal current step — 409 if out of order) |
| POST | `/api/onboarding/session/kyc/verify` | Submit KYC document |
| GET | `/api/onboarding/countries` | Supported countries |
| GET | `/api/onboarding/question-tree` | Full question tree (loaded from `docs/onboarding/question-tree.json`) |

---

## Onboarding Engine

The onboarding step engine is driven entirely from `docs/onboarding/question-tree.json`:

- Each node defines its `next` rules (conditional on answer values)
- `POST /api/onboarding/session/step` enforces that `step_id` equals `session.current_step` — submitting out-of-order returns **409 Conflict**
- Next step is computed by evaluating the node's `next` map against the submitted answer

---

## Security

- JWT access tokens (1 hour) with unique `jti` per token
- Refresh tokens (30 days) stored in DB — validated on rotation; reuse after rotation returns 401
- Auth endpoints rate-limited: 20 requests / 15 min per IP
- Passwords hashed with bcrypt (cost factor 12)
- `SESSION_SECRET` required in production (startup crash guard)
- Request body size limited to 1MB

---

## Testing

```bash
# Run all integration tests (28 tests: auth + payments + onboarding)
pnpm --filter @workspace/api-server run test
```

Tests run against the live `DATABASE_URL`.

---

## Quality Gate (Replit / Linux)

No GitHub Actions CI. Run the full local quality gate on Replit or any Linux x64 machine:

```bash
pnpm run verify:replit
```

This runs in order:
1. Policy guard — confirms no GitHub Actions CI workflow exists or is referenced in docs
2. TypeScript typecheck (all packages)
3. API server build
4. API integration tests (28 tests, requires `DATABASE_URL`)

---

## Mobile App

The Expo mobile app is **not yet implemented** — planned as a future phase.
See [`docs/architecture/mobile-plan.md`](docs/architecture/mobile-plan.md) for the intended design.

---

## Documentation

| Document | Description |
|----------|-------------|
| `docs/research/` | Public observations of SumUp web/iOS/Android |
| `docs/onboarding/question-tree.json` | Machine-readable branching question tree (runtime SOT) |
| `docs/onboarding/onboarding-master-map.md` | Full onboarding flow with all branches |
| `docs/onboarding/country-language-matrix.csv` | 26 countries, languages, ID types, banking formats |
| `docs/architecture/` | System diagrams and service topology |

---

## License

MIT — educational reference only. Not for production use.
