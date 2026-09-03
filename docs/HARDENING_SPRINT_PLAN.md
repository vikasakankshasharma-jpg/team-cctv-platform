# TEAM CCTV Platform — Commercial Core Hardening Sprint
### A single source-of-truth prompt for Antigravity AI

---

## 0. Read this entire document before touching any code

You are working on `team-cctv-platform` (repo: `vikasakankshasharma-jpg/team-cctv-platform`, live at `cctvquotation.com`). This project has been independently reviewed three times in the last few days — by you (Antigravity), by ChatGPT, and by Claude — and all three reviews converged on the same conclusion from different angles:

> **The codebase has more features than it has commercial integrity.** Multiple parallel implementations exist for the same job (two pricing engines, two customer funnels, two payment providers), and several of them are actively unsafe with real money. This happened because different sessions/tools built things in parallel without one of them reading what the last one shipped.

**This document is the fix for that root cause, not just the code.** It is the one plan. Do not start a `v3` of anything. Do not create a new wizard, a new pricing engine, or a new payment flow alongside an existing one — extend or replace the canonical one named below. If you finish a task, mark it done in this file (or a `STATUS.md` you maintain alongside it) so the next session — yours or another tool's — doesn't rediscover it from scratch.

**Decision already made by the project owner: Razorpay is the canonical payment provider. Cashfree is being retired.**

### Execution order — follow this exactly, don't reorder by convenience

**Phase 0 (security) → Phase 0.5 (UX/IA audit) → Phase 0.75 (wiring map) → fix + merge `hardening-sprint` (section 2) → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → only then Phase 6.**

Two things about this that aren't obvious from the section numbers alone:

- **Do not start "improving the UI" before Phase 0.5 and Phase 0.75 have produced their six documents** (`UX_ARCHITECTURE.md`, `ROLE_JOURNEYS.md`, `SCREEN_INVENTORY.md`, `CANONICAL_FLOW.md`, `API_SCREEN_MAP.md`, `DATA_LIFECYCLE.md`). That's the actual safeguard against recreating the parallel-component problem this whole sprint exists to fix — a screen or wiring change made before those docs exist is exactly how the project ended up with two wizards and two pricing engines in the first place.
- **Run the Phase 0.5/0.75 audits against the `hardening-sprint` branch, not `master`.** `master` doesn't have the pricing/payment fixes from section 2 yet, so auditing it directly would document stale commercial logic. The branch doesn't need to be merged for the audit to be accurate — it just needs to be the code you're actually looking at.

---

## 1. Non-negotiable engineering principles for this sprint

Apply these to every task below, not just the ones that mention them explicitly:

1. **Server is the only source of commercial truth.** Price, GST, discounts, and totals are never accepted from the client — only computed server-side from the catalog and returned. The client may *select* things; it may never *state a price*.
2. **One canonical implementation per capability.** One pricing engine. One wizard. One payment provider. If you find a second one while working, that's a bug to fix in this sprint, not a feature to preserve "just in case."
3. **Fail closed on missing secrets/config.** Never fall back to a hardcoded string, a "staging" default, or `return true` when a real check can't run. Missing config = reject the request, log loudly, don't process.
4. **Quotes are immutable once generated.** A revision is a new document, never an overwrite.
5. **No feature is "done" without: data model + UI + API + business logic + security/RBAC + failure states + a passing E2E test.** A TypeScript interface or an unused component is "designed," not "done." Use this as your personal Definition of Done for every checkbox below.
6. **Don't add new customer-facing features until Phase 0–2 below are complete and verified.** This includes anything from the "growth ideas" backlog in Phase 6 — that's intentionally last.

### Status tags used in this document
A plain `[x]` doesn't distinguish "someone says it's done" from "it's actually safe to build on top of." Use these instead, and update them as a task's real status changes — don't leave a tag stale:

- `[TODO]` — not started.
- `[DONE-UNMERGED]` — implemented on a branch (currently `hardening-sprint`), not yet in `master`. Don't treat this as safe to build on top of yet.
- `[DONE-MERGED]` — implemented and in `master`.
- `[VERIFIED]` — checked against the 7-layer Definition of Done in Phase 5 (data model, UI, API, business logic, security/RBAC, failure states, E2E test), not just "it compiles" or "it renders."
- `[PRODUCTION-PROVEN]` — verified with a real transaction/evidence in the live or staging environment, not just a local test.
- `[BLOCKED: reason]` — cannot proceed until a named dependency is resolved.

