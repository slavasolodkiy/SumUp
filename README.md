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
| `lib/db` | Drizzle ORM schema + migrations |
| `docs/` | Research, architecture, onboarding docs |

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (or Docker)

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

### 3. Run database migrations

```bash
pnpm --filter @workspace/db run migrate
```

### 4. Seed demo data (optional)

```bash
pnpm --filter scripts run seed
```

This creates:
- **Demo account:** `demo@payos.com` / `Demo1234!`
- 5 products, 30 transactions, completed onboarding

### 5. Start development servers

```bash
# In two separate terminals:
pnpm --filter @workspace/api-server run dev   # API on port from $PORT
pnpm --filter @workspace/web-app run dev       # Web on port from $PORT
```

---

## Docker Compose (local development only)

```bash
docker-compose up
```

Services started:
- `db` — PostgreSQL 15
- `api` — API server (port 4000)
- `web` — Vite dev server (port 5173)

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes (prod) | 32-byte hex secret for JWT signing. Generate: `openssl rand -hex 32` |
| `PORT` | Yes | Port for each service (set by Replit) |
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
| POST | `/api/onboarding/start` | Start onboarding session |
| GET | `/api/onboarding/session` | Get current session |
| POST | `/api/onboarding/step` | Submit step answer |
| POST | `/api/onboarding/kyc/verify` | Submit KYC document |
| GET | `/api/onboarding/countries` | Supported countries |
| GET | `/api/onboarding/question-tree` | Full question tree (SOT) |

---

## Security

- JWT access tokens (1 hour expiry), refresh tokens (30 days) stored in DB
- Refresh token rotation: old token invalidated on every use
- Auth endpoints rate-limited: 20 requests / 15 min per IP
- Passwords hashed with bcrypt (cost factor 12)
- `SESSION_SECRET` required in production (startup crash guard)
- Request body size limited to 1MB

---

## Mobile App

The Expo mobile app is **not yet implemented** — planned as Phase F.
See [`docs/architecture/mobile-plan.md`](docs/architecture/mobile-plan.md) for the intended design.

---

## Documentation

| Document | Description |
|----------|-------------|
| `docs/research/` | Public observations of SumUp web/iOS/Android |
| `docs/onboarding/onboarding-master-map.md` | Full onboarding flow with all branches |
| `docs/onboarding/question-tree.json` | Machine-readable branching question tree (SOT) |
| `docs/onboarding/country-language-matrix.csv` | 27 countries, languages, ID types, banking formats |
| `docs/architecture/` | System diagrams and service topology |

---

## Testing

```bash
pnpm --filter @workspace/api-server run test
```

---

## License

MIT — educational reference only. Not for production use.
