# TEAM CCTV – Enterprise Smart Quotation & Referral Platform

[![Quality Gates](https://github.com/team/cctv-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/team/cctv-platform/actions/workflows/ci.yml)
[![Production Ready](https://img.shields.io/badge/Status-100%25_Production_Ready-success.svg)](#)

> **Live Production Platform:** [`https://cctvquotation.com`](https://cctvquotation.com)  
> **Documentation Hub:** [`BUSINESS_RULES.md`](./BUSINESS_RULES.md) | [`STATUS.md`](./STATUS.md) | [`HANDOVER.md`](./HANDOVER.md) | [`docs/CANONICAL_FLOW.md`](./docs/CANONICAL_FLOW.md)

**TEAM CCTV** is a high-performance, full-stack enterprise SaaS platform for CCTV quotation generation, geolocation-driven territory routing, franchise/installer job management, and automated two-tier affiliate/referral distribution.

---

## 🚀 Core Platform Capabilities

### 1. Dual Quotation Engines with 100% Parity
- **Guided Setup (Customer Wizard):** Intuitive multi-brand quotation engine that dynamically generates and displays all valid package variations across brands, resolutions, and storage options based on the customer's wizard answers.
- **Custom Build (Pro Builder):** Full itemized component customizer with early WhatsApp OTP lead capture, responsive mobile slide-out cart drawer, and single-filter auto-collapse.
- **Server-Authoritative Parity:** Both engines share 100% mathematical parity via `lib/pricing-engine.ts` and `app/api/quote/save/route.ts`. The client is untrusted.

### 2. Intelligent Pricing & Hardware Architecture
- **Recorder (DVR/NVR) Resolution Compatibility & Best-Price Optimization:** Sizes recorders dynamically to ensure $\text{recMaxMP} \ge \max(\text{Camera MP})$. If a higher-spec recorder (e.g., 5MP DVR) is cheaper than a lower-spec recorder (e.g., 2MP DVR), the engine selects the cheaper higher-spec recorder to deliver maximum customer savings. Lower-spec (2MP) recorders are strictly disqualified for 4MP, 5MP, and 8MP cameras. Mixed setups size to the highest resolution camera.
- **Competitive "Best Price" Hardware Selection:** Selects compatible higher-channel power supplies (e.g., 8Ch SMPS for 4 cameras) when cheaper than lower-capacity units.
- **Multi-PoE & Gigabit Aggregation:** Automatically allocates interconnecting Desktop Gigabit Switches for large IP camera topologies.
- **Cable Bundling & Margin Slabs:** Evaluates 305m/100m bundles vs. per-meter pricing, with admin-configured short-run margin slabs.
- **Formulas:** Connectors (`camera_count * 2` + 2 for IP uplink), Junction Boxes (`1:1`).
- **Comprehensive Add-ons & Full HDMI Cable Range:** Full market range of HDMI cables (1.5M, 3M, 5M, 10M, 15M, 20M) with smart mutual exclusivity in configurator selection. 100% real-time price synchronization across UI cards, BOM line items, and live Admin database (`DISP-19-INCH` @ ₹2,415, `ACC-4G-ROUTER` @ ₹1,885, Racks @ ₹490/₹630).
- **Wireless CCTV Multi-Camera Storage & Safety Caps:** Dynamic MicroSD memory card sizing per Wi-Fi camera (H.265 baseline, 0.40 smart motion vs 1.0 continuous) capped by camera hardware support (`max_sd_capacity_gb || 128`).
- **Mandatory Wi-Fi Check & 4G/5G Router Flow (Option B):** Wi-Fi check for wireless journeys with automated 4G/5G Router injection (`ACC-4G-ROUTER`) if customer lacks on-site broadband.
- **Bundled Solar Invariant:** All-in-one solar CCTV cameras include the solar panel in the box with ₹0 separate accessory charges.

### 3. Transparent Labor & Site Survey Rules
- **Zero Margin on Labor:** Labor costs strictly reflect local market rates with 0% margin markup.
- **Full Installation:** ₹500/IP camera, ₹400/HD camera with 15m free cable pulling per camera (excess cable ₹15/m).
- **Fitting-Only (No Cabling):** ₹200/HD, ₹300/IP + ₹500 site visit charge (flat ₹500/camera for setups <= 2 cameras).
- **Wireless Pro Fitting:** ₹349/camera for Wi-Fi/4G cameras with full wall mounting and smartphone app pairing, or ₹0 for DIY delivery.
- **Site Preparation Flags:** Bitmask support for ladder (₹500), marble (₹400), metal (₹200), furnished (₹300), and heavy drilling (₹600).
- **Quotation Versioning:** Post-survey changes by installers/salespeople automatically create a new quotation version (`v2`, `v3`).
- **Site Disclaimer:** Prominent notice on all quotes that physical site conditions may adjust final totals.

### 4. Mappls Geolocation & High-Fidelity Postal Territory Engine
- **MapmyIndia (Mappls) Integration:** High-accuracy Indian address geocoding, boundary polygons, and fallback to Google Maps/OSM.
- **3-Tier Boundary Resolution:** Curated 100% Google Maps cadastral boundaries for active launch PINs (`KNOWN_PINCODE_POLYGONS`), pre-extracted public multi-polygons (`OFFICIAL_PINCODE_POLYGONS`), and dynamic 2D convex hull with 1.6 km delivery buffer for pan-India coverage.
- **Centroid Engine:** Mathematical polygon centroid alignment (`getKnownCentroid`) overrides postal API coordinate corruption, locking map camera and pins directly over true commercial hubs (e.g., Jhotwara Circle, Dhankya-Bindayaka).
- **Sub-Post Office Delivery Micro-Hubs & Halos:** Authentic India Post Sub-Post Offices (`S.O.`) and Branch Offices (`B.O.`) mapped to local communicating names (e.g., Niwaru Road, Lata Circle, Khatipura, Bandra West, Koramangala). Replaces rigid cardinal compass assumptions with 1 to 8 dynamic delivery beats.
- **3-Tier Layered Territory Map:** City solid perimeter, filled green cadastral PINCODE boundaries, and delivery micro-hubs with 2-letter shortcode badges (`[✓ NR]`, `[✓ LC]`) and 850m translucent coverage halos.
- **Tri-Factor Matching:** Matches lead addresses against delivery hub local tokens, circular radius, and polygon boundaries.

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

### 7. Competitor Price Match Guarantee, Deal Desk & Self-Healing Baseline Engine
- **On-Card Contextual Anchoring:** All competitor quote uploads originate from specific package cards with explicit title & price anchors (`selected_package_title`, `selected_package_price`). Generic unanchored floating popups are permanently eliminated.
- **Self-Healing Baseline Quotation Engine (`lib/baseline-quote.ts`):** Automatically computes and persists an authoritative 8-item Bill of Materials for leads with wizard answers if no quote was previously selected. Zero ₹0 quotes and zero 404 PDF download errors across Admin CRM and customer portals.
- **Admin Deal Desk & Counter-Offer Automation:** `/admin/leads/[leadId]` provides side-by-side catalog vs. competitor economics, variance analysis, counter-strategy selection (Match, Beat by ₹500, Custom), and 1-click WhatsApp counter-pitch messaging highlighting 100% Solid Pure Copper Cable and Genuine Surveillance Storage.


### 8. Per-Bucket Camera Customization, Layman Feature Guide & Accessible UI
- **Per-Bucket Feature Independence:** Eliminates the constraint of uniform camera specifications. Customers can configure specific camera buckets with unique combinations (e.g. 2 outdoor cameras with Color Night Vision and Audio Mic, 1 entrance camera with 2-way talk and speaker, and 1 wireless camera with 4G SIM cellular).
- **Dynamic Inventory-Driven Feature Tags:** Feature chips on camera cards and in modal checklists dynamically query active catalog inventory (`products`). Tags are only displayed if matching products exist in stock for that specific technology and brand (e.g., `360° PTZ` is automatically hidden on HD/IP setups without PTZ cameras, and `2-Way Talk` is hidden on IP setups without 2-way cameras).
- **Resolution vs Feature Boundary Enforcement:** Resolution is strictly governed by each camera's `RESOLUTION` dropdown (2MP, 3MP, 4MP, 5MP, 8MP). "5MP (3K) Ultra High Clarity" is excluded from feature tags, avoiding redundant prompts and keeping specifications clean.
- **Centered, Non-Intrusive Modal Architecture:** Replaced blocking auto-opening popups with centered dialogs accessible on-demand (`💡 Feature Guide` and `⚙️ Checklist`). Viewport-safe styling (`items-center justify-center max-h-[85vh] rounded-2xl sm:rounded-3xl`) guarantees headers, scrollable body text, and footer action buttons are 100% visible on all screen sizes.
- **Zero Feature Leakage in Pricing Engine:** `lib/pricing-engine.ts` prioritizes per-bucket `req.features` over global selections, guaranteeing that features chosen for one camera type do not inflate or alter other camera buckets.
- **Real-Time System Overview Breakdown:** High-visibility dynamic counter bar displaying total cameras alongside real-time counts for Weatherproof, Indoor, Color Night, Audio Mic, 2-Way Talk, 360° PTZ, 4G SIM, and Wi-Fi.
- **Immutable Standard Attributes:** Weatherproof IP67 is automatically included as standard for outdoor cameras (`🌧️ IP67 Weatherproof Standard`), and 4G SIM connectivity is permanently built-in for 4G units.
- **Educational Layman Guide Modal (`TagGuideModal.tsx`):** Explains technical terms in simple language with practical Indian daily real-life examples (e.g., cash counter verbal negotiations, gate package delivery instructions, identifying intruder shirt color at 2 AM) alongside a dedicated resolution comparison guide.
- **System Specifications Checklist Modal (`SpecificationChecklistModal.tsx`):** Interactive checklist modal to inspect and apply requirements in 1 click, strictly synchronized with available catalog capabilities.
- **WCAG 2.1 AA Compliant Color System:** Unified brand blue active states (`bg-blue-600`), frosted badges within active tabs, containerized specification chips, muted non-distracting delete actions, and high contrast ratios across both Light Mode and Dark Mode.

### 9. Dual-Collection Product & Addon Management & Row-Level Actions
- **Dual-Collection Cascade Delete & Update (`/api/admin/products`):** The Hardware Management dashboard seamlessly unifies the `products` and `addons` collections. All mutations (batch delete, updates, status toggles) operate across both collections in parallel, eliminating undeletable orphan records.
- **Row-Level Direct Delete UX (`ProductInventory.tsx`):** Every product row features a dedicated red Trash icon under the `ACTIONS` column with a confirmation dialog, enabling single-click deletion without requiring bulk header selection.
- **In-Modal Direct Delete:** The Edit Product modal footer includes an immediate "Delete Product" button for quick removal during specification inspection.
- **Distributor Inventory Integration (Mega Compu World Jaipur):** Ingestion tooling and verification scripts (`scripts/sync-all-megacompu-catalog.js`) map 66 verified SKUs across CP Plus, Hikvision, Prama, A+ Products (Budget), Secureye, Trueview, and matching DVRs with genuine dealer wholesale pricing and exact distributor Item IDs.

### 10. Multi-Tier Storage Architecture, Physical Law Inverse Scaling & Market Transparency Rules
- **Physical Law of Inverse Scaling ($Days \propto \frac{Capacity}{Cameras \times DailyGB}$):** Centralized DVR/NVR hard drives are shared across all wired cameras. As camera count increases on the same hard drive, backup duration strictly decreases proportionally (e.g., 500GB HDD yields ~7 Days for 4 cameras, but strictly ~3 Days for 8 cameras).
- **Technology-Aware Daily Bitrates:** Uses realistic surveillance industry continuous and daytime bitrates:
  - HD Analog (DVR): 17.5 GB/day (2MP), 26.0 GB/day (5MP), 45.0 GB/day (8MP).
  - IP Network (NVR): 14.0 GB/day (2MP H.265), 20.0 GB/day (5MP H.265), 35.0 GB/day (8MP H.265+).
  - Smart Wireless IP: 4.5 GB/day (2MP Smart Motion), 10.5 GB/day (2MP Continuous).
- **Dedicated Wireless Edge Storage:** Smart Wireless IP cameras use independent MicroSD memory cards per camera (`qty = camera_count`). Adding more wireless cameras does not reduce individual backup days (`~14 Days Backup per Camera · Dedicated MicroSD`).
- **Prominent Red Warning for Refurbished Storage:** Transparently unmasks competitor tactics of covertly bundling refurbished desktop HDDs with branded cameras. If an Economy Storage Match is configured, an unmissable Red Alert Box warns customers of the high 24×7 failure risk and reduced retention before purchase.
- **Green Trust Verification Badge:** Standard quotes pairing 100% genuine Seagate SkyHawk or WD Purple HDDs highlight their 3-Year Replacement Warranty and 24×7 surveillance endurance.

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

# Full Customer Lifecycle E2E Test (Price Match, Baseline Quote, Deal Desk, Counter-Pitch)
npx tsx scripts/test-full-customer-lifecycle-e2e.ts

# Verify quotation engine parity
npx tsx scratch/verify_quotation_flow.ts

# Test HDMI Add-ons Suite (all 12 active catalog SKUs)
npx tsx scripts/test-hdmi-addons.ts

# Test Multi-Camera Matrix (432 configurations, 1-32 cameras)
npx tsx scripts/test-all-counts-matrix.ts

# Test 238 Permutations Matrix
npx tsx scripts/execute-all-238-tests.ts
```

---
© 2026 TEAM CCTV Platform. All Rights Reserved.