---

## 2. Already done — verify and merge, don't redo

**Status as of the last review: a `hardening-sprint` branch exists on GitHub (not yet merged to `master`) that completes most of Phases 1, 2, and 4 below.** This was independently pulled and diffed against the real branch, not taken on the session's own word. It's substantially good work — server-authoritative pricing, transaction-wrapped webhook, real inline forms replacing `window.prompt()`, a real 3-state invoice-polling machine, cron jobs wired into `vercel.json`. Confirmed `[DONE-UNMERGED]` on that branch:

- Pricing engines consolidated into `lib/pricing-engine.ts`; `pricing-engine-v2.ts` deleted.
- `app/api/quote/save/route.ts` rewritten to be server-authoritative: discards client prices, refetches catalog/addons/settings, computes the snapshot itself. Collision-safe quote IDs (`crypto.randomBytes` + existence-check retry). Revisions are separate immutable documents, written inside a transaction.
- `app/api/payment/razorpay/route.ts` and `app/api/webhooks/razorpay/route.ts` hardened: server-side amount lookup, quote-expiry check, no-double-payment check, real HMAC verification with no fallback secret, transaction-wrapped webhook with order-ID and amount cross-checks, inventory deduction and job/invoice creation happening atomically inside that same transaction.
- `WizardClientV2` → on successful save, redirects to `/quote/${leadId}` instead of running its own inline checkout — the funnel bifurcation described in Phase 2 is fixed on the happy path.
- `PaymentSuccessClient` now polls `/api/invoice/[quoteId]/status` with a real `polling`/`ready`/`timed_out` state machine instead of a fixed timer.
- Cashfree fully removed (`lib/cashfree.ts`, its webhook route, its types, its `package.json` entries all deleted).

**Three concrete bugs were found on that branch and need fixing before merge — don't assume "compiles clean" means these are resolved:**

- `[DONE-UNMERGED]` ~~Three of the six files containing the plaintext leaked Firebase Admin key are still in the branch~~: `scripts/read-otp.mjs`, `lint_results.json`, `add-demo-addons.mjs` — **deleted in commit `4ac239d`**, BFG scrub instructions updated.
- `[DONE-UNMERGED]` ~~The new "advance payment" (partial payment) feature has a real amount-mismatch bug~~ — **fixed in commit `4ac239d`**: webhook now checks `razorpay_order_amount` first, falls back to `total_payable`.
- `[DONE-UNMERGED]` ~~The flagship "pricing consistency" Playwright test doesn't actually assert pricing consistency~~ — **fixed in commit `4ac239d`**: test now asserts `total_payable` is defined, not `4`, and > 1000.
- `[TODO]` `WizardClientV2.tsx` still contains a fully-wired `handlePayment` function attached to a live button (`onClick={handlePayment}`), plus the old WhatsApp/PDF-link code, none of it deleted even though the save handler now redirects away before reaching it. Confirm it's genuinely unreachable (no resume/back-navigation path still lands on it), then delete it — leaving a second live checkout path defined in the same file is exactly the kind of thing that caused the original bifurcation.
- `[TODO]` Several files changed in this branch aren't explained in its own summary: `components/admin/SettingsForm.tsx` (grew to 1000+ lines), `app/(admin)/admin/catalog-manager/`, `app/(admin)/admin/products/health/page.tsx`, `lib/margin-engine.ts`, `lib/product-resolver.ts`. Get a one-line explanation of each before merging.

**Task 2.1** — `[TODO]` Fix the five items above on the `hardening-sprint` branch.
**Task 2.2** — `[TODO]` Run `npm run build`, `npx tsc --noEmit`, and the existing Playwright suite against the fixed branch, not just the new spec file.
**Task 2.3** — `[TODO]` Merge to `master`.

**Credential rotation is NOT gated on this merge — it's Phase 0 below, and Phase 0 is independent and immediate.** Do not read "merge first, then rotate" into this section; revoking the exposed Firebase and Maps keys should already be done or in progress *today*, regardless of where the branch/merge stands. The only thing that legitimately waits for the merge is the **git-history scrub** — do that once, after all six leaked-key files are gone from the tree (three already removed, three remaining per the bug above), rather than scrubbing twice.

