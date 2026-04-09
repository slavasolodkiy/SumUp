# SumUp Observed & Hypothesized Tech Stack

## Legal Note

All technology identifications are based solely on:
- Publicly visible HTML source code
- Public developer portal (developer.sumup.com)
- Public job postings (technology signals)
- App Store / Play Store public listings
- Public security disclosures

Nothing was reverse engineered. Internal systems are clearly labeled as HYPOTHESIS.

---

## 1. Frontend Web (Marketing + Merchant Portal)

### Observed

| Technology | Evidence | Confidence |
|-----------|----------|------------|
| React | Bundle filenames, component hydration patterns in source | High |
| TypeScript | Job listings consistently require TS; bundle sourcemap signals | High |
| Webpack / Vite | Content-addressed bundle hashes in HTML source | Medium |
| Tailwind CSS or CSS Modules | Classname patterns in observed source | Medium |
| i18next or similar | URL-based locale routing `/en-gb/`, `/de/`, etc. | High |

### HYPOTHESIS

| Technology | Hypothesis | Confidence | Evidence |
|-----------|-----------|------------|----------|
| Next.js | SSR/SSG patterns, structured meta tags, hydration behavior | Medium | Consistent with Next.js page structure |
| React Query or SWR | Standard React data-fetching; common in modern fintech | Low | No direct observation |
| Storybook | Common in large frontend teams for component systems | Low | Inferred from team size |

---

## 2. Mobile (iOS & Android)

### iOS

| Technology | Evidence | Confidence |
|-----------|----------|------------|
| Swift / Objective-C | Required for iOS development | High — Observed via App Store metadata |
| CoreBluetooth | Required for card reader BLE | High |
| Tap to Pay on iPhone API | Advertised feature; requires Apple entitlement | High |
| APNs | Push notifications advertised | High |

### Android

| Technology | Evidence | Confidence |
|-----------|----------|------------|
| Kotlin | Industry standard; inferred from modern Android development | High |
| Android BLE API | Required for card reader support | High |
| FCM (Firebase Cloud Messaging) | Notifications advertised; standard Android | High |

---

## 3. Backend (HYPOTHESIS — Not Observable)

> **All backend observations are HYPOTHESIS.** SumUp does not publish its internal architecture.

| Component | Hypothesis | Confidence | Evidence |
|-----------|-----------|------------|----------|
| Microservices architecture | Common for fintech at SumUp's scale | High | Job listings reference "microservices", "distributed systems" |
| Kubernetes / Docker | Job listings require K8s experience | High | Consistent with cloud-native fintech |
| Go and/or Java/Kotlin backends | Job postings reference Go and Java/Kotlin for backend | High |
| PostgreSQL | Common relational DB for financial transactions | Medium | |
| Redis | Common caching/session layer | Medium | |
| Kafka or similar event streaming | Event-driven architecture for payment flows | Medium | Job listings reference event-driven |
| AWS or GCP | Major cloud provider | Medium | Job listings reference AWS/GCP tooling |
| gRPC for internal services | Common for microservice comms | Low | |

---

## 4. Payments & Financial Infrastructure (HYPOTHESIS)

| Component | Hypothesis | Confidence | Evidence |
|-----------|-----------|------------|----------|
| EMV Level 2 kernel | Required for chip card processing | High | Regulatory requirement |
| PCI DSS Level 1 | Required at SumUp's transaction volume | High | Required by card schemes |
| Acquiring bank partnerships | Country-specific acquirers (HYPOTHESIS) | High | Regulatory requirement per market |
| Card scheme membership | Visa/Mastercard | High | Advertised on marketing pages |
| IBAN-based payouts | Merchant settlement to bank accounts | High | Publicly documented in help center |
| 3DS2 (3D Secure 2) | Required for online payments | High | EU SCA requirements |

---

## 5. Auth & Identity (HYPOTHESIS)

| Component | Hypothesis | Confidence | Evidence |
|-----------|-----------|------------|----------|
| OAuth 2.0 + OIDC | Observed redirect_uri patterns and `code` params | High |
| JWT tokens | Standard for OAuth 2.0 APIs | High | |
| KYC provider (Jumio, Onfido, or similar) | Required for regulatory compliance | High | Common fintech KYC vendors |
| AML screening | Required for financial services | High | Regulatory requirement |
| 2FA (TOTP or SMS OTP) | Observed in merchant portal login | High | |

---

## 6. Public Developer API

**Source:** https://developer.sumup.com (publicly accessible)

SumUp publishes a public OAuth 2.0 API:

| Endpoint group | Publicly documented |
|---------------|---------------------|
| Merchant profile | Yes |
| Checkouts (payment links) | Yes |
| Transactions | Yes (read) |
| Receipts | Yes |
| Readers | Yes (management) |
| Payouts | Yes (read) |
| Customers | Yes |
| Products | Yes |

**Auth method:** OAuth 2.0 Authorization Code + Client Credentials flows documented publicly.

---

## 7. Infrastructure / DevOps (HYPOTHESIS)

| Component | Hypothesis | Confidence | Evidence |
|-----------|-----------|------------|----------|
| CI/CD | GitHub Actions or Jenkins | Medium | Common at this scale |
| Container orchestration | Kubernetes | High | Job listings |
| Observability | Datadog or Grafana + Prometheus | Medium | Common fintech stack |
| Feature flags | LaunchDarkly or in-house | Low | Typical for mobile release management |

---

## References

1. https://developer.sumup.com
2. https://jobs.sumup.com (public job listings — tech signals)
3. https://help.sumup.com
4. PCI DSS requirements (publicly documented by PCI SSC)
5. EMV specifications (publicly documented by EMVCo)
