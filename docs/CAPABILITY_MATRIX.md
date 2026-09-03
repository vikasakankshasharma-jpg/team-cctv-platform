# TEAM CCTV — Capability Verification Matrix

> **Allowed Status Values:** `DESIGNED` | `IMPLEMENTED` | `VERIFIED` | `PRODUCTION PROVEN` | `BLOCKED` | `UNKNOWN`  
> **Definition of Done:** Data Model + UI + API + Business Logic + Security/RBAC + Failure Handling + Passing E2E Test.

| Capability | Data Model | UI | API | Business Logic | Security/RBAC | Failure Handling | E2E Test | Evidence | Status | Owner / Next Action |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| **Server-Authoritative Pricing** | ✅ | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | ❌ | `pricing-engine.ts` vs `v2` split | `IMPLEMENTED` | Consolidate to v1; reject client prices in `/api/quote/save` |
| **Razorpay Payment Intent** | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ❌ | `api/payment/razorpay/route.ts` | `IMPLEMENTED` | Port Claude patch (look up quote server-side) |
| **Razorpay Webhook Verification** | ✅ | N/A | 🟡 | 🟡 | 🟡 | 🟡 | ❌ | `api/webhooks/razorpay/route.ts` | `IMPLEMENTED` | Fail closed on missing secret; verify order/amount binding |
| **Cashfree Retirement** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | N/A | `lib/cashfree.ts` (stub signature) | `BLOCKED` | Delete Cashfree files & package deps |
| **Immutable Quote Snapshot** | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ❌ | Revisions currently overwrite in `quote/save` | `IMPLEMENTED` | Implement versioned new documents (`_v2`) |
| **Customer Funnel Unification** | ✅ | 🟡 | ✅ | 🟡 | ✅ | 🟡 | ❌ | `WizardClientV2` bypasses `/quote/[leadId]` | `IMPLEMENTED` | Push wizard completion to `/quote/[leadId]` |
| **Inventory Reservation** | ✅ | N/A | 🟡 | 🟡 | ✅ | 🟡 | ❌ | Deductions occur on payment; no reservation lock | `DESIGNED` | Add `RESERVED` state on `payment.captured` |
| **State-Driven Invoicing** | ✅ | 🟡 | 🟡 | 🟡 | ✅ | 🟡 | ❌ | `PaymentSuccessClient` uses fixed 3s delay | `DESIGNED` | Transition to explicit status polling |
| **Automated Crons** | ✅ | N/A | 🟡 | 🟡 | ✅ | 🟡 | ❌ | Cron routes exist; not wired in `vercel.json` | `DESIGNED` | Wire cron expressions in `vercel.json` |
| **Installer Job Card** | 🟡 | 🟡 | 🟡 | 🟡 | ✅ | 🟡 | ❌ | Only customer quotation PDF exists | `DESIGNED` | Create operational job card PDF component |