---

## 3. Phase 0 — Security emergency (today, before anything else)

### 3.1 Leaked Firebase Admin credentials
A live Firebase Admin SDK private key, project ID, client email, Web API key, and Google Maps API key are committed in plaintext to this **public** repo in multiple files:
`push-vercel-env.js`, `push-vercel-env.ps1`, `scripts/read-otp.mjs`, `lint_results.json`, `add-demo-addons.mjs`, `fix-keys.js` (project: `team-cctv-live-8294`).

- [ ] Revoke the exposed service-account key in Google Cloud Console → IAM & Admin → Service Accounts, generate a new one.
- [ ] Regenerate and restrict the exposed `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (HTTP referrer + API restrictions).
- [ ] Put new keys into Vercel env vars only. Delete the offending files from the repo.
- [ ] Scrub the key from **git history** (`git filter-repo` or BFG) — a plain delete + commit leaves it recoverable from old commits.
- [ ] Check Firebase/Firestore audit logs for the exposure window for any unfamiliar access.
- [ ] Add secret scanning (gitleaks or GitHub secret scanning) as a required CI check so this can't recur silently.

### 3.2 Cashfree — confirmed unsafe, being retired per owner decision
- `lib/cashfree.ts` line 135-139: `verifyWebhookSignature()` is a stub that unconditionally `return true` — any payload is accepted as a real payment.
- `app/(customer)/quote/[leadId]/review/[quoteId]/QuoteReviewClient.tsx` line 130: checkout is hardcoded to `load({ mode: "sandbox" })` regardless of environment.

Since Razorpay is now canonical:
- [ ] Delete `lib/cashfree.ts` and `app/api/webhooks/cashfree/`.
- [ ] Remove the Cashfree checkout call from `QuoteReviewClient.tsx` (see Phase 2 for what replaces it — don't just delete the button, this page's UX needs to be preserved and rewired to Razorpay).
- [ ] Remove `@cashfreepayments/cashfree-js` and `@cashfreepayments/cashfree-sdk` from `package.json` once nothing references them.
- [ ] Update `README.md` to stop claiming Cashfree as the payment provider.

### 3.3 Repo hygiene
The repo root has 438 items, of which ~352 are one-off scratch scripts (`check-*.mjs`, `append-*.js`, `add-*.js`), plus stray logs (`ai-error.log`, `build-log.txt`), JSON reports, a `code_export.zip`, loose `.html` analysis files, and stray SVGs. This is how the leaked key above happened — a throwaway script never got cleaned up.

- [ ] Delete or relocate all root-level scratch scripts into `/scripts` or `/scratch` (both already gitignored/vercelignored) — whichever are still needed. Delete the rest.
- [ ] Delete `ai-error.log`, `build-log.txt`, `admin-crawler-report.json`, `admin-interactive-report.json`, `code_export.zip`, and the loose `cctv*.html` files from the repo (keep local copies if you need the history, but they don't belong in version control).
- [ ] Move loose SVGs (`dahua1.svg`, `dahua2.svg`, etc.) into `/public` if still used, or delete if not referenced.

---

## 4. Phase 0.5 — UX & Information Architecture audit (do this before further UI work)

A code-level audit of the actual components found the same "parallel implementations, never reconciled" pattern in the UI layer that Phases 0–1 found in the business logic: `components/ui` (the shared design-system primitives — Button, Card, Input, Dialog, Table) is used in only ~35 of ~280 component/page files, and outside `/admin` its adoption is close to zero — the customer wizard, installer app, salesperson dashboard, and partner portal each built their own one-off styling instead of sharing one system. Separately, the admin sidebar has grown to 26 nav items across 5 groups, with pricing-related configuration alone spread across 5 different screens (Catalog & Pricing, Live Pricing, Geo-Pricing Rules, Quotation Matrices, Rules & Add-ons) — an information-architecture problem that is very likely *why* a second pricing engine was able to grow unnoticed in the first place. `components/admin/SettingsForm.tsx` is 1000+ lines as a single flat scrolling form covering ten unrelated concerns with no tabs.

The organizing principle for this phase, converged on independently by two separate reviews of this project: **the customer should see decisions, staff should see tasks, and the system should absorb the complexity — not the person using it.** Concretely, model the backend around three tiers, not one flat list — conflating these is exactly how "quote" and "job" got tangled together in the current code:

- **Core commercial chain (5 objects):** Customer → Requirement → Configuration → Quote → Job. This is the backbone. A Quote is never mutated into a Job; a Job that discovers new facts on-site (e.g. more cable than quoted) produces a Change Order, not a silent rewrite of the original commercial agreement.
- **Controlled lifecycle objects (2):** Payment and Change Order. These attach to the chain but are not steps within it — a Quote is not "a Payment status," and a Job is not "whatever the Change Order says now." Give both their own identity and state.
- **Job states/processes, not separate core objects:** Site Survey, QA, and Handover are stages a Job moves through (see Phase 0.75), not additional top-level business objects alongside the five above.

**Payment and Change Order should be explicit, controlled objects in their own right** — don't let them collapse into `quote.status` or `job.status` as an implicit side effect, since a Quote is not the same thing as a Payment, which is not the same thing as a Job:

```
Customer → Requirement → Configuration → Quote Revision → (Payment / Site Survey) → Job → Change Order(s) → QA → Handover

