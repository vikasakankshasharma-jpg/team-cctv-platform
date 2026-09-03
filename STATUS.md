# Hardening Sprint — Live Status Tracker

> Last updated: 2026-09-03 by Antigravity  
> Branch: `hardening-sprint`  
> Canonical plan: [`docs/HARDENING_SPRINT_PLAN.md`](file:///c:/Users/hp/Documents/TEAM%20Website/secure-easy/docs/HARDENING_SPRINT_PLAN.md)

---

## Section 2 — Pre-Merge Fixes

| # | Item | Status |
|---|------|--------|
| 2.1a | Delete 3 leaked credential files (`read-otp.mjs`, `lint_results.json`, `add-demo-addons.mjs`) | `[DONE-UNMERGED]` commit `4ac239d` |
| 2.1b | Fix webhook advance payment amount cross-check | `[DONE-UNMERGED]` commit `4ac239d` |
| 2.1c | Fix e2e test pricing assertion | `[DONE-UNMERGED]` commit `4ac239d` |
| 2.1d | Delete dead `handlePayment`/WhatsApp/PDF code from `WizardClientV2.tsx` | `[DONE-UNMERGED]` pending commit |
| 2.1e | Explain unmentioned admin files in PR | `[DONE-UNMERGED]` see below |
| 2.2 | Run `npm run build`, `npx tsc --noEmit` | `[TODO]` — tsc running now |
| 2.3 | Merge to `master` | `[TODO]` |

### 2.1e — Explanation of unmentioned admin files

These files were **not written by this hardening session**. They were uncommitted modifications left in the working tree by a previous agent session and got swept up by `git add -A`. All are functionally coherent improvements to the admin panel's margin management, but they are **unrelated to the security hardening scope** of this PR.

| File | What it does |
|------|-------------|
| `components/admin/SettingsForm.tsx` (+220 lines) | Adds a "Hardware & Component Margins (%)" section to the admin settings form — per-category margin inputs (HDD, cameras, recorders, connectors, etc.) that feed the margin engine. Previously these were hardcoded. |
| `app/(admin)/admin/catalog-manager/page.tsx` (+11 lines) | Adds default values for the new `margin_*` fields so the settings page doesn't break on first load. |
| `app/(admin)/admin/catalog-manager/CatalogManagerClient.tsx` (+1 line) | Renames a tab label from "Labor & Wire Pricing" to "Labor, Wire & Margins" to match the new content. |
| `app/(admin)/admin/products/health/page.tsx` (+55 lines) | Improves the catalog health diagnostic page: adds checks for missing quotation-eligible products, unreadable storage capacities, missing recorder channels, and inconsistent brand naming. |
| `lib/margin-engine.ts` (+80 lines, -20 lines) | Replaces hardcoded per-category margin overrides with dynamic values loaded from admin settings. Adds `toDecimalMargin()` helper and new `margin_*` fields to `MarginPolicyConfig`. |
| `lib/product-resolver.ts` (+17 lines, -13 lines) | Improves storage/power device resolution: better capacity parsing (handles display_name fallback, regex instead of brittle string replace), tie-breaking by price when TB is equal. |

**Recommendation**: These are good changes that should be kept — they make margins admin-configurable instead of hardcoded, which directly supports the "server is the only source of commercial truth" principle. But they should be acknowledged in the PR description rather than slipping in silently.

---

## Phase 0 — Security Emergency

| Item | Status |
|------|--------|
| Revoke Firebase Admin key in GCP Console | `[TODO]` — manual, owner action |
| Regenerate & restrict Google Maps API key | `[TODO]` — manual, owner action |
| New keys in Vercel env vars only | `[TODO]` — manual, owner action |
| Scrub git history (BFG/filter-repo) | `[TODO]` — after merge + all 7 files removed |
| Check Firebase audit logs | `[TODO]` — manual |
| Add secret scanning CI check | `[TODO]` |
| Delete Cashfree code | `[DONE-UNMERGED]` |
| Remove Cashfree from package.json | `[DONE-UNMERGED]` |
| Repo root cleanup (438 items → clean) | `[TODO]` |

## Phase 0.5 — UX & IA Audit

| Item | Status |
|------|--------|
| 6 persona breakdowns | `[DONE]` `ROLE_JOURNEYS.md` |
| Screen inventory with KEEP/SIMPLIFY/MERGE/MOVE/REMOVE/BUILD tags | `[DONE]` `SCREEN_INVENTORY.md` |
| `docs/UX_ARCHITECTURE.md` | `[DONE]` |
| `docs/ROLE_JOURNEYS.md` | `[DONE]` |
| `docs/SCREEN_INVENTORY.md` | `[DONE]` |
| Canonical nav per role | `[DONE]` `UX_ARCHITECTURE.md` |
| CTA business rule (Pay vs Site Survey) | `[DONE]` `CANONICAL_FLOW.md` |
| Adopt `components/ui` as mandatory design system | `[DONE]` `UX_ARCHITECTURE.md` |
| Replace native alert/confirm/prompt calls | `[DONE]` Tracked in debt |

## Phase 0.75 — Canonical Wiring Map

| Item | Status |
|------|--------|
| Customer journey wiring map | `[DONE]` `CANONICAL_FLOW.md` |
| Staff journey wiring maps | `[DONE]` `CANONICAL_FLOW.md` |
| `docs/CANONICAL_FLOW.md` | `[DONE]` |
| `docs/API_SCREEN_MAP.md` | `[DONE]` |
| `docs/DATA_LIFECYCLE.md` | `[DONE]` |
| Flag orphan routes/screens | `[DONE]` `API_SCREEN_MAP.md` |

## Phase 1 — Commercial Core

| Item | Status |
|------|--------|
| Pricing engines consolidated | `[DONE]` |
| Server-authoritative quote save | `[DONE]` |
| Quote immutability + collision-safe IDs | `[DONE]` |
| Verify storage calc uses catalog `daily_gb_per_camera` | `[DONE]` |
| Verify all v2 callers migrated | `[DONE]` |
| Verify `quote/generate` is server-computed | `[DONE]` |
| Verify 7-day `validUntil` enforced at payment | `[DONE]` |

## Phase 2 — Funnel Unification

| Item | Status |
|------|--------|
| WizardClientV2 redirects to `/quote/[leadId]` | `[DONE-UNMERGED]` |
| Dead checkout code deleted from WizardClientV2 | `[DONE-UNMERGED]` pending commit |
| QuoteReviewClient rewired to Razorpay | `[DONE-UNMERGED]` |
| Verify LeadGate OTP + B2B routing | `[TODO]` |

## Phase 3–6

All `[TODO]` — blocked on Phase 0.5/0.75 docs.
