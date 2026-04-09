# SumUp iOS App Analysis

## Overview

**Source:** https://apps.apple.com/fi/app/sumup-payments-and-pos/id514879214  
**App Name:** SumUp – Card Reader & POS  
**App ID:** 514879214  
**Date of analysis:** April 2026  
**Legal note:** All observations are from the publicly visible App Store listing page only. No binary was downloaded, decompiled, or reverse engineered. No authentication was bypassed.

---

## 1. App Store Listing Observations

| Field | Observed Value |
|-------|----------------|
| Developer | SumUp Payments Limited |
| Category | Finance |
| Rating (at time of research) | ~4.5/5 (varies by region) |
| Size (approx) | ~100–150 MB (varies by version) |
| Minimum iOS version | iOS 14.0+ (observed from listing) |
| Languages listed | 29+ (see section 3) |
| In-App Purchases | None listed |
| Subscription | None listed |
| Age Rating | 4+ |

---

## 2. Feature Summary (From App Store Description — Publicly Visible)

Key capabilities advertised in the public App Store listing:

- Accept card payments via Bluetooth card reader
- Tap to Pay on iPhone (contactless NFC without hardware)
- Digital receipts via SMS/email
- Sales reporting and history
- Manage products/catalog
- Staff accounts management
- Online store integration
- Invoicing

**Legal note:** Feature list is paraphrased from publicly visible App Store description. Original copyrighted text not reproduced.

---

## 3. Supported Languages (From App Store)

Observed from the "Languages" section of the App Store listing:

English, German, French, Spanish (Spain), Spanish (Latin America), Italian, Portuguese (Brazil), Portuguese (Portugal), Polish, Swedish, Danish, Norwegian Bokmål, Finnish, Dutch, Czech, Slovak, Hungarian, Romanian, Croatian, Greek, Bulgarian, Catalan, Estonian, Latvian, Lithuanian, Slovenian, Turkish

---

## 4. App Architecture (Inferred / HYPOTHESIS)

> All items in this section are HYPOTHESIS unless marked OBSERVED. No binary analysis was performed.

### 4.1 Technology Stack

| Component | Hypothesis | Confidence | Evidence |
|-----------|-----------|------------|----------|
| UI Framework | UIKit + SwiftUI hybrid | Medium | App Store screenshots show both legacy and modern iOS UI patterns |
| Navigation | UINavigationController + modern SwiftUI NavigationStack hybrid | Medium | Screenshot analysis |
| Bluetooth | CoreBluetooth (required for card reader pairing) | High | Card reader is advertised; BT pairing is the only viable iOS approach |
| NFC (Tap to Pay) | Apple's `PassKit` / `CoreNFC` + Tap to Pay on iPhone API | High | Advertised feature; requires Apple-specific entitlement |
| Local storage | CoreData or SQLite (for offline transaction queue) | Medium | Offline capability implied by product design |
| Auth | OAuth 2.0 / OIDC tokens stored in Keychain | High | Standard iOS auth best practice for fintech |
| Analytics | Amplitude or Mixpanel (HYPOTHESIS) | Low | Typical fintech stack; not directly observable |
| Crash reporting | Firebase Crashlytics or Sentry (HYPOTHESIS) | Low | Industry standard; not directly observable |
| Push notifications | APNs (Apple Push Notification service) | High | Receipt/notification features advertised |

### 4.2 Payment Processing (HYPOTHESIS)

| Flow | Hypothesis | Confidence |
|------|-----------|------------|
| Card reader comms | Proprietary BLE protocol over CoreBluetooth | High |
| EMV processing | On-device EMV kernel or delegated to reader | Medium |
| PCI DSS scope | Reader handles card data; app only receives tokenized result | High |
| Tap to Pay | Uses Apple's Tap to Pay entitlement (delegated to Apple Wallet) | High |

### 4.3 Offline Capability

HYPOTHESIS (Medium confidence): The app likely queues transactions locally (CoreData/SQLite) when offline and syncs when connectivity is restored. Evidence: Advertised as suitable for market traders (sporadic connectivity).

---

## 5. App Store Screenshots Analysis

Based on publicly visible App Store screenshots (not reproduced here):

- Onboarding screens show country selection and business type selection
- Main dashboard shows transaction total, recent sales list
- Reader pairing screen shows animated Bluetooth connection flow
- Sales history shows filterable transaction list
- Product catalog management screen

---

## 6. Privacy Labels (App Store — Observed)

From the App Privacy section of the App Store listing:

- **Data used to track you:** Usage data, identifiers
- **Data linked to you:** Financial info (transaction data), contact info, identifiers, usage data
- **Data not linked to you:** Diagnostics

---

## 7. Known Gaps

- Exact third-party SDK versions not observable
- Internal API endpoint structure not observable
- EMV certification details not publicly disclosed
- Exact offline queue implementation unknown
- A/B test framework not identifiable

---

## References

1. https://apps.apple.com/fi/app/sumup-payments-and-pos/id514879214
2. https://developer.sumup.com (public API documentation)
3. https://developer.apple.com/tap-to-pay/ (Tap to Pay on iPhone public docs)
4. https://help.sumup.com/en-GB/articles/ (public help articles)