Payment and Site Survey are parallel, not sequential — the CTA business rule in Phase 0.5 above determines which is offered as primary per quote complexity, and a quote can go through Site Survey before Payment, or Payment without a survey, depending on that rule. Neither is a hidden side effect of the other; both are explicit predecessors a Job can require before it's created.
```

Give Payment an explicit state enum instead of a single `PAID` boolean — this is the direct fix for the advance-payment ambiguity flagged in section 2 (an advance payment currently looks identical to a full payment, which loses track of the remaining balance):

```
PAYMENT_PENDING → ADVANCE_PAID → PAID
                → PAYMENT_FAILED
                → PAYMENT_EXPIRED
PAID → REFUNDED / PARTIALLY_REFUNDED
```

Job eligibility and invoice generation should be derived from this explicit state (e.g. "is there enough paid to start work, per business rule" — which may or may not require `PAID` outright depending on your advance-payment policy), not from an assumed `quote.status === "PAID"` check scattered across multiple files.

Do not redesign any screen yet. Produce the audit first:

- `[TODO]` For each of six personas — **Customer, Salesperson, Operations/Admin, Installer, Finance, Partner** — document: primary goal, top 3 tasks, information genuinely required, information currently shown that isn't needed, entry point, next action, success state, failure state, mobile requirements, permissions, and navigation.
- `[TODO]` For every existing screen, tag it **KEEP / SIMPLIFY / MERGE / MOVE / REMOVE / BUILD** against that persona model. In particular: evaluate merging the five pricing-admin screens into one coherent section, and splitting `SettingsForm.tsx` into tabs (reuse the tabbed pattern already proven to work well in `components/quotation/FullCustomizerPanel.tsx` — don't invent a new pattern).
- `[TODO]` Produce three docs: `/docs/UX_ARCHITECTURE.md` (the five-object model, the Payment/Change Order extension, and the role-boundary principle above), `/docs/ROLE_JOURNEYS.md` (the six persona breakdowns), `/docs/SCREEN_INVENTORY.md` (every screen with its KEEP/SIMPLIFY/MERGE/MOVE/REMOVE/BUILD tag and reasoning).
- `[TODO]` Only after those three docs exist, propose a canonical nav per role (rough starting shape to validate or correct, not to implement blind: Customer — Home/My Quote/Installation/Warranty/Support; Salesperson — Today/Leads/Quotes/Follow-ups/Customers; Operations — Today/Jobs/Installers/Inventory/Site Visits; Installer — Today/Jobs/Materials/Earnings/Profile; Finance — Overview/Payments/Invoices/Refunds/Reconciliation; Admin — Overview/Sales/Quotes/Operations/Inventory/Finance/Pricing/Users/Settings/Analytics).
- `[TODO]` Decide the "Confirm & Pay" vs. "Book Free Site Survey" question as a **configurable business rule, not a single hardcoded CTA.** It's a genuine trade-off (trust-building vs. giving every price-shopper a friction-free way to defer payment) — don't resolve it by picking one layout. A workable starting pattern: let job/quote complexity drive which CTA is primary — e.g. `LOW_COMPLEXITY → online payment primary`, `MEDIUM_COMPLEXITY → online payment primary, survey offered`, `HIGH_COMPLEXITY (large commercial jobs, unusual site conditions) → survey recommended, payment still available`. Document this as a rule the business can tune, not a fixed UI decision.
- `[TODO]` Adopt `components/ui` as the mandatory design system for all new and touched UI going forward. Don't do a big-bang rewrite of existing screens — migrate opportunistically starting with the wizard and Pro Builder (revenue-critical, currently non-adopting).
- `[TODO]` Replace native `alert()`/`confirm()`/`window.prompt()` calls (heaviest in `/admin`, 15 files) with one shared toast/modal component from `components/ui`.

Only once `SCREEN_INVENTORY.md` exists should Phase 3's wizard-question additions and any new dashboard work be implemented against it, rather than each screen being redesigned independently again.

---

## 5. Phase 0.75 — Canonical wiring map (do this alongside Phase 0.5, before Phase 1 implementation)

Phase 0.5 documents the *human* side (personas, screens, navigation). This phase documents the *technical* side: for every major transition in the customer and staff journeys, force an explicit record of which UI component calls which API route, what validates the request, what business logic runs, which Firestore collection/document it touches, what permissions gate it, and what the resulting and failure states are. This is the direct, mechanical prevention for the exact failure mode this whole sprint has been cleaning up: a UI component quietly calling a second, undocumented backend path that nobody remembers exists.

- `[TODO]` For the customer journey (Homepage → Wizard → Lead → Requirement → Configuration → Quote Preview → Quote Revision → Payment / Site Survey → Invoice → Job → Installer → QA → Handover), document each transition as: UI component → API route → validation → business logic → Firestore collection/document → permissions → resulting state → failure state. Site Survey is a parallel predecessor to Job alongside Payment (see Phase 0.5) — map its own component/route/collection chain explicitly rather than letting it default to an implicit side effect of the payment flow.
- `[TODO]` Do the same for the Sales, Operations, Installer, Finance, and Admin journeys defined in Phase 0.5's `ROLE_JOURNEYS.md`.
- `[TODO]` Produce three docs: `/docs/CANONICAL_FLOW.md` (the end-to-end journey diagrams), `/docs/API_SCREEN_MAP.md` (the component → route → Firestore mapping table), `/docs/DATA_LIFECYCLE.md` (what state each core object — Customer/Requirement/Configuration/Quote/Payment/Job/Change Order — can be in, and what's allowed to transition it).
- `[TODO]` While building this map, flag any screen found calling an API route not listed in `API_SCREEN_MAP.md`, or any route with no calling screen — both are signals of exactly the kind of orphaned/duplicate implementation this project keeps producing.

Do not begin Phase 3's wizard/data-model work until both `SCREEN_INVENTORY.md` (Phase 0.5) and `DATA_LIFECYCLE.md` (this phase) exist — implementing new fields or new screens without them is how the project ends up with a second wizard schema again.

---

## 6. Phase 1 — Commercial core hardening (P0)

**Status: mostly `[DONE-UNMERGED]` on `hardening-sprint` — see section 2 for what's confirmed and what's still `[TODO]` before merge.** The subsections below describe the target state and the remaining verification work; don't re-implement what's already done.

### 6.1 Consolidate the two pricing engines — `[DONE-UNMERGED]`, needs `[VERIFIED]`
`lib/pricing-engine.ts` (v1) and `lib/pricing-engine-v2.ts` were both live in production with **different hardcoded values** (v2 line 97: cable cost 25/15 vs v1; line 138: labor 500/400) and v2 **silently dropped addons** (line 197: `addons: [], // ignoring addons for simplicity in this refactor`). `pricing-engine-v2.ts` has since been deleted on `hardening-sprint` and everything consolidated into `lib/pricing-engine.ts`.

