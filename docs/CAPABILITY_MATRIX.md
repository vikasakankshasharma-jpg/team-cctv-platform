# TEAM CCTV — Capability Verification Matrix

> **Allowed Status Values:** `DESIGNED` | `IMPLEMENTED` | `VERIFIED` | `PRODUCTION PROVEN` | `BLOCKED` | `UNKNOWN`  
> **Definition of Done:** Data Model + UI + API + Business Logic + Security/RBAC + Failure Handling + Passing E2E Test.

| Capability | Data Model | UI | API | Business Logic | Security/RBAC | Failure Handling | E2E Test | Evidence | Status | Owner / Next Action |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| **Server-Authoritative Pricing** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `lib/pricing-engine.ts`, `/api/quote/save` | `PRODUCTION PROVEN` | Zero-trust client pricing enforced |
| **Smart Pay Tax Invoice Parity** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `invoice-pdf.tsx`, LeadStatusBadge, CustomerDashboard | `PRODUCTION PROVEN` | 100% upfront 2% discount generates Tax Invoice with PAID watermark, 0 balance due |
| **On-Screen Dynamic UPI QR** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `DynamicOnScreenQRCodeModal.tsx`, `/api/payment/razorpay-qr` | `PRODUCTION PROVEN` | Screen-to-screen QR on tech mobile for 90% delivery, 10% install, change orders |
| **Admin-Gated Cash Collection** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `/api/installer/cash-approval/request`, `approve-cash` | `PRODUCTION PROVEN` | Physical cash disabled by default; unlocked only via explicit Admin approval |
| **On-Site Change Orders (GST S15/S34)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `InstallerChangeOrderModal.tsx`, `/api/invoice/change-order` | `PRODUCTION PROVEN` | Supplementary Invoice (`INV-...-S1`) & Change Order (`CO-...`) preserves base invoice |
| **Razorpay Payment Intent** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `api/payment/razorpay-order/route.ts` | `PRODUCTION PROVEN` | Server-side quote lookup & amount binding |
| **Razorpay Webhook Verification** | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | `api/webhooks/razorpay/route.ts` | `PRODUCTION PROVEN` | HMAC SHA-256 signature verification + fallback API |
| **Immutable Quote Snapshot** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `_v2`, `_v3` versioning on survey/deal adjustments | `PRODUCTION PROVEN` | Preserves customer acceptance history |
| **Customer Funnel Unification** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `WizardClientV2`, `ProBuilderClient` | `PRODUCTION PROVEN` | Dual-funnel parity with 100% mathematical parity |
| **Inventory Reservation** | ✅ | N/A | 🟡 | 🟡 | ✅ | 🟡 | ❌ | Deductions occur on payment; no reservation lock | `DESIGNED` | Add `RESERVED` state on `payment.captured` |
| **State-Driven Invoicing** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `/api/invoice/[quoteId]/status`, `invoice-pdf.tsx` | `PRODUCTION PROVEN` | Real-time status polling every 2.5s replaces fixed sleep |
| **Installer Job Card & Tracking** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `/installer/jobs/[id]`, `JobSignoffModal` | `PRODUCTION PROVEN` | Serial scanning, photo proof upload, and customer PIN verification |
| **Material Delivery Handover** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `/delivery/[quoteId]`, `DeliveryClient.tsx` | `PRODUCTION PROVEN` | Smart Pay auto-bypass, 90% Dynamic QR, Admin cash gate, and OTP verification |
