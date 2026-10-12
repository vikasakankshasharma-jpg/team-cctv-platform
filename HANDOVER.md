# TEAM CCTV Platform - Master Operational Handover Guide

> **Author:** Antigravity Engineering Pair  
> **Date:** October 12, 2026  
> **Target Environment:** Production (`https://cctvquotation.com`)  
> **Repository:** `team-cctv-platform` (`master` branch)  

This document serves as the master engineering and operational handover for the TEAM CCTV Platform, detailing system architecture, business rules, pricing mechanics, deployment workflows, and troubleshooting runbooks.

---

## 1. System Architecture & Tech Stack

### Frontend & Application Layer
- **Framework:** Next.js 16.2 (React 19, App Router, Server Components & Route Handlers)
- **Styling:** Tailwind CSS 4.0, Lucide Icons, responsive layouts (iPhone SE to 4K displays)
- **State Management:** Zustand stores (`lib/ui-store.ts`, `lib/configurator-store.ts`) for real-time customer state.
- **Language:** TypeScript (`strict: true`) with zero compilation errors (`npx tsc --noEmit`).

### Backend & Cloud Infrastructure
- **Database & Object Storage:** Firebase Firestore & Firebase Storage with role-based security rules.
- **Authentication:** Firebase Phone Auth / WhatsApp OTP with strict portal isolation (`/portal`, `/staff`, `/installer`, `/admin`).
- **Payment Processing:** Razorpay & Cashfree (server-side payment links, webhooks, and client-side fallback verification API).
- **Mapping & Location Services:** Mappls (MapmyIndia) SDK for address geocoding, boundary polygons, and PINCODE micro-zones, with Google Maps & OpenStreetMap fallbacks.
- **PDF Generation:** React-PDF (`lib/pdf/quote-pdf.tsx`) matching web Bill of Materials hierarchy.

---

## 2. Core Functional Modules

### 2.1 Dual Quotation Funnels
1. **Guided Setup (`/wizard`):** 5-step intuitive wizard that recommends 3 pre-configured packages (Standard, Professional, Elite) with "Match My Brand" dynamic brand switching.
2. **Custom Build (`/builder` - Pro Builder):** Complete itemized hardware customizer with WhatsApp OTP lead capture at step 1, mobile slide-over cart drawer (`showMobileCart`), and single-filter auto-collapse.
3. **Parity Engine:** Both funnels calculate totals through `lib/pricing-engine.ts` and `app/api/quote/save/route.ts` ensuring 100% mathematical parity.

### 2.2 Pricing & Hardware Mechanics
- **Competitive SMPS Rule:** The engine selects the cheapest compatible power supply, even if it has higher channel capacity (e.g., 8Ch SMPS for 4 cameras), to ensure maximum price competitiveness. Fallback quantity uses `Math.ceil(camera_count / max_cameras)`.
- **Multi-PoE Gigabit Uplink:** Automatically includes an interconnecting Desktop Gigabit Switch when total IP cameras exceed single PoE switch capacity.
- **Cabling & Margin Slabs:** Evaluates whether required cable length is cheaper as full bundles (305m / 100m) + balance per meter, or purely per-meter rates. Cable pulling labor is free up to 15m/camera; cable material is billed. Admin short-run margin slabs protect low-volume runs.
- **Connectors & Junction Boxes:** Connectors (`camera_count * 2` + 2 RJ45 for IP uplink), Junction Boxes (`1:1`).

### 2.3 Installation & Site Survey Rules
- **Zero Margin on Labor:** Labor line items NEVER receive commercial margin markup.
- **Full Installation:** ₹500/IP camera, ₹400/HD camera with 15m free cable pulling per camera (excess cable ₹15/m).
- **Fitting-Only (No Cabling):** ₹200/HD, ₹300/IP + ₹500 visit charge (flat ₹500/camera for systems <= 2 cameras).
- **Site Prep Surcharges (Bitmask):** Ladder (₹500), marble (₹400), metal (₹200), furnished (₹300), heavy drilling (₹600).
- **Quotation Versioning:** Changes made by installers or salespeople after a site survey automatically spawn a new version (`v2`, `v3`).
- **Quotation Disclaimer:** Standard notice indicating final quotes may adjust based on actual site conditions.