Original callers, for reference when verifying nothing was missed in the migration:
- v1: `app/api/quotes/route.ts`, `components/admin/ScenarioSimulator.tsx`, `components/admin/PricingBoard.tsx`, `components/quotation/CompareCards.tsx`, `components/quotation/ConfiguratorView.tsx`, `components/quotation/SpecCompareTable.tsx`, `app/(admin)/admin/pricing/matrices/MatricesClient.tsx`
- v2 (now migrated): `app/api/build/calculate/route.ts`, `app/api/quote/generate/route.ts`

Remaining:
- `[TODO]` Confirm the storage calculation prefers the catalog's `daily_gb_per_camera` field when present, instead of the generic hardcoded 40GB/day-continuous / 20GB-motion assumption — verify this survived the consolidation rather than assuming it.
- `[TODO]` Confirm every original v2 caller was actually migrated to the canonical engine, not just that `pricing-engine-v2.ts` was deleted (a deleted import would fail the build, but a caller that was rewritten to inline its own pricing logic instead of using the canonical engine would not).
- `[VERIFIED]` needed: **same requirement, run through every entry point (wizard, Pro Builder, admin quote tool) → identical price.** This is the single most important regression test in this sprint — the corrected version of `tests/e2e-commercial-hardening.spec.ts` (handed off in review) is a first pass at this, run it and confirm it actually passes.

