# Individual vs Business Onboarding Flows

## Overview

SumUp supports multiple legal entity types with different onboarding paths. This document details the differences between individual/sole trader flows and registered business flows, based on publicly observable information.

---

## 1. Flow Comparison Matrix

| Step | Individual | Sole Trader (informal) | Sole Trader (registered) | Company / Ltd | Partnership | Charity |
|------|-----------|------------------------|--------------------------|---------------|-------------|---------|
| Personal name | Required | Required | Required | Required (director) | Required (partner) | Required (trustee) |
| Date of birth | Required | Required | Required | Required (director) | Required | Required |
| Home address | Required | Required | Required | Required (director) | Required | Required |
| Phone + OTP | Required | Required | Required | Required | Required | Required |
| Business name | Own name | Trading name | Trading name | Company legal name | Partnership name | Charity name |
| Company reg number | - | - | Optional/country | Required | Required | Required |
| VAT number | - | Conditional | Conditional | Conditional | Conditional | Exempt |
| Business address | = home | Business/home | Business | Registered address | Registered address | Registered address |
| Business category | Required | Required | Required | Required | Required | Charity (fixed) |
| Estimated turnover | Required | Required | Required | Required | Required | Required |
| UBO declaration | N/A | N/A | N/A | Required (25%+) | Required (25%+) | Required |
| Certificate of Incorporation | - | - | Yes (if available) | Required | Required | Required |
| KYC (ID document) | Required (self) | Required (self) | Required (self) | Required (director) | Required (each partner) | Required (trustee) |
| Liveness check | Required | Required | Required | Required (director) | Required | Required |
| Bank account | Required | Required | Required | Required (business acct) | Required | Required |

---

## 2. Individual (No Business Registration)

### Use Case
- Hobbyist seller
- Private individual accepting payments occasionally
- Not operating as a business entity

### Flow Summary
```
account_creation
→ country_selection
→ business_type: individual
→ personal_name + DOB
→ personal_address
→ phone_verification
→ trading_name (can be own name)
→ business_category
→ estimated_turnover
→ id_document_upload
→ liveness_check
→ bank_account
→ review_submit
```

### KYC Requirements
- Personal ID (passport / national ID / driving licence)
- Liveness/selfie check
- NO business registration documents required
- Proof of address may be requested (HYPOTHESIS — conditional on risk flags)

### Restrictions (HYPOTHESIS — High confidence)
- Lower transaction limits until full KYC passed
- May not qualify for Business Account product
- Some MCC categories may be restricted

---

## 3. Sole Trader (Informal / Unregistered)

### Use Case
- Freelancer operating under personal name or trading name
- Not formally registered with Companies House / Handelsregister / etc.
- Common in UK, DE, FR for informal self-employment

### Flow Summary
Same as Individual, plus:
- Trading name / DBA name collection
- Business category more important (determines MCC code)
- Slightly higher default limits (HYPOTHESIS)

### Country Variations
| Country | Registration Requirement | Notes |
|---------|-------------------------|-------|
| UK | No — informal sole trading allowed | Just self-declaration |
| DE | Gewerbeanmeldung (trade registration) may be required for some categories | (HYPOTHESIS) |
| FR | Auto-entrepreneur status observed | May need SIRET number |
| US | DBA registration varies by state | Not always required |

---

## 4. Registered Business (Company / Ltd / GmbH / SAS)

### Use Case
- Limited company (UK: Ltd, DE: GmbH, FR: SAS/SARL, ES: SL)
- Incorporated entity with company registration number

### Additional Flow Steps
```
[after business_type = registered_company]
→ company_legal_name
→ company_registration_number
→ vat_number (if applicable)
→ registered_address
→ director_details (name, DOB, nationality)
→ ubo_declaration (who owns 25%+?)
→ ubo_details (for each UBO)
→ certificate_of_incorporation_upload
→ [then continues to personal KYC of director]
→ personal_id_upload
→ liveness_check
→ bank_account (business account)
→ review_submit
```

### KYB (Know Your Business) Requirements
- Certificate of Incorporation
- UBO declaration (AML requirement — EU 5AMLD)
- Director's personal KYC (ID + selfie)
- Business bank account details
- VAT certificate if VAT registered

### AML/Regulatory Notes
- UBO threshold: 25% ownership triggers enhanced verification (EU 5AMLD standard)
- Beneficial owner information must be collected for AML compliance
- High-risk MCCs may trigger enhanced due diligence

---

## 5. Partnership

### Use Case
- Business partnership (UK: LLP, DE: GbR, FR: SNC, etc.)

### Additional Requirements (HYPOTHESIS)
- All partners' personal KYC
- Partnership agreement document (HYPOTHESIS — may be requested)
- Each partner with 25%+ is an UBO

---

## 6. Charity / Non-Profit

### Use Case
- Registered charities
- Community Interest Companies (UK CIC)
- Associations (FR: Association loi 1901)

### Variations
- Charity registration number instead of company reg number
- Trustee KYC (not director)
- VAT typically exempt
- Transaction limits may be higher for registered charities (HYPOTHESIS)

---

## 7. Decision Logic: KYC vs KYB

```
business_type = individual | sole_trader (unregistered)
→ KYC ONLY (personal identity verification)
→ Required: ID document + selfie
→ NOT required: Business registration docs

business_type = sole_trader (registered) | company | partnership | charity
→ KYC + KYB
→ Required: Business registration documents + director/representative personal KYC
→ UBO declaration mandatory (if >25% shareholders exist)
```

---

## 8. Risk Scoring (HYPOTHESIS — High Confidence)

Based on standard fintech risk assessment practices:

| Factor | Risk Weight | Notes |
|--------|------------|-------|
| Business type | High | Individual < Sole trader < Company |
| MCC category | High | High-risk MCCs (crypto, adult, gambling) may be rejected |
| Monthly volume | High | Higher volume → enhanced DD |
| Country | High | FATF high-risk countries → higher scrutiny |
| Sanctions check | Critical | Automatic rejection trigger |
| PEP status | Critical | Politically Exposed Person → enhanced DD |
| Adverse media | Medium | HYPOTHESIS |
| Document quality | Medium | Poor quality → manual review |

---

## 9. Fallback Paths

| Trigger | Action | Resolution Time |
|---------|--------|----------------|
| OCR document failure | Manual document review | 1-3 business days |
| Liveness check failure (3x) | Manual review + possible video call | 2-5 business days |
| Sanctions/PEP match | Compliance team review | Variable |
| High-risk MCC | Enhanced DD documents requested | 3-7 business days |
| Inconsistent information | Information request email | User-driven |
| UBO verification failure | Manual KYB review | 3-7 business days |

---

## References

1. EU 5th Anti-Money Laundering Directive (5AMLD) — public regulation
2. UK Money Laundering Regulations 2017 — public regulation
3. FCA Guidance on AML controls — public
4. https://help.sumup.com/en-GB (public help center)
5. SumUp App Store screenshots (publicly visible onboarding screens)