### 2.4 Territory Mapping, Boundaries & 4-Quadrant Micro-Zones
- **Hierarchy:** State → District → Tehsil → PINCODE → 4 Quadrants.
- **3-Tier Boundary Engine:**
  - `Tier 1`: Verified Google Maps cadastral polygons (`KNOWN_PINCODE_POLYGONS` in `lib/geo/pincodePolygons.ts`) for core launch urban centers (Jaipur metro PINs 302001–302048, including exact contours for 302012 and 302041).
  - `Tier 2`: Pre-extracted public cadastral vector boundaries (`OFFICIAL_PINCODE_POLYGONS` in `lib/geo/officialBoundaries.ts`).
  - `Tier 3`: Dynamic 2D convex hull with 1.6 km delivery buffer covering all other PINs nationwide.
- **Centroid Engine (`getKnownCentroid`):** Camera viewport and pinpoint markers lock onto the true mathematical center of verified polygons, eliminating third-party postal coordinate corruption.
- **4 Quadrants:** Replaces postal names with landmark-anchored quadrants (North-West, North-East, South-East, South-West).
- **Visual Status:** Red circles = Unselected/Uncovered; Blue circles = Active coverage. Includes "Gen All Quadrants" batch tool in Admin.
- **Tri-Factor Boundary:** Matches leads against assigned Quadrant, operating radius (e.g. 15km), and polygon boundaries.

### 2.5 Two-Tier Referral & Affiliate System
- **B2B Business Partners:** Admin-invited trade professionals receive branded QR codes. Earn 2% commission; customers receive 3% discount.
- **B2C Individual Partners ("Refer & Earn"):** Public mobile OTP signup. Generates instant referral codes and downloadable festive EDMs for WhatsApp status sharing. Earn ₹500 payout; referred customer receives ₹500 discount.
- **Financial Dashboard:** Admin payout management tracking maturity and overdue days post-installation completion.

### 2.6 Checkout Pathways & Fallback Verification
- **Pay Full Upfront:** 2% instant discount on total quote.
- **3-Step Milestone Booking:** ₹500 advance booking token.
- **EMI Financing:** Featured zero/low-cost EMI financing plans.
- **Free Site Visit Booking:** Date & time slot picker (strictly future dates).
- **Fallback Verification API:** Attached to payment success screen to ensure quotes immediately transition to `PAID` / `BOOKED` even if webhooks fail.

---

## 3. Operational & Deployment Guide

### Environment Variables (Vercel)
The following keys must be set in Vercel Project Settings:
- `NEXT_PUBLIC_FIREBASE_*`: Firebase Client Configuration
- `FIREBASE_ADMIN_*`: Firebase Service Account Credentials
- `NEXT_PUBLIC_MAPPLS_API_KEY`: Mappls Web SDK Key
- `MAPPLS_CLIENT_ID` & `MAPPLS_CLIENT_SECRET`: Mappls REST API Credentials
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Razorpay Credentials
- `RAZORPAY_WEBHOOK_SECRET`: Webhook Signature Verification Secret
- `NEXT_PUBLIC_APP_URL`: Canonical Application URL (`https://cctvquotation.com`)

### Standard Verification Commands
```bash
# Type Safety Verification (must exit 0)
npx tsc --noEmit

# Production Build Verification (must exit 0)
npm run build

# Playwright Test Suite
npx playwright test

# Database Verification Script
npx tsx scratch/verify_db.ts
```

### Reference Documentation
- [`BUSINESS_RULES.md`](./BUSINESS_RULES.md): Master business, pricing, and labor rules.
- [`STATUS.md`](./STATUS.md): Current sprint log and test verification matrix.
- [`docs/CANONICAL_FLOW.md`](./docs/CANONICAL_FLOW.md): End-to-end system wiring map.
- [`docs/ROLE_JOURNEYS.md`](./docs/ROLE_JOURNEYS.md): Persona journeys (Customer, Salesperson, Installer, Partner, Admin).
- [`docs/devops/disaster-recovery.md`](./docs/devops/disaster-recovery.md): Firestore backup and recovery protocol.
- [`docs/devops/incident-response.md`](./docs/devops/incident-response.md): Production incident response procedures.
