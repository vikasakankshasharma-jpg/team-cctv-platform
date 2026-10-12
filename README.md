# TEAM CCTV – Enterprise Smart Quotation & Referral Platform

[![Quality Gates](https://github.com/team/cctv-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/team/cctv-platform/actions/workflows/ci.yml)
[![Production Ready](https://img.shields.io/badge/Status-100%25_Production_Ready-success.svg)](#)

> **Live Production Platform:** [`https://cctvquotation.com`](https://cctvquotation.com)  
> **Documentation Hub:** [`BUSINESS_RULES.md`](./BUSINESS_RULES.md) | [`STATUS.md`](./STATUS.md) | [`HANDOVER.md`](./HANDOVER.md) | [`docs/CANONICAL_FLOW.md`](./docs/CANONICAL_FLOW.md)

**TEAM CCTV** is a high-performance, full-stack enterprise SaaS platform for CCTV quotation generation, geolocation-driven territory routing, franchise/installer job management, and automated two-tier affiliate/referral distribution.

---

## 🚀 Core Platform Capabilities

### 1. Dual Quotation Engines with 100% Parity
- **Guided Setup (Customer Wizard):** 5-step intuitive flow with dynamic recommendation algorithms (Standard, Professional, Elite) and real-time "Match My Brand" dynamic brand unification.
- **Custom Build (Pro Builder):** Full itemized component customizer with early WhatsApp OTP lead capture, responsive mobile slide-out cart drawer, and single-filter auto-collapse.
- **Server-Authoritative Parity:** Both engines share 100% mathematical parity via `lib/pricing-engine.ts` and `app/api/quote/save/route.ts`. The client is untrusted.

### 2. Intelligent Pricing & Hardware Architecture
- **Competitive "Best Price" Hardware Selection:** Selects compatible higher-channel power supplies (e.g., 8Ch SMPS for 4 cameras) when cheaper than lower-capacity units.
- **Multi-PoE & Gigabit Aggregation:** Automatically allocates interconnecting Desktop Gigabit Switches for large IP camera topologies.
- **Cable Bundling & Margin Slabs:** Evaluates 305m/100m bundles vs. per-meter pricing, with admin-configured short-run margin slabs.
- **Formulas:** Connectors (`camera_count * 2` + 2 for IP uplink), Junction Boxes (`1:1`).

### 3. Transparent Labor & Site Survey Rules
- **Zero Margin on Labor:** Labor costs strictly reflect local market rates with 0% margin markup.
- **Full Installation:** ₹500/IP camera, ₹400/HD camera with 15m free cable pulling per camera (excess cable ₹15/m).
- **Fitting-Only (No Cabling):** ₹200/HD, ₹300/IP + ₹500 site visit charge (flat ₹500/camera for setups <= 2 cameras).
- **Site Preparation Flags:** Bitmask support for ladder (₹500), marble (₹400), metal (₹200), furnished (₹300), and heavy drilling (₹600).
- **Quotation Versioning:** Post-survey changes by installers/salespeople automatically create a new quotation version (`v2`, `v3`).
- **Site Disclaimer:** Prominent notice on all quotes that physical site conditions may adjust final totals.

### 4. Mappls Geolocation & 4-Quadrant Territory Routing
- **MapmyIndia (Mappls) Integration:** High-accuracy Indian address geocoding, boundary polygons, and fallback to Google Maps/OSM.
- **4-Quadrant Area Partitioning:** PINCODEs are divided into 4 landmark-anchored quadrants (North-West, North-East, South-East, South-West) for granular sales and technician dispatch.
- **Visual Territory Map:** Red circles indicate uncovered/unselected zones; blue circles indicate active coverage. Includes "Gen All Quadrants" batch tool.
- **Tri-Factor Matching:** Matches lead addresses against Quadrant, circular radius, and polygon boundaries.

### 5. Two-Tier Referral & Affiliate Ecosystem
- **B2B Business Partners:** Admin-invited trade professionals (shopkeepers, contractors, architects) receive branded QR codes. Partners earn 2% commission; customers receive a 3% discount.
- **B2C Individual Partners ("Refer & Earn"):** Public self-signup with mobile OTP. Generates instant referral codes and downloadable occasion/festival EDMs (Diwali, Holi, New Year) for WhatsApp status sharing. ₹500 referrer reward; ₹500 referee discount.
- **Financial Dashboard:** Admin payout management with maturity/overdue tracking for installers, promoters, and referrers.

### 6. Four Checkout Pathways & Payment Resilience
- **Pay Full Upfront:** 2% instant discount on total quotation.
- **3-Step Milestone Booking:** ₹500 advance token reserves installation slot.
- **EMI Financing:** Featured zero/low-cost EMI financing plans.
- **Free Site Visit Booking:** Date & time picker (future dates only) for on-site consultation.
- **Fallback Verification API:** Server-side verification on payment success screen guarantees quote status transitions even if webhooks face network timeouts.

---

## 🛠 Tech Stack

- **Framework:** Next.js 16.2 (App Router, Server Components, Route Handlers)
- **State Management:** Zustand (Client Store) & React Hooks
- **Database & Storage:** Firebase Firestore (Enterprise Security Rules) & Firebase Storage
- **Authentication:** Firebase Auth (Phone OTP / WhatsApp OTP) with strict portal separation
- **Payments:** Razorpay & Cashfree (Webhooks + Server-Side Fallback Verification)
- **Maps & Geocoding:** Mappls (MapmyIndia) SDK with Google Maps & OpenStreetMap fallbacks
- **Styling:** Tailwind CSS 4.0 (Fully responsive from narrow mobile to 4K displays)
- **PDF Generation:** React-PDF (`lib/pdf/quote-pdf.tsx`) matching web hierarchy

---

## 🔒 Security & Access Control

- **Portal Isolation:** Strict boundary between Customer Portal (`/portal`), Staff CRM (`/staff`), Installer App (`/installer`), and Admin Console (`/admin`). Staff logging into the customer portal receive only customer privileges.
- **Zero-Trust Pricing:** Client prices are strictly ignored; server-side recalculation protects against parameter tampering.
- **Network Security:** HSTS, strict Content Security Policy (whitelisting Mappls, Razorpay, Firebase), and session token validation.
- **Audit Logging:** Administrative events logged in Firestore `audit_logs` with actor details, timestamps, and diffs.

---

## 📦 Operational Commands

### Development & Build
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# TypeScript type check
npx tsc --noEmit

# Production build
npm run build
```

### Database & Catalog Management
```bash
# Verify catalog integrity
npx tsx scratch/verify_db.ts

# Generate markdown catalog
npx tsx scratch/gen_markdown_catalog.ts
```

### Testing & QA
```bash
# Run Playwright end-to-end tests
npx playwright test

# Verify quotation engine parity
npx tsx scratch/verify_quotation_flow.ts
```

---
© 2026 TEAM CCTV Platform. All Rights Reserved.