### 6.2 Server-authoritative quote generation — `[DONE-UNMERGED]`, needs `[VERIFIED]`
`app/api/quote/save/route.ts` was rewritten on `hardening-sprint`: it discards client-submitted prices, refetches catalog/addons/settings from Firestore, and computes `pricingSnapshot` itself server-side for both the wizard and Pro Builder sources. `components/builder/ProBuilderClient.tsx`'s empty-mobile bug (`customer_mobile: ""`) is also fixed with a real inline phone form.

Remaining:
- `[TODO]` Confirm `app/api/quote/generate/route.ts` (the entry point the wizard calls first, for the preview) is equally server-computed and that nothing client-supplied in that preview response gets echoed back and trusted at save time.
- `[VERIFIED]` needed: manually attempt to tamper the price/quantity/discount fields sent to `/api/quote/save` and confirm the saved `total_payable` is unaffected — the corrected Playwright test (handed off in review) automates this, but run it, don't just read the diff.

### 6.3 Quote immutability and ID safety — `[DONE-UNMERGED]`, needs `[VERIFIED]`
Collision-safe quote IDs (`crypto.randomBytes(3).toString("hex")` + existence-check retry) and transaction-wrapped revision documents (`${parentQuoteId}_v${version}`, parent never overwritten) are implemented on `hardening-sprint`.

Remaining:
- `[TODO]` Enforce the 7-day `validUntil` at payment time — confirm this check is actually present in the hardened `/api/payment/razorpay` from section 2, not just assumed.

---

## 7. Phase 2 — Funnel unification

### 7.1 The "Funnel Bifurcation" (introduced in commit `0d96869`, "release: production readiness gate 4.6") — `[DONE-UNMERGED]`, needs `[VERIFIED]`
`app/(customer)/wizard/page.tsx` renders `WizardClientV2`, which used to handle quote generation, an inline compare view, and checkout entirely by itself, calling Razorpay directly, never navigating to `/quote/[leadId]`.

The richer experience — `ConfiguratorView.tsx` with `SmartContextBar.tsx`, 2-column compare, PDF download — lives at `/quote/[leadId]` and `/quote/[leadId]/review/[quoteId]`.

`components/wizard/WizardClient.tsx` (the pre-V2 original) was confirmed dead code and has since been deleted on the `hardening-sprint` branch.

