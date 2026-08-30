# GO-LIVE CONTROL MATRIX — PRODUCTION READINESS GATES

**Project:** TEAM CCTV / Quotation Platform
**Purpose:** Production Go-Live control, evidence, and human authorization.

## Evidence Levels
* 🟢 **PASS (Local E2E):** Verified via Local Emulator & Playwright E2E.
* 🟡 **PASS (Production-like/staging):** Verified against remote staging resources.
* 🔴 **NOT VERIFIED (Real production):** Requires real production dependencies (e.g. Payment Gateway Webhook, Firebase Auth, WhatsApp API).

---

## The 8 Production Readiness Gates

| Gate | Domain | Core Verification Requirement | Local E2E Status | Staging Status | Production Status |
| :-- | :--- | :--- | :---: | :---: | :---: |
| Gate 1: Commercial / Quote | Quote Snapshot immutability, deterministic margin/GST calculations, `ON_DEMAND` warnings, block `OUT_OF_STOCK`. | 🟢 PASS | 🟢 PASS | 🔴 NOT VERIFIED |
| Gate 2: Finance / Payments | Duplicate invoice prevention, payment webhook idempotency, strict downstream triggering. | 🟢 PASS | 🟢 PASS | 🔴 NOT VERIFIED |
| Gate 3: Inventory / Ledger | Atomic deduction, `BACKORDERED` handling, and refund reversals. | 🟢 PASS | 🟢 PASS | 🔴 NOT VERIFIED |
| Gate 4: CRM SLA / Timeline | SLA priority mapping, duplicate task prevention, retry exhaustion (`needs_manual_followup`), action audits. | 🟢 PASS | 🟢 PASS | 🔴 NOT VERIFIED |
| Gate 5: Ops / Job Lifecycle | Installer job isolation, strict state transitions, survey persistence, Completion Checklist enforcement. | 🟢 PASS | 🟢 PASS | 🔴 NOT VERIFIED |
| Gate 6: Price Immutability | Strictly prove `Old Quote ≠ Recalculated Quote` when master pricing changes, enforce RBAC, audit trails. | 🟢 PASS | 🟢 PASS | 🔴 NOT VERIFIED |
| Gate 7: RBAC / Webhooks | Server-side RBAC Matrix (Customer 403s, Installer scoped access, Sales/Admin isolation). | 🟢 PASS | 🟢 PASS | 🔴 NOT VERIFIED |
| Gate 8: Audit / Data Integrity | Fail-closed, financially safe behavior during duplicate requests, stock-outs, stale quotes, concurrent updates. | 🟢 PASS | 🟢 PASS | 🔴 NOT VERIFIED |
| WhatsApp Notification Logic | Notification triggers and delivery receipts. | 🟢 PASS | 🟡 CONDITIONAL PASS (Vendor Paywall) | 🔴 NOT VERIFIED |

---

### Capstone Execution Results
The "Ultimate Test" (`tests/e2e-production-readiness.spec.ts`) was executed, establishing a complete chain of events:
`Wizard -> Quote -> Sales CRM -> Quote Approval -> Invoice -> Payment Webhook -> Inventory Ledger -> Dynamic Job Creation -> Operations Field App -> State Transitions`.
It also rigorously verified the **Immutability Contract** (an old quote preserves its unit economics exactly after a Super Admin modifies the system Master Pricing).

**Local Technical Environment passed all 8 gates.**
Next stage is to migrate testing to a Staging environment with active production-like credentials for Razorpay, Firebase Auth, and WhatsApp Business.
