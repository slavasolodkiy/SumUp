# System Architecture

## Overview

This is a SumUp-inspired multi-platform payments reference system. The architecture follows a microservices pattern with an API gateway, built to demonstrate how a modern mPOS platform could be structured.

All business logic is simulated/mocked — no real card processing, no real KYC provider.

---

## Architecture Diagram (Mermaid)

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App<br/>React + Vite]
        MOB[Mobile App<br/>Expo React Native]
    end

    subgraph "API Gateway"
        GW[API Gateway<br/>Express 5<br/>:8080/api]
    end

    subgraph "Backend Microservices"
        AUTH[Auth Service<br/>/api/auth<br/>OAuth 2.0 + JWT]
        ONBOARD[Onboarding Service<br/>/api/onboarding<br/>State machine engine]
        MERCHANT[Merchant Service<br/>/api/merchants<br/>Profile + Accounts]
        PAYMENT[Payments Service<br/>/api/payments<br/>Simulation engine]
        PRODUCTS[Products Service<br/>/api/products<br/>Catalog management]
        NOTIFY[Notification Service<br/>/api/notifications<br/>Receipt + OTP]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Main DB)]
        REDIS[(Redis<br/>Session Cache)]
    end

    subgraph "Integration Adapters (Stubs)"
        KYC[KYC Adapter<br/>Simulated Onfido/Jumio]
        CARD[Card Processing<br/>Simulated Acquirer]
        SMS[SMS Adapter<br/>Simulated Twilio]
        EMAIL[Email Adapter<br/>Simulated SendGrid]
        BANKING[Banking Adapter<br/>Simulated Bank Verification]
    end

    WEB --> GW
    MOB --> GW
    GW --> AUTH
    GW --> ONBOARD
    GW --> MERCHANT
    GW --> PAYMENT
    GW --> PRODUCTS
    GW --> NOTIFY

    AUTH --> PG
    AUTH --> REDIS
    ONBOARD --> PG
    ONBOARD --> KYC
    MERCHANT --> PG
    PAYMENT --> PG
    PAYMENT --> CARD
    PRODUCTS --> PG
    NOTIFY --> SMS
    NOTIFY --> EMAIL
    ONBOARD --> BANKING
```

---

## Service Responsibilities

### API Gateway (Express 5)
- Route requests to appropriate microservice
- JWT validation middleware
- Rate limiting (configurable)
- Request logging (pino)
- CORS handling
- Health check endpoint

### Auth Service
- Merchant registration (email + password)
- Login (returns JWT access token + refresh token)
- Token refresh
- OAuth 2.0 flows (authorization code for third-party apps)
- Session management (Redis-backed)
- Staff account management

### Onboarding Service
- State machine engine for multi-step onboarding
- Country-aware question resolution
- Business type branching (individual/sole_trader/company)
- KYC/KYB orchestration via adapter
- Document upload handling
- Risk scoring (simulated)
- Status management (pending/approved/rejected/needs_info)

### Merchant Service
- Merchant profile CRUD
- Business profile management
- Account settings
- Multi-location support
- Staff/operator management

### Payments Service
- Simulated transaction processing
- Transaction history
- Refund management
- Checkout (payment link) creation
- Receipt generation
- Payout calculation (simulated)

### Products Service
- Product catalog CRUD
- Category management
- Price management
- Image handling (stub)

### Notification Service
- Email receipt delivery (stub)
- SMS OTP delivery (stub)
- Webhook dispatch (stub)
- In-app notification management

---

## Data Model (Simplified)

```mermaid
erDiagram
    MERCHANT {
        uuid id PK
        string email
        string password_hash
        string status
        string country
        timestamp created_at
    }

    MERCHANT_PROFILE {
        uuid id PK
        uuid merchant_id FK
        string business_name
        string business_type
        string business_category
        string legal_name
        string registration_number
        jsonb address
        timestamp updated_at
    }

    ONBOARDING_SESSION {
        uuid id PK
        uuid merchant_id FK
        string current_step
        string status
        jsonb answers
        jsonb documents
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTION {
        uuid id PK
        uuid merchant_id FK
        decimal amount
        string currency
        string status
        string payment_method
        jsonb card_details_masked
        timestamp created_at
    }

    PRODUCT {
        uuid id PK
        uuid merchant_id FK
        string name
        decimal price
        string currency
        string category
        boolean active
        timestamp created_at
    }

    PAYOUT {
        uuid id PK
        uuid merchant_id FK
        decimal amount
        string currency
        string status
        date payout_date
        timestamp created_at
    }

    MERCHANT ||--|| MERCHANT_PROFILE : has
    MERCHANT ||--o{ ONBOARDING_SESSION : has
    MERCHANT ||--o{ TRANSACTION : processes
    MERCHANT ||--o{ PRODUCT : manages
    MERCHANT ||--o{ PAYOUT : receives
```

---

## Auth Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant AuthService
    participant Redis

    Client->>Gateway: POST /api/auth/login {email, password}
    Gateway->>AuthService: Validate credentials
    AuthService->>AuthService: bcrypt.compare()
    AuthService->>Redis: Store refresh token
    AuthService->>Gateway: {access_token, refresh_token}
    Gateway->>Client: 200 OK {access_token, refresh_token}

    Note over Client,Gateway: Subsequent requests
    Client->>Gateway: GET /api/merchants/me (Bearer token)
    Gateway->>Gateway: Verify JWT signature
    Gateway->>MerchantService: Forward with merchant_id
    MerchantService->>Gateway: Merchant data
    Gateway->>Client: 200 OK {merchant}
```

---

## Onboarding State Machine

```mermaid
stateDiagram-v2
    [*] --> not_started
    not_started --> country_selected : select_country
    country_selected --> business_type_selected : select_business_type
    business_type_selected --> personal_info_complete : submit_personal_info
    personal_info_complete --> phone_verified : verify_phone
    phone_verified --> business_info_complete : submit_business_info
    business_info_complete --> kyc_pending : submit_documents
    kyc_pending --> kyc_approved : kyc_pass
    kyc_pending --> kyc_failed : kyc_fail
    kyc_pending --> kyc_manual_review : kyc_flag
    kyc_failed --> kyc_pending : resubmit
    kyc_manual_review --> kyc_approved : manual_approve
    kyc_manual_review --> kyc_rejected : manual_reject
    kyc_approved --> banking_complete : submit_banking
    banking_complete --> submitted : submit_application
    submitted --> approved : auto_approve
    submitted --> pending_review : flag_for_review
    pending_review --> approved : review_approve
    pending_review --> rejected : review_reject
    pending_review --> needs_more_info : request_info
    needs_more_info --> submitted : resubmit
    approved --> [*]
    rejected --> [*]
```

---

## Technology Choices & Justifications

| Decision | Choice | Justification |
|---------|--------|---------------|
| Web framework | React + Vite | Fast dev experience; widely understood |
| Mobile | Expo (React Native) | Single codebase for iOS + Android |
| Backend | Express 5 + TypeScript | Team familiarity; fast iteration |
| Database | PostgreSQL + Drizzle ORM | ACID compliance required for financial data |
| Auth | JWT + refresh tokens | Stateless; works across web + mobile |
| API contract | OpenAPI 3.0 | Single source of truth; enables codegen |
| Validation | Zod | Runtime + compile-time safety |
| Monorepo | pnpm workspaces | Shared types; efficient builds |
| Containerization | Docker Compose | Local dev parity |