**`WizardClientV2`'s completion step now calls `/api/quote/save` and redirects to `/quote/${leadId}` instead of running its own checkout, and `QuoteReviewClient.tsx` is rewired to Razorpay.** Remaining:
- `[TODO]` Delete the now-unreachable `handlePayment`/WhatsApp/PDF code still sitting in `WizardClientV2.tsx` (see section 2's bug list) once confirmed genuinely dead.
- `[TODO]` Confirm `LeadGate.tsx`'s OTP gate and any B2B threshold routing (`B2BInfoStep.tsx`) still fire correctly for users arriving via this unified path — the original bifurcation bypassed both, and the fix should be checked against that, not just against the happy path.

---

## 8. Phase 3 — Data model / business-logic alignment (P1)

**Do not start this phase until `/docs/SCREEN_INVENTORY.md` (Phase 0.5) and `/docs/DATA_LIFECYCLE.md` (Phase 0.75) exist** — adding wizard fields or site-survey questions without that groundwork is exactly how the project ended up with a second wizard schema before.

### 8.1 Wizard schema duplication — `[TODO]`
Reconcile the Firestore `wizard_steps`/`wizard_questions`/`wizard_options` collections against the hardcoded step list in `WizardClientV2.tsx`. Pick one canonical source (recommend Firestore-driven, UI as pure renderer) and remove the other.

### 8.2 Add 3 missing high-conversion wizard questions — `[TODO]`
Budget range (`<₹30k` / `₹30k–75k` / `₹75k–1.5L` / `No limit`), New install vs. existing-wiring upgrade (existing coax reuse saves ₹8k–20k, should affect pricing), and Primary purpose (face recognition / vehicle plates / general monitoring).

### 8.3 Site-survey alignment — `[TODO]`
The `SiteSurveySnapshot` type already models mounting height, surface type, ladder need, indoor/outdoor split, wiring type, DVR power socket, router proximity, junction box needs — but the wizard only collects height + surface. Add the remaining questions (progressive disclosure is fine) so pricing and the installer job card (9.4) both get real data instead of defaults.

### 8.4 Configuration engine fallback risk — `[TODO]`
`configuration-engine.ts` assumes "all indoor" when only a total camera count is supplied. Confirm this fallback can't be reached from the production wizard now that indoor/outdoor is being properly collected (8.2/8.3); if it can still be reached, make it a required question instead of an assumption.

### 8.5 STQC as an explicit upgrade toggle — `[TODO]`
Currently a product-level flag (`is_stqc`) with no customer-facing explanation. Add it to the wizard/customizer as an explicit toggle with a one-line explanation of government/banking-compliance relevance.

---

## 9. Phase 4 — Operational integrity (P1)

### 9.1 Inventory reservation as a first-class state — `[DONE-UNMERGED]`
Done on `hardening-sprint`: the webhook's transaction now calls `InventoryEngine.attemptDeduction` atomically alongside marking the quote `PAID`, with a `BACKORDERED` job status when stock is insufficient. `[TODO]` Verify a reservation-expiry exists for the gap between order-creation and payment, not just at payment time.

### 9.2 Invoice generation is state-driven — `[DONE-UNMERGED]`
Done on `hardening-sprint`: `PaymentSuccessClient` polls `/api/invoice/[quoteId]/status` with a real `polling`/`ready`/`timed_out` state machine.

### 9.3 Cron jobs wired into `vercel.json` — `[DONE-UNMERGED]`
Done on `hardening-sprint`: `followups` (hourly), `sla-escalation` (every 15 min), `profitability-snapshot` (daily) all scheduled.

### 9.4 Dedicated Installer Job Card — `[TODO]`
Not yet started, generated from the same requirement/configuration snapshot, containing: customer/address/contact, camera breakdown (indoor/outdoor split), recorder/HDD spec, cabling length + type, site conditions (ceiling height, surface, ladder responsibility), power/router availability, a material checklist, and a completion checklist (camera tested, remote viewing, recording, playback, customer handover, photos, customer OTP sign-off). Design this against `/docs/SCREEN_INVENTORY.md` from Phase 0.5, since the installer's mockup in that phase should define exactly what this screen needs to show.

---

## 10. Phase 5 — Testing & verification gates

Before marking **any** capability "done," check it against all seven layers, not just "the page loads" (and don't mark it `[VERIFIED]` in this document until it passes all seven):

```
1. Data model    2. UI    3. API    4. Business logic
5. Security/RBAC 6. Failure/edge cases    7. E2E test
```

Required new test suites (add to Playwright). Each of these, once written and passing, is what promotes the related Phase 1/2 items above from `[DONE-UNMERGED]` to `[VERIFIED]` — treat these tags as live, not just a one-time checklist:

**Security / tamper tests**
- `[TODO]` Customer cannot change `unit_price`, GST, or quote total via any request body field.
- `[TODO]` Customer cannot mark their own quote/payment as `PAID`.
- `[TODO]` A payment made for one quote cannot be replayed to mark a different (especially higher-value) quote as `PAID`.
- `[TODO]` A webhook request with an invalid or missing signature is rejected, including when the secret env var is unset (must fail closed, not open).
- `[TODO]` Salesperson A cannot access Salesperson B's leads; Installer at Hub A cannot access Hub B's jobs.

**Commercial consistency tests**
- `[TODO]` Same requirement, submitted via wizard / Pro Builder / admin tool → identical final price.
- `[TODO]` A catalog cost change affects new quotes only — existing saved quotes are unaffected.
- `[TODO]` An expired quote cannot be paid.
- `[TODO]` Out-of-stock items cannot be purchased through to a `PAID` state.

**Payment tests**
- `[TODO]` Wrong signature → rejected, no state change.
- `[TODO]` Wrong order ID / wrong amount / wrong currency → rejected, no state change.
- `[TODO]` An advance payment is correctly recorded as `ADVANCE_PAID`, not rejected as a mismatch and not silently treated as `PAID` (regression test for the bug in section 2).
- `[TODO]` Duplicate webhook delivery → no duplicate invoice or job (idempotency already exists — add a regression test for it).
- `[TODO]` Visiting `/payment-success` with a manipulated URL but no real payment → page must not display "Payment Confirmed."

Mark each `[VERIFIED]` in this document as it passes — don't wait until the whole suite is green to update any of them.

### Launch gate — the actual definition of "production ready"
Do not describe this platform as production-ready (and remove that claim from `README.md`/`HANDOVER.md` until it's true) until one real test transaction passes this entire chain with **zero client-controlled commercial values** anywhere in it:

```
Wizard → accurate server-computed quote → immutable snapshot →
server-created Razorpay order → signature+amount+order verified webhook →
inventory reserved → invoice generated → job created →
installer job card → completion
```

---

## 11. Phase 6 — Growth & conversion backlog (do not start until Phases 0–5 are verified complete)

These are real, worthwhile ideas surfaced across the reviews — intentionally sequenced last because none of them matter if the checkout underneath them can be defrauded.

- [ ] **SEO expansion**: `app/sitemap.ts` hardcodes only 4 cities (Jaipur, Jodhpur, Kota, Ajmer) and `data/pincodes.json` has only 15 entries, despite the homepage claiming "Serving all of India" and the `/[city]` route architecture supporting geo-aware pages at scale. Generate the sitemap programmatically from an expanded pincode/city list, with genuinely unique per-city content (not thin duplicates) and LocalBusiness/Product structured data.
- [ ] **Social proof**: no testimonial, review, case-study, or gallery component exists anywhere in `components/`. Add a verified-reviews widget, real before/after install photos per city, and named case studies — this is the single highest-leverage conversion change available and is currently entirely missing.
- [ ] **Branding consistency**: header/footer/legal pages inconsistently show "TEAM CCTV" / "TEAM SECURE SYSTEMS" vs. the current "CCTVQuotation by TEAM." Duplicate Twitter card meta tags exist across city pages. Do one pass to unify.
- [ ] **Interactive blueprint/site visualizer**: let customers tap vantage points (entry, parking, cash counter, perimeter) on a property-type preset to auto-derive camera count and dome/bullet classification, instead of asking them to guess "how many cameras do I need."
- [ ] **WhatsApp direct-to-quote**: on quote generation, push an interactive WhatsApp template (View PDF / Confirm Free Site Visit / Chat with Specialist) using the existing `lib/whatsapp` service; write "Book Site Visit" actions to a `site_visit_bookings` collection routed to the local installer/franchise.
- [ ] **B2B white-label quoting for installers/dealers**: let `/partner` users generate their own branded PDF quotes (their shop name/logo) against your wholesale pricing and fulfillment — you capture the hardware margin, they capture install labor.
- [ ] **Digital Hardware Passport**: QR code generated per completed install (tied to `serial_assets`), stuck on the customer's NVR, linking to a `/track/[id]` portal showing install date, warranty countdown, 1-click service ticket, 1-click AMC renewal.

---

## 12. Working rules for every future session (yours or anyone else's)

1. Read this document (or its living successor) in full before writing code.
2. Before marking anything done, verify it against the 7-layer checklist in Phase 5, not just "it renders."
3. If you find a second implementation of something this doc says should be singular, that's a bug — fix it in the current phase, don't add a third.
4. Update the checkboxes in this file (or a `STATUS.md` next to it) as you complete tasks, so the next session doesn't redo or contradict your work.
5. Anything not in Phase 6 is not a growth idea until Phases 0–5 are done — no exceptions, no matter how good the idea is.
