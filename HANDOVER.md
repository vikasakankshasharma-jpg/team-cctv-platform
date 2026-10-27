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
1. **Guided Setup (`/wizard`):** Dynamic multi-brand quotation engine that calculates and presents all valid package variations across brands (CP Plus, Hikvision, Dahua, Budget, etc.), resolutions, and storage options matching customer wizard inputs. Zero artificial tier restrictions.
2. **Custom Build (`/builder` - Pro Builder):** Complete itemized hardware customizer with WhatsApp OTP lead capture at step 1, mobile slide-over cart drawer (`showMobileCart`), and single-filter auto-collapse.
3. **Parity Engine:** Both funnels calculate totals through `lib/pricing-engine.ts` and `app/api/quote/save/route.ts` ensuring 100% mathematical parity.

### 2.2 Pricing & Hardware Mechanics
- **Recorder (DVR/NVR) Resolution Compatibility & Cost Optimization:** Recorders are dynamically sized to ensure maximum supported camera resolution meets or exceeds the highest camera in the configuration: $\text{recMaxMP} \ge \max(\text{Camera MP})$. If a 5MP recorder is priced lower than a 2MP recorder in the catalog, the engine chooses the cheaper 5MP unit for 2MP cameras. For 4MP/5MP/8MP cameras, 2MP recorders are strictly disqualified. Mixed camera installations automatically size to the highest resolution camera.
- **Competitive SMPS Rule:** The engine selects the cheapest compatible power supply, even if it has higher channel capacity (e.g., 8Ch SMPS for 4 cameras), to ensure maximum price competitiveness. Fallback quantity uses `Math.ceil(camera_count / max_cameras)`.
- **Multi-PoE Gigabit Uplink:** Automatically includes an interconnecting Desktop Gigabit Switch when total IP cameras exceed single PoE switch capacity.
- **Connectors & Junction Boxes:** Connectors (`camera_count * 2` + 2 RJ45 for IP uplink), Junction Boxes (`1:1`).
- **Add-ons, Accessories & Full HDMI Range:** Full range of standard HDMI cables (1.5M, 3M, 5M, 10M, 15M, 20M) with smart mutual exclusivity (switching length auto-deselects previously selected length). Dynamically renders genuine active catalog accessories under "Add-ons & Accessories For Your System" (`DISP-19-INCH` @ ₹2,415, `ACC-4G-ROUTER` @ ₹1,885, Racks @ ₹490/₹630, AMC) with 100% price synchronization across UI cards, BOM line items, and server pricing engine.
- **Wireless CCTV Multi-Camera Storage & Safety Caps:** Wi-Fi cameras size dedicated MicroSD cards (1 card per camera). Sized via H.265 bitrate (smart motion 0.40 vs continuous 1.0) and capped by camera hardware support (`max_sd_capacity_gb || 128`).
- **Mandatory Wi-Fi Check & 4G/5G Router Flow (Option B):** Prompting customers on Wi-Fi availability; automatically adds 4G/5G Wi-Fi Router (`ACC-4G-ROUTER`) if Wi-Fi is absent.
- **Bundled Solar Invariant:** Solar CCTV cameras include the solar panel in the box; separate solar panel add-on charges are strictly prohibited.

### 2.3 Installation & Site Survey Rules
- **Zero Margin on Labor:** Labor line items NEVER receive commercial margin markup.
- **Full Installation:** ₹500/IP camera, ₹400/HD camera with 15m free cable pulling per camera (excess cable ₹15/m).
- **Fitting-Only (No Cabling):** ₹200/HD, ₹300/IP + ₹500 visit charge (flat ₹500/camera for systems <= 2 cameras).
- **Wireless Pro Fitting:** ₹349/camera for Wi-Fi/4G cameras with full wall mounting and smartphone app pairing, or ₹0 for DIY delivery.
- **Site Prep Surcharges (Bitmask):** Ladder (₹500), marble (₹400), metal (₹200), furnished (₹300), heavy drilling (₹600).
- **Quotation Versioning:** Changes made by installers or salespeople after a site survey automatically spawn a new version (`v2`, `v3`).
- **Quotation Disclaimer:** Standard notice indicating final quotes may adjust based on actual site conditions.

### 2.4 Territory Mapping, Boundaries & Delivery Micro-Hubs
- **Hierarchy:** State → District → Tehsil → PINCODE → Sub-Post Office Delivery Micro-Hubs.
- **3-Tier Layered Geography Standard:**
  - `Tier 1`: City & Zone Solid Polygons (Mappls GeoAnalytics SDK / municipal boundary).
  - `Tier 2`: Cadastral PINCODE Boundary Polygons (`KNOWN_PINCODE_POLYGONS` in `lib/geo/pincodePolygons.ts` for core launch urban centers, `OFFICIAL_PINCODE_POLYGONS`, and dynamic 2D convex hull with 1.6 km delivery buffer covering all other PINs nationwide).
  - `Tier 3`: Sub-Post Office Delivery Hubs & Halos (Official `S.O.` / `B.O.` postal delivery beats mapped to authentic local communicating names e.g. `Niwaru Road`, `Lata Circle`, `Khatipura Tiraha`).
- **Centroid Engine (`getKnownCentroid`):** Camera viewport and pinpoint markers lock onto the true mathematical center of verified polygons, eliminating third-party postal coordinate corruption.
- **Visual Status:** Dynamic 2-letter shortcode badges (`[✓ NR]`, `[✓ LC]`) with 850m translucent coverage halos (`#22c55e` covered, `#ef4444` dashed uncovered). Solid green polygons render active PINCODE coverage.
- **Tri-Factor Boundary:** Matches leads against assigned Delivery Hub (tokenized string matching against customer street/colony addresses), operating radius (e.g. 15km), and polygon boundaries.

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

# HDMI Add-ons Verification Suite (12 active catalog SKUs)
npx tsx scripts/test-hdmi-addons.ts

# Multi-Camera Count Matrix (1-32 cameras across HD, IP, Wireless - 432 permutations)
npx tsx scripts/test-all-counts-matrix.ts

# 238-Test Matrix Runner
npx tsx scripts/execute-all-238-tests.ts

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
