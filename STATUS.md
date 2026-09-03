# Sprint Task Execution Status

- [x] **Audit Before Modify Gate:** Read-only audit complete. Baseline documented in `/docs/ANTIGRAVITY_INITIAL_AUDIT.md`.
- [x] **Governance Initialized:** Maintained `CAPABILITY_MATRIX.md`, `PRODUCTION_TRUTH.md`, `FUTURE_BACKLOG.md`.
- [x] **Task 2.1:** Razorpay hardening complete — server-authoritative amount from quote, fail-closed webhook, HMAC verification, idempotency, cross-binding.
- [x] **Phase 0.1:** Quarantined/deleted exposed credentials (`push-vercel-env.js`, `push-vercel-env.ps1`, `fix-keys.js`, `staging-firebase-adminsdk.json`).
- [x] **Phase 0.2:** Cashfree retired — deleted `lib/cashfree.ts`, webhook, `@cashfreepayments/*` deps, rewired `QuoteReviewClient.tsx` to Razorpay.
- [ ] **Phase 0.3:** Root directory cleanup (relocate/delete scratch scripts, stray logs, loose HTML).
- [x] **Phase 1.1:** Consolidated to single canonical pricing engine (`lib/pricing-engine.ts`); deleted `pricing-engine-v2.ts`. Verified `tsc --noEmit` clean.
- [x] **Phase 1.2:** Server-authoritative quote generation in `app/api/quote/save/route.ts`. ProBuilder phone validation & routing fixed.
- [x] **Phase 1.3:** Quote immutability — collision-safe `QT-YYYY-XXXXXX` IDs with existence check, versioned revisions `parentId_v{N}`, no parent mutation.
- [x] **Phase 2.1:** Funnel unification — `WizardClientV2` redirects to `/quote/${leadId}` on save completion instead of inline checkout.
- [x] **Phase 2.2:** `QuoteReviewClient.tsx` rewired to Razorpay checkout with dynamic SDK loading.
- [x] **Phase 2.3:** Dead `WizardClient.tsx` deleted.
- [ ] **Phase 3.1:** Wizard steps reconciliation — ensure all wizard questions map to `CCTVRequirement` fields consumed by pricing engine.
- [ ] **Phase 3.2:** Site-survey parameters — validate that `coverage_area`, `floors`, `outdoor_count` flow through to configuration and pricing.
- [x] **Phase 4.1:** Inventory reservation (deduction + RESERVED ledger entry) fires atomically inside Razorpay webhook on `payment.captured`.
- [x] **Phase 4.2:** State-driven invoice status polling — created `/api/invoice/[quoteId]/status` endpoint, `PaymentSuccessClient` polls for `PAID` status.
- [x] **Phase 4.3:** Wired cron triggers in `vercel.json` — followups (hourly), SLA escalation (every 15 min), profitability snapshot (daily at 2 AM).
- [ ] **Phase 4.4:** Installer Job Card operational template.
- [ ] **Phase 5:** Security, tamper, and commercial consistency Playwright tests + Golden Path launch gate.

