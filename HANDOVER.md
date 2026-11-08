# TEAM CCTV Platform - Master Operational Handover Guide

> **Author:** Antigravity Engineering Pair  
> **Date:** November 5, 2026  
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


### 2.7 Per-Bucket Camera Customization, Educational Modals & UI Palette
- **Per-Bucket Specification Allocation:** Each bucket card independently manages resolution, quantity, connection type (Wired, Wi-Fi, 4G), and feature tags (`24/7 Color`, `Audio Mic`, `2-Way Talk`, `360° PTZ`).
- **Real-Time System Overview:** Live breakdown bar dynamically aggregates hardware composition: Total cameras, Outdoor Weatherproof, Indoor, Color Night, Audio Mic, 2-Way Talk, 360° PTZ, 4G SIM, and Wi-Fi.
- **Educational Layman Guide Modal (`TagGuideModal.tsx`):** Provides plain-language explanations, practical Indian daily real-life examples (e.g., cash counter verbal negotiations, gate package delivery instructions, identifying intruder shirt color at 2 AM), and recommended installation locations for every feature tag.
- **System Specifications Checklist Modal (`SpecificationChecklistModal.tsx`):** Interactive checklist modal allowing customers to inspect and refine their security checklist with real-time feedback.
- **WCAG 2.1 AA Compliant Color Harmonization:** Unified brand blue active states (`bg-blue-600`), frosted badges within active tabs, containerized specification chips, muted non-distracting delete actions, and high contrast ratios across both Light Mode and Dark Mode.
- **Dynamic Inventory-Driven Feature Tags & Resolution Boundaries:** Feature chips dynamically query active catalog inventory (`products`). Tags lacking stocked hardware (e.g., PTZ on HD, 2-way audio on IP) are automatically hidden. Resolution is managed strictly via the `RESOLUTION` dropdown and excluded from feature tags.
- **Centered Non-Intrusive Modal Dialogs:** Modals do not auto-open on quote load. Dialogs are centered (`max-h-[85vh] items-center justify-center`) with scrollable bodies and fixed headers/footers to eliminate viewport clipping.

### 2.8 Dual-Collection Product & Addon Management
- **Unified Deletion & Update API (`/api/admin/products`):** Operates across both `products` and `addons` collections simultaneously in batch, ensuring accessories like Wi-Fi extenders and routers can be deleted or updated without leaving orphan documents.
- **Row-Level Direct Delete UX (`ProductInventory.tsx`):** Every table row provides an individual Trash icon (`Trash2`) with a confirmation dialog for single-click deletion.
- **Edit Modal Direct Delete:** The Edit Product modal footer includes an immediate "Delete Product" button.
- **Distributor Inventory Integration:** Tools (`scripts/sync-all-megacompu-catalog.js`) map 66 verified SKUs across CP Plus, Hikvision, Prama, A+ Products, Secureye, Trueview, and matching DVRs with genuine dealer wholesale pricing and exact distributor Item IDs.

### 2.9 Multi-Tier Storage Architecture, Physical Law Inverse Scaling & Market Transparency Rules
- **Physical Law Inverse Scaling Parity ($Days \propto \frac{Capacity}{Cameras \times DailyGB}$):** Centralized DVR/NVR hard drives are shared across all active wired cameras. Sizing correctly yields strictly inverse retention: 4 cameras on 500GB HDD = **~7 Days Backup**, while 8 cameras on 500GB HDD = **~3 Days Backup** (strictly halved, eliminating the ~6 days artifact caused by compound codec discounting). 8 cameras on 1TB HDD yields **~7 Days Backup**.
- **Surveillance Industry Bitrate & Codec Standardization:**
  - HD Analog (DVR): 17.5 GB/day (2MP), 26.0 GB/day (5MP), 45.0 GB/day (8MP).
  - IP Network (NVR): 14.0 GB/day (2MP H.265), 20.0 GB/day (5MP H.265), 35.0 GB/day (8MP H.265+).
  - Smart Wireless IP: 4.5 GB/day (2MP Smart Motion), 10.5 GB/day (2MP Continuous).
- **Smart Wireless Edge Storage Scaling:** Wireless cameras are edge recording devices with dedicated MicroSD card slots. Configurator BOM adds exactly 1 card per camera (`qty = camera_count`). Adding more wireless cameras does not reduce individual retention; UI displays `~X Days Backup per Camera · Dedicated MicroSD`.
- **Quality Tier Separation & Catalog Integrity:**
  - Standard branded packages (CP Plus, Hikvision, Dahua, Trueview) strictly pair **100% Genuine 24×7 Surveillance HDDs (Seagate SkyHawk / WD Purple)** with **3-Year Replacement Warranty** and Green Verification Badges.
  - Economy Match / Budget quotes pair Budget Brand HDDs (`HDD-BUD-500GB`, `HDD-BUD-1TB`, etc.) with transparent pricing.
- **Storage Transparency & Clean Advisory Architecture:** Highlights competitor tactics of covertly bundling refurbished desktop HDDs with branded cameras. Replaced cluttered 10-line red alert boxes on cards with a global retention banner under the storage selector (with 1-click 1TB upgrade), a compact 1-line amber pill on cards (`⚠️ Basic 500GB HDD · ~X Days Backup · 1-Yr Local [Advisory ⓘ]`), and an educational `StorageAdvisoryModal.tsx`.

### 2.10 Multi-Variation Catalog Architecture & Compact Dropdown Filter Toolbar
- **Lowest-Priced Entry Point & Side-by-Side Variations:**
  - Standard IR variation: `sensor_preference: "standard_ir"` and `plan_type: "budget"` resolves to the absolute cheapest camera in that brand's pool (e.g. Hikvision `DS-2CE76D0T-ITPFS` @ ₹1,193), delivering true entry pricing (₹18,938 for 4 cameras + 1TB Seagate SkyHawk HDD).
  - ColorVu variation: `sensor_preference: "colorvu"` and `plan_type: "recommended"` resolves to ColorVu / full-color night vision cameras (e.g. Hikvision `DS-2CE70DF0T-PF` @ ₹2,286), delivering ₹24,097.
  - Key Difference Badges: Rendered directly beneath the camera resolution to explain price differences (`🌙 Standard IR Night Vision · Lowest Entry Price` vs `🌈 24/7 ColorVu Full Color · Daytime Clarity in Darkness`).
- **Compact Dropdown Filter Toolbar:**
  - 4 Dropdowns (Camera Brand, Recording Retention, Storage Drive Brand, Night Vision / Sensor) plus live match counter and instant `[Reset Filters ✕]` button.
  - Dedicated storage drive manufacturer selection supports Seagate SkyHawk, WD Purple, Toshiba S300, and Budget Brand with fallback resilience.

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

# Storage Physics Parity & Multi-Tier Verification Suite
npx tsx scripts/test-storage-physics-parity.ts

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
