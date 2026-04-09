# SumUp Android App Analysis

## Overview

**Source:** https://play.google.com/store/apps/details?id=com.kaching.merchant&hl=en_GB  
**Package name:** com.kaching.merchant  
**App Name:** SumUp – Card Reader & POS  
**Date of analysis:** April 2026  
**Legal note:** All observations are from the publicly visible Google Play Store listing page only. No APK was downloaded, decompiled, or reverse engineered. No authentication was bypassed.

---

## 1. Play Store Listing Observations

| Field | Observed Value |
|-------|----------------|
| Developer | SumUp Payments Limited |
| Category | Finance |
| Package name | com.kaching.merchant (legacy identifier — "kaching" was SumUp's former brand in some markets) |
| Rating (approx) | ~4.2–4.4/5 (varies; larger Android user base tends to show more varied ratings) |
| Installs | 10,000,000+ (Play Store badge) |
| Updated | Frequently (monthly releases observed) |
| Android version | Android 7.0+ (observed from listing) |
| Content Rating | PEGI 3 / Everyone |
| In-app purchases | None listed |

**Notable:** Package name `com.kaching.merchant` preserves history — SumUp acquired/rebranded from "Kaching" in some markets. This is an observable public artifact.

---

## 2. Feature Summary (From Play Store Description)

Key capabilities advertised in the public Play Store listing (paraphrased — original text not reproduced):

- Accept card payments with SumUp hardware readers
- Google Pay acceptance (tap-to-pay)
- Tap to Pay on Android (NFC without hardware, some regions)
- Product catalog management
- Digital receipts
- Sales reports and analytics
- Multi-operator support
- Online store builder
- Invoicing
- WLAN-connected Solo terminal support

---

## 3. Supported Languages

From Play Store listing:

English, German, French, Spanish (ES + LATAM), Italian, Portuguese (BR + PT), Polish, Swedish, Danish, Norwegian, Finnish, Dutch, Czech, Slovak, Hungarian, Romanian, Croatian, Greek, Bulgarian, Catalan, Turkish, Lithuanian, Latvian, Estonian, Slovenian

---

## 4. App Architecture (Inferred / HYPOTHESIS)

> All items in this section are HYPOTHESIS unless marked OBSERVED. No binary analysis or APK decompilation was performed.

### 4.1 Technology Stack

| Component | Hypothesis | Confidence | Evidence |
|-----------|-----------|------------|----------|
| UI Framework | Kotlin + Jetpack Compose (partially, modern screens) + legacy XML layouts | Medium | Play Store screenshots suggest UI evolution; Compose widely adopted by fintech 2022+ |
| Architecture pattern | MVVM with ViewModel + StateFlow | Medium | Industry standard for Kotlin Android fintech apps |
| DI framework | Dagger/Hilt | Medium | Most common DI for large Android apps |
| Bluetooth | Android BluetoothAdapter + BLE GATT | High | Required for hardware reader support |
| NFC | Android NFC APIs / Host Card Emulation | High | Required for Tap to Pay support |
| Local storage | Room (SQLite wrapper) | Medium | Standard Android local persistence for transaction queue |
| Networking | Retrofit + OkHttp | Medium | Industry standard for Android REST clients |
| Auth tokens | Android Keystore | High | Standard secure storage for fintech |
| Image loading | Glide or Coil | Low | Common Android image libraries |
| Analytics | Firebase Analytics (HYPOTHESIS) | Low | Common in Android apps; Play Services dependency |
| Crash reporting | Firebase Crashlytics (HYPOTHESIS) | Low | Most common Android crash tool |

### 4.2 Build & Distribution

| Signal | Observation | Confidence |
|--------|-------------|------------|
| App bundle format | AAB (App Bundle) likely used for Play distribution | High |
| Minimum SDK | API 24 (Android 7.0) | High — directly stated in listing |
| Target SDK | Recent (32+) required by Play policies | High |

### 4.3 Play Store Permissions (Inferred from features)

Based on advertised features, the following Android permissions are expected:
- `BLUETOOTH` / `BLUETOOTH_CONNECT` / `BLUETOOTH_SCAN` (card reader)
- `NFC` (Tap to Pay)
- `CAMERA` (barcode scanning for products)
- `INTERNET` (transaction submission)
- `ACCESS_NETWORK_STATE` (connectivity check)
- `VIBRATE` (transaction confirmation haptic)
- `RECEIVE_BOOT_COMPLETED` (background transaction queue sync) — HYPOTHESIS

---

## 5. Play Store Screenshot Analysis

Based on publicly visible Play Store screenshots (not reproduced):

- Welcome/onboarding screen: country + business type selection
- Card reader pairing: animated Bluetooth/USB connection UI
- Main dashboard: daily totals, recent transactions
- Transaction completion: checkmark animation, receipt options
- Product grid: catalog management with images
- Report view: line chart of sales over time period

---

## 6. Data Safety Section (Play Store — Observed)

From the publicly visible Data Safety section:

- **Data shared with third parties:** Transaction history, payment info
- **Data collected:** Financial info, personal info, device/app info, app activity
- **Security practices:** Data encrypted in transit, users can request data deletion

---

## 7. Notable Differences: Android vs iOS

| Area | iOS | Android |
|------|-----|---------|
| Package legacy | `id514879214` (neutral) | `com.kaching.merchant` (legacy brand) |
| Hardware comms | CoreBluetooth | BluetoothAdapter + BLE GATT |
| Tap to Pay | Tap to Pay on iPhone (Apple API) | Android Tap to Pay (Google API) |
| Push | APNs | FCM (Firebase Cloud Messaging) |
| Auth storage | iOS Keychain | Android Keystore |
| Min OS version | iOS 14.0 | Android 7.0 |

---

## 8. Known Gaps

- APK manifest not analyzed (would reveal exact permissions and component declarations)
- Third-party SDK list not observable without binary analysis
- Network traffic not intercepted (would be unethical and likely ToS violation)
- Exact offline queue strategy unknown

---

## References

1. https://play.google.com/store/apps/details?id=com.kaching.merchant&hl=en_GB
2. https://developer.sumup.com (public API docs)
3. https://developer.android.com/nfc (Android NFC public docs)
4. https://help.sumup.com/en-GB/articles/
