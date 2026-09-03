# Baseline Repository & Commercial Architecture Audit
**Audit Date:** 2026-09-03 | **Auditor:** Antigravity AI (Governance Sprint)
**Target:** `vikasakankshasharma-jpg/team-cctv-platform` (`secure-easy`)

---

## 1. System Architecture
- **Framework:** Next.js 16.2.6 (App Router), React 19.2.4, TypeScript (strict: true).
- **Backend:** Firebase Admin SDK 13.8.0, Firestore, Firebase Storage.
- **Surface Area:** 150 API endpoints, 94 page routes, 459 root files, 61 Playwright test files.
- **Baseline Health:** TypeScript compilation (`npx tsc --noEmit`) passes with 0 errors.

---

## 2. Actual Active Customer Funnel ("Funnel Bifurcation")
1. **Primary Entry (`/wizard`):** Renders `WizardClientV2.tsx`. Generates quote inline via `POST /api/quote/generate` (`pricing-engine-v2.ts`), renders inline `QuoteComparison.tsx`, saves to `POST /api/quote/save` (client-trusting), attempts client Razorpay checkout. Never routes to `/quote/[leadId]`.
2. **Orphaned Full Quotation Experience (`/quote/[leadId]`):** Renders `ConfiguratorView.tsx`, `CompareCards.tsx`, `SmartContextBar.tsx` using `pricing-engine.ts` (v1). Has 2-column compare mode, PDF download, and review page `/quote/[leadId]/review/[quoteId]` using Cashfree (`@cashfreepayments/cashfree-js`). Severed from primary wizard.

---

## 3. Actual Active Pricing Callers (Engine Bifurcation)
- **Engine v1 (`lib/pricing-engine.ts`):** 7 callers (`MatricesClient.tsx`, `quotes/route.ts`, `PricingBoard.tsx`, `ScenarioSimulator.tsx`, `CompareCards.tsx`, `ConfiguratorView.tsx`, `SpecCompareTable.tsx`). Supports complete addon and component calculations.
- **Engine v2 (`lib/pricing-engine-v2.ts`):** 2 callers (`build/calculate/route.ts`, `quote/generate/route.ts`). Hardcodes cable/labor and line 197 explicitly drops addons (`addons: []`).

---

## 4. Actual Payment & Webhook Flows
- **Razorpay:** Target canonical provider per owner decision.
  - API: `app/api/payment/razorpay/route.ts` (requires server-side lookup of quote amount; client amount must be ignored).
  - Webhook: `app/api/webhooks/razorpay/route.ts` (requires fail-closed secret verification; remove hardcoded staging secret; enforce order/amount cross-checks and idempotency).
- **Cashfree:** Unsafe and marked for retirement.
  - `lib/cashfree.ts` line 138: `verifyWebhookSignature` is a stub returning `true`.
  - `QuoteReviewClient.tsx` line 130: Hardcoded `mode: "sandbox"`.

---

## 5. Actual Firestore Collections
- Core: `users`, `leads`, `quotes`, `products`, `addons`, `addon_rules`, `settings`, `wizard_steps`, `inventory`, `stock_ledger`, `invoices`, `receipts`, `jobs`, `demand_impressions`.
- Marketplace/Partner: `promoters`, `franchise_dealers`, `commission_records`, `installers`, `site_visit_bookings`.

---

## 6. Security Findings & Plaintext Credential Exposures (P0)
- 19 root and script files contain exposed live service-account private keys, client emails, and Web API keys (`push-vercel-env.js`, `push-vercel-env.ps1`, `fix-keys.js`, `add-demo-addons.mjs`, `staging-firebase-adminsdk.json`).
- Root directory contains 355 one-off scratch scripts, 26 loose logs/reports, and 9 loose HTML analysis files.

---

## 7. Action Matrix (Sprint Priority)
1. **P0:** Rotate exposed Firebase credentials; fail-closed Razorpay webhook; retire Cashfree; clean root.
2. **P0:** Consolidate to `lib/pricing-engine.ts`; enforce server-authoritative quote save; immutable quote revisions.
3. **P0:** Unify customer funnel (Wizard -> `/quote/[leadId]` -> Review -> Razorpay).
4. **P1:** Inventory reservation on verified payment; state-driven invoice generation; cron wiring.
5. **P1:** Comprehensive security & commercial consistency Playwright tests.
