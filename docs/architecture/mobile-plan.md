# Mobile App — Phase F (Planned, Not Yet Implemented)

> Status: **NOT IMPLEMENTED** — This document describes the intended design.

## Intent

An Expo React Native app that mirrors the web merchant dashboard, enabling on-the-go payment management.

## Planned Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Login / register | P0 | Shared auth with web |
| Dashboard summary | P0 | Revenue, recent transactions |
| Transaction list + detail | P0 | With refund action |
| Accept payment (manual entry) | P1 | Tap-to-pay stub |
| Checkout link creator | P1 | Share via native share sheet |
| Product catalogue browse | P2 | Read-only initially |
| Push notifications | P2 | For new transactions |

## Intended Stack

- **Framework:** Expo SDK 51 (React Native)
- **Navigation:** Expo Router (file-based)
- **State/data:** Same `@workspace/api-client-react` hooks as web
- **Auth:** JWT tokens stored in `expo-secure-store` (not AsyncStorage)
- **Payments:** Tap-to-pay via SumUp SDK (HYPOTHESIS — public partner docs only)
- **Styling:** NativeWind (Tailwind for RN)

## Integration Points

- Uses same REST API (`artifacts/api-server`) as the web app
- Shares `@workspace/api-zod` validators
- Shares `@workspace/api-client-react` hooks (via React Query)

## Why Deferred

Phase F was deferred to keep the core reference platform stable before adding native complexity. The web app and backend are fully functional and tested. Mobile will be scaffolded in a follow-up sprint using the `expo` skill.

## Next Steps When Resuming

1. Run `artifacts` skill to register a new `expo` kind artifact
2. Scaffold Expo app with `expo init` template
3. Wire up `setBaseUrl` to the API server URL
4. Implement auth flow using `expo-secure-store`
5. Port the dashboard, transactions, and products pages
