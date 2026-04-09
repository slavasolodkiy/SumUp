# SumUp External Integrations Analysis

## Legal Note

All integration observations are based on:
- SumUp's public developer portal (developer.sumup.com)
- SumUp's public help center articles
- SumUp's public integrations/apps marketplace pages
- Marketing pages listing integration partners

No internal configuration, API keys, or private integration code was accessed.

---

## 1. Point-of-Sale Integrations (Publicly Listed)

SumUp publicly advertises integrations with third-party POS and business software:

| Integration | Type | Publicly Documented? |
|------------|------|---------------------|
| WooCommerce | E-commerce plugin | Yes — help.sumup.com |
| Shopify | E-commerce | Yes — partnership page |
| PrestaShop | E-commerce | Yes |
| OpenCart | E-commerce | Yes |
| Xero | Accounting | Yes |
| QuickBooks | Accounting | Yes |
| DATEV | Accounting (DE market) | Yes |
| Lightspeed | POS | Yes |
| Vend | POS | Yes |
| Kounta | Hospitality POS | Yes |
| iZettle (Zettle) | Competitor integration? | No — mentioned in public forum discussions |

---

## 2. Developer API & Webhooks (Publicly Documented)

**Source:** https://developer.sumup.com

### 2.1 Public REST API Endpoints

| Resource | Operations | Auth |
|---------|-----------|------|
| `/v0.1/me` | GET merchant profile | Bearer token |
| `/v0.1/me/accounts` | GET accounts | Bearer token |
| `/v0.1/me/transactions/history` | GET transactions | Bearer token |
| `/v0.1/me/checkouts` | POST create, GET list | Bearer token |
| `/v0.1/me/checkouts/{id}` | GET, DELETE | Bearer token |
| `/v0.1/me/checkouts/{id}/complete` | POST complete checkout | Bearer token |
| `/v0.1/me/readers` | GET list readers | Bearer token |
| `/v0.1/me/receipts/{id}` | GET receipt | Bearer token |
| `/v0.1/customers` | POST, GET | Bearer token |
| `/v0.1/customers/{id}` | GET, PUT, DELETE | Bearer token |
| `/v0.1/customers/{id}/payment-instruments` | GET, POST | Bearer token |
| `/v0.1/me/payouts` | GET list | Bearer token |
| `/v0.1/me/payout-settings` | GET | Bearer token |
| `/v0.1/products` | GET, POST | Bearer token |
| `/v0.1/products/{id}` | GET, PUT, DELETE | Bearer token |
| `/v0.1/product-categories` | GET | Bearer token |

### 2.2 OAuth 2.0 Flows (Publicly Documented)

| Flow | Use Case |
|------|---------|
| Authorization Code | Third-party apps acting on behalf of a merchant |
| Client Credentials | Backend-to-backend for own merchant account |
| Refresh Token | Long-lived sessions |

### 2.3 Webhooks (HYPOTHESIS)

HYPOTHESIS (Medium confidence): SumUp likely supports webhooks for transaction events, based on:
- Common pattern for payment platforms
- Developer forum discussions (public)
- Required for POS integration patterns

No official webhook documentation was found in the public developer portal at time of analysis.

---

## 3. Hardware/SDK Integrations (Publicly Documented)

| SDK | Platform | Publicly Available? |
|-----|---------|---------------------|
| SumUp iOS SDK | iOS | Yes — GitHub: sumup/sumup-ios-sdk |
| SumUp Android SDK | Android | Yes — GitHub: sumup/sumup-android-sdk |

**Source:** https://github.com/sumup (public GitHub organization — only public repos)

The public SDKs allow third-party iOS/Android apps to initiate card-present payments via SumUp hardware, collecting only the tokenized result.

---

## 4. Payment Method Support (Observed from Marketing Pages)

| Payment Method | Observed | Notes |
|---------------|----------|-------|
| Visa (credit/debit/prepaid) | Yes | Publicly stated |
| Mastercard (credit/debit/prepaid) | Yes | Publicly stated |
| American Express | Yes (selected markets) | Publicly stated |
| Maestro | Yes (EU) | Publicly stated |
| Apple Pay | Yes | Publicly stated |
| Google Pay | Yes | Publicly stated |
| Samsung Pay | Possible — HYPOTHESIS | Common for Android terminals |
| Alipay/WeChat Pay | Not publicly advertised for EU/US | |
| SEPA bank transfers | For payouts only | Not a payment acceptance method |

---

## 5. Financial / Banking Partners (HYPOTHESIS — Partially Inferred)

> **HYPOTHESIS** — SumUp's exact banking/acquiring partners are not publicly disclosed for all markets.

| Market | Likely Partner | Confidence | Evidence |
|--------|---------------|------------|----------|
| EU | SumUp Financial Services Ltd (own EMI license) | High | Regulatory filings publicly searchable in UK FCA register |
| UK | FCA authorized (own) | High | FCA register: https://register.fca.org.uk/ |
| US | Partner bank (HYPOTHESIS) | Medium | Required for US money transmission |
| BR | Partner acquirer (HYPOTHESIS) | Medium | Common model for Brazilian fintech |

---

## 6. Analytics & Marketing Tech (Observed Frontend Signals)

| Service | Confidence | Evidence |
|---------|-----------|---------|
| Google Analytics 4 | High | GA4 gtag script in page source |
| Google Tag Manager | High | GTM container ID in page source |
| Facebook Pixel | Medium | Meta pixel reference in some pages |
| LinkedIn Insight Tag | Low | HYPOTHESIS based on B2B targeting |
| Trustpilot | High | Review widget embedded on marketing pages |
| HubSpot | Low | HYPOTHESIS based on SMB marketing stack |

---

## 7. Known Gaps

- Acquiring banking relationships per country not all publicly confirmed
- KYC/KYB provider integrations not publicly disclosed
- Internal analytics platform unknown
- AML/fraud screening vendors not publicly disclosed
- Exact payment processor partnerships per acquiring channel unknown

---

## References

1. https://developer.sumup.com
2. https://github.com/sumup (public repos)
3. https://help.sumup.com (integration help articles)
4. https://www.sumup.com/en-gb/integrations/ (public marketplace)
5. UK FCA Financial Services Register (public)
