# SumUp Onboarding Master Map

## Overview

This document maps the full publicly observable onboarding flow for SumUp merchant registration. All flow details are based on:
- Public-facing signup pages (sumup.com)
- Public help center articles
- App Store / Play Store screenshots (publicly visible)
- SumUp's public developer documentation

Where exact logic is inferred, entries are marked HYPOTHESIS with a confidence score.

---

## 1. Entry Points

| Entry Point | Channel | Notes |
|------------|---------|-------|
| sumup.com marketing page "Get Started" CTA | Web | Primary web entry |
| In-app signup | iOS / Android App | Mobile-first entry |
| Hardware purchase flow (reader in cart) | Web | E-commerce entry |
| Referral link | Web / App | Affiliate/referral program |
| Sales team / enterprise | Offline | Out of scope for self-serve |

---

## 2. High-Level Onboarding Phases

```
Phase 1: Account Creation
  └── Email + password OR Google/Apple SSO
  
Phase 2: Country & Business Type Selection
  └── Country → determines regulatory path, product availability, language
  └── Business type → determines KYC vs KYB requirement
  
Phase 3: Business Profile Collection
  └── Varies by business type (individual → KYC only; business → KYB)
  
Phase 4: Identity Verification (KYC / KYB)
  └── Document upload / liveness check
  └── Business registration document (for registered entities)
  
Phase 5: Banking Details
  └── Bank account for merchant settlements
  
Phase 6: Hardware Selection (Optional at signup)
  └── Select card reader / POS device
  
Phase 7: Account Activation
  └── Manual review (if flagged) OR automatic approval
  └── First login to merchant dashboard
```

---

## 3. Phase 1: Account Creation

### 3.1 Input Fields

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| Email address | Text (email) | Format + uniqueness | Primary identifier |
| Password | Password | Min 8 chars, mixed case likely | Not shown after entry |
| First name | Text | Required | |
| Last name | Text | Required | |

### 3.2 SSO Options

- "Continue with Google" (observed on mobile)
- "Continue with Apple" (observed on iOS)

### 3.3 Consent Checkboxes (Observed Patterns)

- Accept Terms & Conditions (required)
- Accept Privacy Policy (required)
- Marketing communications opt-in (optional, pre-unchecked in EU per GDPR)

---

## 4. Phase 2: Country & Business Type Selection

### 4.1 Country Selection

This is the most critical branch point — it determines:
- Regulatory path (GDPR, PCI, local AML rules)
- Available products (e.g., Business Account only in some markets)
- Required KYC documents
- Currency and settlement options
- Supported languages

**Observed:** Country selector shown early in flow (web and mobile).

### 4.2 Business Type Branching

This is the second critical branch:

```
Is the business registered as a legal entity?
├── YES (Registered business)
│   ├── Sole Trader / Freelancer with registration
│   ├── Limited Company / GmbH / SAS / etc.
│   ├── Partnership
│   └── Other registered entity
└── NO (Individual / Unregistered)
    ├── Individual (no business registration)
    └── Sole trader (informal, no registration number)
```

**Impact:** Business type determines KYC vs KYB, required documents, risk profile.

---

## 5. Phase 3: Business Profile Collection

### 5.1 Individual / Unregistered Sole Trader

| Field | Required | Notes |
|-------|---------|-------|
| Legal full name | Yes | Must match ID document |
| Date of birth | Yes | Age verification (18+) |
| Home address | Yes | Line 1, Line 2, City, Postcode, Country |
| Phone number | Yes | For OTP and communication |
| Business name / trading name | Yes | Can be personal name |
| Business category / MCC | Yes | Merchant Category Code — see section 6 |
| Estimated monthly turnover | Yes | Risk assessment input |
| Expected transaction type | Yes | In-person / online / both |

### 5.2 Registered Business (Company / Ltd / GmbH)

Additional fields beyond Individual:

| Field | Required | Notes |
|-------|---------|-------|
| Legal business name | Yes | As registered |
| Company registration number | Yes | National registry number |
| VAT number | Conditional | Required if VAT-registered |
| Registered business address | Yes | |
| Business type / legal form | Yes | Ltd, GmbH, SAS, etc. |
| Industry / business category | Yes | |
| Beneficial owners (>25% share) | Yes | AML requirement |
| UBO (Ultimate Beneficial Owner) details | Yes | Full name, DOB, address, ownership % |
| Director / authorized signatory | Yes | Legal representative |

