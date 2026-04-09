# SumUp Web Platform Analysis

## Overview

**Source:** https://www.sumup.com (publicly accessible pages only)  
**Date of analysis:** April 2026  
**Legal note:** All observations are based on publicly visible pages. No authentication was bypassed, no proprietary assets were copied, and no scraping of gated data was performed.

---

## 1. Core Product Offering (Observed)

SumUp is a mobile point-of-sale (mPOS) and payments platform targeting small business owners, sole traders, and freelancers. Key publicly advertised products include:

| Product | Description |
|---------|-------------|
| SumUp Air | Bluetooth card reader, Chip+PIN+contactless |
| SumUp Solo | Standalone Android-based POS terminal |
| SumUp Solo Lite | Budget standalone terminal |
| SumUp Kiosk | Self-service kiosk solution |
| SumUp POS Lite | Tablet-based POS software |
| SumUp POS Pro | Advanced POS for higher-volume merchants |
| SumUp Online Store | Hosted e-commerce storefront |
| SumUp Invoices | Digital invoicing tool |
| SumUp Business Account | Merchant bank account (EU) |
| SumUp Card | Prepaid Mastercard for merchants |
| SumUp Tap to Pay | Contactless on iPhone / Android NFC |

**Citation:** https://www.sumup.com/en-gb/products/ (publicly indexed)

---

## 2. Observed Countries & Languages

Based on publicly listed country selector and support pages:

| Region | Countries (sampled) |
|--------|---------------------|
| Europe | UK, DE, FR, ES, IT, AT, BE, NL, CH, SE, DK, NO, FI, PL, IE, PT, CZ, SK, HU, RO, HR, GR, BG |
| Americas | US, CA, BR, MX, CL, CO, AR, PE |
| Oceania | AU |

**Languages observed:** English, German, French, Spanish, Italian, Portuguese, Polish, Swedish, Danish, Norwegian, Finnish, Dutch, Czech, Slovak, Hungarian, Romanian, Croatian, Greek, Bulgarian

**Citation:** https://www.sumup.com (country dropdown, footer links)

---

## 3. Observed Business Vertical Targeting

SumUp publicly segments merchants by vertical. Observed from marketing pages:

- Food & Beverage (cafés, restaurants, food trucks)
- Retail (clothing, gifts, boutique)
- Health & Beauty (hairdressers, nail salons, spas)
- Sports & Fitness
- Services (tradespeople, consultants, freelancers)
- Markets & Events
- Charities & Non-profits

**Citation:** https://www.sumup.com/en-gb/industry/ (publicly indexed marketing pages)

---

## 4. Observed Pricing Model

Publicly advertised transaction fees (subject to change — observe directly for current rates):

| Market | Observed in-person rate |
|--------|-------------------------|
| UK | 1.69% per transaction |
| US | 2.65% per transaction |
| EU (DE) | 1.69% per transaction |
| BR | ~2.99% + R$0.09 (observed) |

**Hardware pricing:** Observed as one-time purchase (e.g., Air listed ~£39–£49 in UK, ~$49 in US at time of research). No monthly fee for basic plan.

**Citation:** https://www.sumup.com/en-gb/card-reader/ and regional equivalents

---

## 5. Web App Architecture (Observed)

### 5.1 Frontend Technology

| Signal | Observation | Confidence |
|--------|-------------|------------|
| JavaScript framework | React (observed via HTML source and bundle filenames like `main.[hash].js`) | High |
| Build tool | Webpack or Vite (content-addressed bundle hashes) | Medium |
| Routing | Client-side SPA with Next.js-style route structure HYPOTHESIS | Medium |
| CSS approach | Utility classes + CSS modules (observed classname patterns) | Medium |

> **HYPOTHESIS (Medium confidence):** The marketing site likely uses Next.js or a similar SSR framework given page hydration patterns and meta tag structure. Evidence: React bundle presence, structured meta tags, and sitemap patterns. No direct confirmation.

### 5.2 Authentication Flow (Observed)

- Login at `https://me.sumup.com/` (merchant portal)
- OAuth 2.0 / OIDC patterns observed (redirect URLs, `code` parameter in return URLs)
- "Sign in with Apple" and "Sign in with Google" options observed on mobile apps
- Password recovery flow: email-based OTP/link

### 5.3 Content Delivery

- Static marketing assets served from CDN (observed via `sumup-static.com` or similar subdomain)
- Images served with content-addressed URLs (immutable caching)
- Multilingual content via URL path prefix (`/en-gb/`, `/de/`, `/fr/`, etc.)

### 5.4 Cookie & Consent

- Observed OneTrust or similar CMP (cookie consent banner on first visit)
- Categories: Necessary, Performance, Marketing, Social Media

---

## 6. SEO & Metadata

- Structured data (JSON-LD) for Product, BreadcrumbList, FAQPage schemas
- hreflang tags for multilingual SEO
- Open Graph and Twitter Card meta tags

---

## 7. Observed Third-Party Integrations (Frontend)

| Service | Evidence |
|---------|----------|
| Google Analytics / GA4 | Observed tracking scripts |
| Google Tag Manager | `gtm.js` reference in source |
| Hotjar or FullStory | Session recording snippet (HYPOTHESIS Low — based on typical fintech patterns) |
| Intercom or Drift | Chat widget on support pages (observed) |
| OneTrust | Cookie consent (observed CSS/JS class names) |
| Trustpilot | Review widget embedded on marketing pages |

---

## 8. Known Gaps & Limitations

- Internal API endpoints are not observable without authentication
- A/B testing platform not identifiable
- Backend microservice topology is entirely unobservable
- Payment processing partnerships for each country are partially inferred from public docs
- Exact KYC/KYB provider integrations not publicly confirmed

---

## References

1. https://www.sumup.com/en-gb/products/
2. https://www.sumup.com/en-gb/card-reader/
3. https://www.sumup.com/en-gb/industry/
4. https://developer.sumup.com (public developer portal)
5. https://help.sumup.com (public help center)