---

## 6. Business Category (MCC) Selection

**Observed:** Dropdown or search selection of business type.

Key categories publicly visible in SumUp marketing:

| Category | Subcategories (observed) |
|----------|--------------------------|
| Food & Drink | Café, Restaurant, Food Truck, Bakery, Bar |
| Retail | Clothing, Gifts, Electronics, Books, General |
| Health & Beauty | Hair Salon, Nail Salon, Spa, Massage |
| Sport & Fitness | Gym, Personal Trainer, Sports Club |
| Services | Tradesperson, Cleaner, Consultant |
| Events & Entertainment | Market Trader, Event Organiser |
| Charity | Charity/Non-profit |
| Other | Other (specify) |

---

## 7. Phase 4: Identity Verification (KYC/KYB)

### 7.1 KYC (Individual Identity Verification)

**Required documents (observed from help center):**

| Document Type | Accepted | Notes |
|--------------|---------|-------|
| National ID card | Yes (most EU countries) | Front + back |
| Passport | Yes (all countries) | Main page |
| Driving licence | Yes (most countries) | Front + back |
| Residence permit | Conditional | Some countries only |

**Verification methods:**

| Method | Description | Notes |
|--------|------------|-------|
| Document upload | Photo of ID document | All platforms |
| Liveness check / selfie | Face match to document | Mobile primarily |
| Automated OCR | Extracts name, DOB, doc number | HYPOTHESIS — Medium |
| Manual review | Human reviews flagged submissions | Fallback |

### 7.2 KYB (Business Verification)

**Required documents (observed from help center):**

| Document Type | Accepted | Notes |
|--------------|---------|-------|
| Certificate of Incorporation | Yes | Registered companies |
| Articles of Association / Memorandum | Conditional | Larger entities |
| Latest annual accounts | Conditional | HYPOTHESIS — for higher risk |
| Bank statement | Conditional | Address/account confirmation |
| Proof of business address | Conditional | Utility bill, bank letter |
| UBO declaration form | Yes | AML requirement |

---

## 8. Phase 5: Banking Details

| Field | Notes |
|-------|-------|
| IBAN (EU/UK) | For merchant settlement payouts |
| Sort code + account number (UK) | Alternate UK bank entry |
| Routing + account number (US) | ACH for US payouts |
| Bank account holder name | Must match legal name |

**Payout frequency:** Typically next business day or weekly (observable from public pricing pages).

---

## 9. Phase 6: Hardware Selection

HYPOTHESIS (Medium confidence): Hardware can be ordered during or after signup.

Observed flow:
1. Signup starts at sumup.com with "Get Started"
2. Hardware can be added to cart before or after account creation
3. If hardware is purchased pre-signup, account creation may be prompted during checkout

---

## 10. Manual Review Paths & Risk Flags

HYPOTHESIS (High confidence — standard AML/KYC pattern):

| Trigger | Action |
|---------|--------|
| Document OCR fails | Manual review queue |
| Liveness check fails | Manual review queue |
| High-risk MCC | Additional documentation request |
| High estimated turnover | Enhanced due diligence |
| Name appears on sanctions list | Account hold + compliance review |
| Multiple failed verification attempts | Temporary block |
| Inconsistent information | Request clarification |
| UBO verification fails | Manual KYB review |

---

## 11. Activation Outcomes

| Outcome | Description |
|---------|-------------|
| Auto-approved | Low risk profile, successful KYC — immediate access |
| Pending review | Flagged for manual review — typically 1-3 business days |
| Approved with limits | Provisional limits set pending full verification |
| Rejected | Does not meet requirements (specific reasons vary by regulation) |
| More information needed | Missing documents — user notified via email |

---

## 12. Post-Onboarding First Steps (Observed from App Screenshots)

1. Pair card reader (if purchased)
2. Add first product to catalog
3. Make test transaction
4. Configure receipt template
5. Invite staff members

---

## References

1. https://help.sumup.com/en-GB/categories/3155 (Account setup — public)
2. https://help.sumup.com/en-GB/articles/kyc (KYC articles — public)
3. https://www.sumup.com/en-gb/start/ (Signup flow entry — public)
4. EU AML Directive (5AMLD/6AMLD) — public regulation
5. PSD2 requirements (EU) — public regulation
