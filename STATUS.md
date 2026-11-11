# TEAM CCTV Platform - Master Project Status & Verification Log

> **Last Updated:** November 11, 2026  
> **Production URL:** `https://cctvquotation.com`  
> **Repository:** `team-cctv-platform` (`master` branch)  
> **Canonical Plan & Architecture:** [`docs/HARDENING_SPRINT_PLAN.md`](file:///c:/Users/hp/Documents/TEAM%20Website/secure-easy/docs/HARDENING_SPRINT_PLAN.md) | [`BUSINESS_RULES.md`](file:///c:/Users/hp/Documents/TEAM%20Website/secure-easy/BUSINESS_RULES.md)

---

## 1. Executive Summary & Production Readiness Scorecard

| Domain | Status | Latest Evidence / Milestone |
|---|---|---|
| **Commercial Core & Pricing Engine** | `VERIFIED` | 100% parity between Guided Setup & Pro Builder; 100% test pass rate across 238 permutation tests; Full Quotation Engine QA & Price Reconciliation Workbook; **Statutory GST-Paid Master Invariant (18% inclusive wholesale costs & retail prices with reverse-calculated taxable subtotal and GST breakdown; HSN/SAC code mapping across all line items)**; Multi-Variation Catalog generation (lowest entry price standard IR vs 24/7 ColorVu full-color); Recorder (DVR/NVR) resolution compatibility ($\text{recMaxMP} \ge \text{targetMaxMP}$) & best-price tie-break; SMPS best-price rule; Gigabit switch multi-PoE uplink; bundle/per-meter cable logic; ₹0 markup labor rules; 5 site prep flags; Multi-tier storage architecture & physical law inverse scaling ($Days \propto \frac{Capacity}{Cameras \times DailyGB}$) across HD, IP & Wireless; Storage Transparency & Clean Advisory Architecture (global retention banner, sleek amber card badge, and interactive `StorageAdvisoryModal.tsx`). |
| **Mapping & Geographical Coverage** | `VERIFIED` | 100% Google Maps parity via Mappls GeoAnalytics API + 34-vertex fallback `JAIPUR_METRO_BOUNDARY`; CartoDB Voyager CDN tile engine with sub-50ms latency; automated Leaflet modal resize engine (`ResizeObserver` + staggered `invalidateSize`); 1-click delivery halo toggle (`Halos: ON/OFF`); 1-click `⚡ Auto-Trace Territory` convex hull enclosure; 0 legacy compass labels in Firestore. |
| **Referral & Partner Ecosystem** | `VERIFIED` | B2B Partner Portal with QR codes (2% comm / 3% disc); B2C Refer & Earn (₹500 / ₹500) with festive WhatsApp status EDMs; Financial Dashboard payout tracking. |
| **Customer Journey & Pro Builder** | `VERIFIED` | Compact Dropdown Filter Toolbar (Camera Brand, Retention Days, Storage Drive Brand, Sensor Type) with live match counter & quick reset; Key Difference badging (`key_difference`) explaining price variance per card; WhatsApp OTP lead capture before custom build; Mobile slide-over cart drawer; single-filter auto-collapse; Dynamic inventory-driven feature tags; Resolution vs feature boundary enforcement; Centered non-intrusive modal dialogs; Per-bucket feature independence with zero feature leakage; Intrinsic bullet camera weatherproofing standard; Purpose-driven smart wireless variants with edge storage advisory. |
| **Checkout & Payment Pathways** | `VERIFIED` | 4 pathways: Pay Full (2% discount), ₹500 3-step token, EMI option, Free Site Visit calendar (future dates only); Webhook + Fallback Verification API. |
| **Catalog & Inventory Integrity** | `VERIFIED` | Active-only inventory enforcement; zero fake fallback products; Dual-collection (`products` + `addons`) cascade delete and update; Direct row-level trash button in `ProductInventory.tsx`; Edit Modal delete action; 0-orphan clean state; Mega Compu World distributor integration with 99 verified SKUs, wholesale dealer pricing, and statutory HSN/GST rate tags. |
| **Security & Credential Management** | `VERIFIED` | Hardcoded OTPs removed; exposed test scripts scrubbed; Vercel CLI env var management + CRLF sanitization (`lib/env-utils.ts`); unified MSG91 OTP provider; `extractErrorMessage` (`lib/utils.ts`) zero `[object Object]`; Firestore role-based collection rules; HSTS enforced. |
| **Localization & Language** | `VERIFIED` | Colloquial everyday terminology (replaced "अनुशंसित" with natural options, "कम"/"ज्यादा"); Language selector modal without underscores. |

---

## 2. October 2026 Sprint Milestones (Completed & Live)

### Milestone 1: Mappls (MapmyIndia) Coverage Foundation (Superseded by Milestone 12)
> *Historical Note: The initial v1 4-quadrant prototype described below was superseded in Milestone 12 by the Universal Sub-Post Office Delivery Micro-Hubs & 3-Tier Layered Geography Standard.*
- **Mappls Engine Integration:** Integrated Mappls SDK for hyper-localized Indian address resolution, district boundaries, and sub-post office coordinates with automatic fallback to Google Maps and OSM.
- **Historical Area Partitioning:** Initially prototyped with 4 quadrant zones (North-West, North-East, South-East, South-West) anchored by prominent local landmarks.
- **Interactive Coverage Visualization:**
  - Red circles: Unselected / Uncovered zones.
  - Blue circles: Selected / Covered zones.
  - "Gen All Quadrants" batch tool for instant generation across entire Tehsils.
- **Tri-Factor Matching Engine:** Validates coverage using Quadrant match, circular operating radius, and admin-drawn polygon boundaries.

### Milestone 2: Two-Tier Referral & Affiliate Ecosystem
- **B2B Business Partners:**
  - Admin-invited trade professionals (shopkeepers, contractors, architects).
  - Dynamic QR codes generated for physical store displays.
  - Commercial terms: 2% commission to partner; 3% instant discount to referred customer.
- **B2C Individual Partners ("Refer & Earn"):**
  - Public self-signup with verified mobile number (WhatsApp OTP).
  - Automated referral code generation and live status tracking.
  - Dynamic downloadable festive/occasion EDMs (Diwali, Holi, New Year, National Days) pre-stamped with the partner's referral code for WhatsApp status sharing.
  - Commercial terms: ₹500 payout per completed site; ₹500 discount for referred customer.
- **Financial Dashboard & Payout Control:** Admin interface tracking payout maturity, overdue alerts, and site sign-off verification.

### Milestone 3: Pro Builder (Custom Build) UX Overhaul
- **Early Lead Capture:** Integrated WhatsApp OTP verified lead capture modal at step 1 before custom configuration, ensuring zero drop-off on technical builds.
- **Mobile Slide-Over Cart:** Built responsive slide-out cart drawer (`showMobileCart`) providing seamless BOM inspection on narrow viewports.
- **iOS Safari Auto-Zoom Fix:** Enforced `text-base sm:text-sm` across all input fields, preventing iOS viewport shift on focus.
- **Single-Option Filter Auto-Collapse:** Cleaned up product catalogs by auto-collapsing filters containing only 1 choice (e.g. CAT6-only).

### Milestone 4: Pricing Engine & Hardware Selection Hardening
- **Recorder (DVR/NVR) Resolution Compatibility & Best-Price Tie-Break:**
  - Engineered `parseResolutionMP` and `getRecorderMaxSupportedMP` in `lib/product-resolver.ts` and wired into `lib/pricing-engine.ts`.
  - Recorders are strictly filtered by resolution capability: $\text{recMaxMP} \ge \max(\text{Camera MP})$. 2MP camera setups pair with $\ge 2\text{MP}$ recorders; 4MP/5MP cameras require $\ge 5\text{MP}$ recorders (2MP DVRs strictly disqualified); 8MP cameras require $\ge 8\text{MP}$ recorders; mixed camera setups size to the highest resolution camera.
  - Cost Optimization Rule: If a 5MP recorder is cheaper than a 2MP recorder in the catalog for a 2MP camera setup, the engine selects the cheaper 5MP recorder (since 5MP recorders backward-compatibly run 2MP cameras). When the 2MP recorder is cheaper (e.g. ₹4,255 vs ₹6,613), the engine selects the 2MP recorder.
  - 100% test pass rate across all 238 permutation tests (`scripts/execute-all-238-tests.ts`).
- **Competitive SMPS Rule:** Reverted brittle regex to enforce competitive "Best Price" selection, picking cheaper higher-channel power supplies when beneficial.
- **SMPS Fallback Math:** Hardened fallback quantity to `Math.ceil(camera_count / max_cameras)`.
- **Multi-PoE Gigabit Uplink:** Integrated Desktop Gigabit Switch logic when total IP cameras exceed single PoE switch capacity.
- **Cable Optimization:** Bundling vs. per-meter evaluation, short-run margin slabs, and SKU-level per-meter pricing.
- **Connectors & Junction Boxes:** Exact formulas (`camera_count * 2` + 2 RJ45 uplink; `camera_count * 1` junction boxes).
- **"Match My Brand" Upsell:** Interactive review section allowing one-click brand unification (Mixed vs. CP Plus / Hikvision) with real-time recalculation.

### Milestone 5: Labor, Installation & Quotation Governance
- **No-Cabling Fitting Rates:** ₹200 HD / ₹300 IP per camera + ₹500 visit charge; systems <= 2 cameras priced at flat ₹500/camera.
- **Site Preparation Flags:** Bitmask support for ladder (₹500), marble (₹400), metal (₹200), furnished (₹300), and heavy drilling (₹600) with strictly zero margin markup.
- **Quotation Versioning:** Automated branch creation (`v2`, `v3`) whenever an installer or salesperson updates site conditions post-survey.
- **Quotation Disclaimer:** Added standard physical site variation disclaimer across web and PDF views.

### Milestone 6: Checkout Pathways & Payment Verification
- **Four Checkout Options:** Pay Full (2% discount), ₹500 3-step token, EMI financing, and Free Site Visit calendar booking (future dates only).
- **Fallback Verification API:** Proactive server-side verification attached to payment success screen, preventing missed bookings due to delayed webhooks.

### Milestone 7: High-Fidelity Postal Boundary & Territory Engine (Pan-India)
- **3-Tier Boundary Resolution Architecture:**
  - **Priority 1 (Verified Google Maps Cadastral Polygons):** Hand-curated 100% Google Maps parity for core urban launch PINs (`KNOWN_PINCODE_POLYGONS` in `lib/geo/pincodePolygons.ts`).
  - **Priority 2 (National Open Postal Boundary Layer):** Pre-extracted vector boundaries covering all 31 Jaipur metro PINs (`OFFICIAL_PINCODE_POLYGONS` in `lib/geo/officialBoundaries.ts`).
  - **Priority 3 (Universal Dynamic Convex Hull):** Groups constituent post offices with a calibrated 1.6 km delivery buffer for any unverified PIN code across all 19,300+ PINs in India.
- **302041 Google Maps Alignment:** 34-vertex cadastral perimeter strictly stopping west of Sirsi & Jaton Ki Dhani along Raj Water Park (`lng: 75.684`) with the Bichpari southern notch (`lat: 26.858`).
- **302012 Jhotwara Realignment:** Replaced the rural 15 km Baori balloon with the true urban commercial perimeter of Jhotwara, Khatipura Railway Station, Niwaru Road, and Nangal Jaisabohara.
- **True Geometric Centroid Engine (`getKnownCentroid`):** Overrides corrupted third-party postal coordinates, locking camera zoom (13.2) and pin-drop markers exactly onto central commercial hubs (Jhotwara Circle, Dhankya-Bindayaka).

### Milestone 8: Google Maps Jaipur Parity & Internal Coverage Persistence
- **Official Cadastral District Boundary Integration (`Mappls GeoAnalytics`):** Integrated `window.mappls.GeoAnalytics()` with `layerName: "district"` and filters `district_name='Jaipur' AND state_name='Rajasthan'` to render the authentic government cadastral boundary directly from Mappls vector servers.
- **Accurate 34-Vertex Fallback Boundary (`JAIPUR_METRO_BOUNDARY`):** Built authentic 34-vertex perimeter in `lib/geo/pincodePolygons.ts` conforming strictly to Jaipur's urban bypass (NH-48, NH-52, Amer hills, Agra Road NH-21, Sitapura RIICO, and Sanganer Airport), eliminating rural ballooning into Chomu and Jamwa Ramgarh.
- **Urban Framing Camera Engine:** Initial map camera locked at coordinates `lat: 26.8950, lng: 75.8100` with zoom `11.8`, providing a tight, focused view of the municipal core matching Google Maps search for Jaipur.
- **Self-Contained Coverage Architecture:**
  - All coverage zones stored in Firestore collection `coverage_zones` with custom polygon vertices and operational radii.
  - All pincode coordinates, sub-post offices, and verified delivery micro-hubs cached permanently in `pincode_cache`.
  - Admin Territory Matrix (`/admin/salespersons`) provides an internal, self-sufficient interface to inspect coverage, identify gaps, and assign zones without consulting external tools.

### Milestone 9: Zero Fake Products & Test Teardown Governance
- **Strict Real-Catalog Invariant:** Verified zero dummy/placeholder items in the active product catalog (68/68 genuine SKUs from CP Plus, Hikvision, Dahua). Prohibited seeding artificial products (e.g. `"Test Camera"`) directly into quote/order pipelines.
- **Mandatory Automated Test Teardown (`afterAll`):** Integrated automatic cleanup blocks across all E2E specs (`e2e-financial-contracts.spec.ts`) to immediately delete test quotes, leads, and invoice fixtures upon completion.
- **Admin UI Test Isolation:** Configured `/admin/leads` to automatically hide synthetic test records (`is_test: true`, `QT-E2E-...`, `9999999999`) by default with an on-demand inspection toggle.
- **Dedicated Test Purge API (`/api/admin/cleanup-test-data`):** Implemented an authenticated admin endpoint to purge orphaned test fixtures and maintain Day-0 database cleanliness.
- **PDF Template Resilience:** Hardened `QuotePDFDocument` in `lib/pdf/quote-pdf.tsx` with fallback subtotal derivation, graceful date formatting, and labor line-item deduplication.

### Milestone 10: Administrative Geo Hierarchy Engine (State → District → Tehsil → PINCODE)
- **4-Tier Administrative Structure:** Replaced flat, arbitrary city strings with a structured 4-level Indian administrative model (`State` → `District` → `Tehsil` → `PINCODE (Active vs Inactive)`).
- **Core Active Set & Granular Serviceability:** Locked core urban Jaipur launch PINs (`302001`, `302012`, `302017`, `302029`, etc.) as active, while accurately designating peripheral/rural tehsils (`303702` Chomu, `303901` Chaksu, `303108` Kotputli, `303301` Bassi) and unserved expansion hubs (`342xxx` Jodhpur, `324xxx` Kota, `305xxx` Ajmer, `110041` Nangloi, `422305` Dindori) as inactive.
- **Public API Resolution (`/api/pincode/[pin]`):** Upgraded to check Firestore collection `geo_pincodes` overrides and static baseline hierarchy. Eliminates blind district-wide serviceability assumptions and attaches resolved `tehsil`, `district`, and `state` metadata to all impressions and quotes.
- **Regional Expansion Hub (`/admin/expansion`):** Upgraded `ExpansionClient.tsx` with an interactive 4-tier tree explorer featuring single-PIN active/inactive toggle switches, 1-click bulk Tehsil activation/deactivation, demand density scores, and a "+ Add PIN Code" registration modal.
- **Enriched Waitlist CRM:** Enhanced the unserved waitlist database with dedicated columns for State, District, and Tehsil alongside individual PIN codes.

### Milestone 11: Authoritative 4-Quadrant Micro-Zone Hardening & Database Sanity
- **Eliminated AI Hallucinations in Micro-Zones:** Resolved critical bug where early automated scripts copy-pasted generic central government landmarks (Raj Bhawan, Vidhan Sabha, 22 Godown, Secretariat) across unrelated peripheral PINs (e.g. Jhotwara `302012` showing Raj Bhawan, Bani Park `302016` showing World Trade Park, Mansarovar `302019` showing Sindhi Camp, Vaishali Nagar `302021` showing Collectorate Circle).
- **Master Verified Quadrant Registry (`lib/geo/jaipurQuadrants.ts`):** Engineered authoritative 4-quadrant micro-zone dictionary covering all 38 Jaipur urban and metro PIN codes (`302001` through `302049`) with verified authentic landmarks (e.g. Jhotwara `302012` correctly partitioned into Niwaru Road, Lata Circle, Khatipura Tiraha, and Jhotwara Industrial Area).
- **Purged Corrupted Coordinates from Firestore:** Executed migration script `scripts/reseed-verified-jaipur-quadrants.js` purging invalid out-of-bounds `sub_areas` coordinates (erroneously located in Lucknow, Delhi, Gujarat, and Telangana) and synchronizing Firestore's `pincode_cache` with verified local data.
- **Full Journey Integration:** Injected verified quadrants across `/api/admin/geo`, `/api/pincode/[pin]`, and `SalespersonsClient.tsx`, ensuring both the admin territory editor and customer quote flows reflect 100% accurate local colony data.

### Milestone 12: Universal Sub-Post Office Delivery Micro-Hubs Architecture (All-India Applicability)
- **Eliminated Artificial Compass Quadrant Convention:** Upgraded from rigid, artificial 4-quadrant compass points (`North-West`, `North-East`, `South-West`, `South-East`) to **Authentic Sub-Post Offices (S.O.) and Branch Offices (B.O.) with Local Communicating Names** (e.g., Niwaru Road, Lata Circle, Khatipura, Bandra West, Koramangala, Talwandi Kota).
- **Universal India Post Generator for All 19,000+ PIN Codes:** Upgraded `/api/pincode/[pin]` to dynamically extract and rank official Sub-Post Offices and Branch Offices directly from India Post data, discarding fragile LLM generation and fake quadrant fallbacks.
- **Dynamic Delivery Beat Scaling (1 to 8 Hubs):** Replaced fixed 4-box assumptions with dynamic capacity, cleanly accommodating single-office PINs (e.g. Bandra West 400050, SMS Hospital 302005) and multi-beat tehsils with up to 8 delivery beats.
- **Radial Marker Dispersion & Dynamic Consolidation:** In `SalespersonsClient.tsx`, interactive map markers calculate radial geometric dispersion ($2\pi \cdot i / N$) for any arbitrary number of hubs, while parent PIN consolidation dynamically tracks the total hub count of that PIN.
- **Intelligent Lead Address Matching:** Upgraded `lib/territory.ts` to tokenize local communicating names (e.g. splitting `/`, `&`, `,`), enabling customer street addresses to match technician beats automatically.

### Milestone 13: Map Canvas Visibility Resilience, Halo Visibility Toggle & Auto-Trace Polygon Enclosure
- **Leaflet Modal Lifecycle Hardening:** Solved the blank/gray map canvas glitch inside animated Next.js modals by introducing an automated `ResizeObserver` on the map container and staggered `map.invalidateSize()` calls (0ms, 100ms, 300ms, 700ms) that execute as CSS transitions settle.
- **Google Maps High-Performance Road & Satellite Tile Engine:** Connected the interactive canvas directly to Google Maps via the project's configured `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, completely eliminating CartoDB and purging all "API KEY REQUIRED" watermarks. Integrated a floating basemap switcher on the map canvas allowing admins to seamlessly toggle between **Google Roads**, **Google Satellite (Hybrid)**, and **OpenStreetMap (OSM)**.
- **Global CSS Leaflet Injection:** Ensured `leaflet/dist/leaflet.css` and explicit `.leaflet-container`, `.leaflet-tile-pane`, and `.leaflet-tile-container img` rules are bundled directly in `app/globals.css`.
- **1-Click Micro-Hub Halos Toggle:** Added an interactive `Halos: ON / OFF` toggle in the territory editor toolbar. Admins can suppress the 850m micro-service radii rings at will for a clean, unobstructed view when examining street boundaries or drawing polygon perimeters.
- **1-Click ⚡ Auto-Trace Polygon Territory:** Integrated `handleAutoTracePolygon` (using monotone chain `convexHull` from `lib/geo/pincodePolygons.ts`). Admins can select any combination of delivery hubs and click one button to instantly enclose them in a tight convex polygon (8-14 vertices), eliminating tedious manual perimeter clicking.
- **100% Database Sanitization:** Purged all remaining legacy compass records across Firestore `pincode_cache`, establishing a 0-compass invariant across the entire system.

### Milestone 15: Universal Full Map View Architecture Across Platform
- **Universal Fullscreen Experience:** Implemented synchronized Full Map View toggles across every map interface in the platform (`CoverageAreaMapEditor`, `CoverageMapCanvas`, `SalespersonsClient` Coverage Modal, `TerritoryMatrix`, and `MapplsBoundaryMap`).
- **Coverage Modal Maximization (`SalespersonsClient`):** Added a dedicated modal maximize/restore icon button in the dialog header, expanding the zone creation dialog to `97vw x 96vh` with a `560px` canvas.
- **Coverage Editor Fullscreen Canvas (`CoverageAreaMapEditor`):** 1-click 'Full Map View' button in both the top toolbar and on the map canvas, instantly expanding the editor into a panoramic workspace (`fixed inset-0 z-[9999]`) with an Escape key listener and exit banner.
- **District Boundary Fullscreen View (`TerritoryMatrix` & `MapplsBoundaryMap`):** 1-click full-screen expansion for Mappls choropleth maps, automatically invoking `.resize()` on Mappls/Leaflet instances to fill 100% of the display.
- **Google Maps Infrastructure Standardization:** Upgraded all fallback maps (`LeafletMapFallback.tsx`) to authentic Google Maps tiles using `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

### Milestone 16: Interactive Delivery Hub Filtering & Footprint Isolation (All / Covered / Uncovered)
- **Eliminated Marker Clutter:** In dense urban districts with 100+ delivery hubs (e.g. 104 hubs in Jaipur, 463 hubs in district searches), intermixed green and red markers created cognitive overload when planning or auditing technician territories.
- **3-State Interactive Hub Filter Control:** Converted static text chips into interactive pill buttons in `CoverageAreaMapEditor.tsx` with identical visual labels matching user workflows:
  - `All ({totalCount})`: Displays entire district delivery hub network.
  - `● {coveredCount} Covered (Green)`: Isolates active, claimed delivery hubs with green pulse indicators; suppresses red uncovered hubs to inspect verified service continuity.
  - `● {uncoveredCount} Uncovered (Red)`: Isolates unassigned colonies and coverage gaps with red indicators; suppresses green hubs so expansion targets and service holes stand out clearly.
- **Synchronized Dual-Layer Filtering (`SalespersonsClient.tsx`):** Filter state is seamlessly synchronized between the Map Canvas and the PINCODE / Hub Matrix below the map:
  - Filtering to `Covered (Green)` filters both map markers and the PIN table to only show covered PINs and delivery beats.
  - Filtering to `Uncovered (Red)` isolates uncovered gaps on the map and shows only unassigned PINs/beats in the list below.
  - Quick filter buttons added directly into the "Available PINCODEs" section header for 1-click filtering anywhere in the modal.
- **Bi-directional Toggle & Instant Reset:** Clicking an active filter tab toggles it back to "All"; an explicit `Reset Filter` link provides 1-click reset; and a floating badge on the map canvas (`Showing X Hubs [✕]`) gives full situational awareness even in fullscreen mode.
- **Seamless Action Synergy:** Works synchronously with `⚡ Auto-Trace Territory` (enclosing covered hubs) and `🛡️ Claim All Uncovered` (batch-claiming the visible uncovered set).

### Milestone 17: 4-Tier Geographic Cascader for Technician Onboarding & Profile Management (State → District → Tehsil → PINCODEs)
- **Eliminated Manual PIN Entry Bottlenecks:** Replaced flat, error-prone manual 6-digit text inputs (`serviceable_pincodes_raw`) with a structured 4-tier geographic cascader component (`TerritoryPincodeSelector.tsx`).
- **Comprehensive Modal Integration:** Embedded into both Modal 1 (Onboard Technician Modal) and Modal 2 (Edit Profile & Territory Modal) in `InstallersClient.tsx`, expanding modal dialogs to `max-w-2xl` for spacious, modern ergonomics.
- **Operational Truth Filtering (Active-Only by Default):**
  - **Single Source of Truth:** Connected directly to the Authoritative Geo Hierarchy Engine (`/api/admin/geo/hierarchy`).
  - **Zero-Clutter Active Flow:** By default, filters out all non-operational states and inactive districts. Shows only States with `active_count > 0` (currently Rajasthan), Districts with active coverage (Jaipur), Tehsils with active PINs (Jaipur Urban, Sanganer, Amer, Jhotwara), and the 20 core urban launch PINCODEs.
  - **Seamless On-Demand Expansion:** When an admin activates a new state, district, or tehsil via `/admin/expansion` (e.g. bulk activating Nashik in Maharashtra or South Delhi), that territory immediately lights up in the installer cascader with 0 code changes.
  - **Expansion / Pre-launch Mode Toggle:** An interactive header pill (`[ShieldCheck: Active Territories Only] <-> [Compass: Showing Expansion Zones]`) enables admins to provision technicians in upcoming expansion hubs ahead of city launches.
  - **Direct Expansion Hub Link:** Integrated quick link `[Expansion Hub ↗]` directly to `/admin/expansion` for 1-click territory activation.
- **Dynamic 4-Tier Administrative Flow:**
  - **Tier 1 (State):** Searchable dropdown loaded from Geo Hierarchy (`/api/admin/geo/hierarchy`), defaulting to Rajasthan with active PIN count badge.
  - **Tier 2 (District):** Searchable dropdown showing active operational districts (Jaipur).
  - **Tier 3 (Tehsil):** Searchable dropdown showing active revenue tehsils with live counts (`Jaipur Urban (17 PINs)`, `Sanganer (1 PIN)`, etc.).
  - **Tier 4 (PINCODEs):** Interactive card grid displaying 6-digit codes enriched with authentic colony anchors from `JAIPUR_VERIFIED_QUADRANTS` and postal office data (e.g., `302012 (Khatipura / Jhotwara)`, `302019 (Mansarovar / VT Road)`, `302020 (Vaishali Nagar / Chitrakoot)`).
- **1-Click Batch Actions & Productivity:**
  - `+ Select All ({count})`: Instantly claims all currently filtered PINs in the tehsil/district.
  - `Deselect in View`: Removes visible PINs from technician territory.
  - `✕ Clear All`: Resets assigned territory with 1 click.
  - Quick Search Filter: Real-time search across PIN codes and colony names.
- **Two-Way Synchronized Manual Paste Fallback:** Collapsible `[Paste PINs / Raw Editor]` allows pasting raw comma, space, or newline-separated PIN lists (e.g. from WhatsApp or spreadsheets) that automatically parses and syncs with the interactive chips in real time.
- **Assigned Pincodes Badge Bar:** Live wrap of assigned PIN badges with 1-click `✕` removal buttons.
 
### Milestone 14: On-Demand State & District Provisioning & Zero Inactive Clutter Baseline
- **Clean Operational Baseline:** Removed mock placeholder states (Delhi, Maharashtra) and unlaunched districts from the default baseline. Only operational launch state (Rajasthan) and active district (Jaipur) appear by default.
- **Top Action Toolbar:** Added `+ Add State`, `+ Add District`, and `+ Add PIN Code` buttons.
- **Contextual State & District Actions:**
  - `+ Add District` directly on any State header card (pre-selects that state in the import modal).
  - Remove State (`Trash2`) for custom imported states.
  - Remove District (`Trash2`) for custom imported districts.
- **Automated 4-Tier Provisioning Modals:**
  - **Add State Modal:** Admin selects from all 36 Indian states & union territories, selects the launch district, and provisions all official PIN codes and AI-classified tehsils with full 4-tier architecture.
  - **Add District Modal:** Admin selects an active state, picks from unadded official districts in that state, and instantly generates the 4-tier tree with 1-click bulk Tehsil activation switches.
- **Installer Territory Cascader Integration:** Any newly provisioned state, district, or PIN automatically becomes available in the installer assignment tool once active.

### Milestone 18: Comprehensive Recorder Resolution & Cost Optimization Engine
- **Technical Resolution Compatibility:** Enforced $\text{recMaxMP} \ge \max(\text{Camera MP})$ invariant across all hardware selection workflows.
  - Camera 2MP $\rightarrow$ Minimum 2MP DVR/NVR (or cheaper 5MP if available).
  - Camera 4MP / 5MP $\rightarrow$ Minimum 5MP DVR/NVR (2MP units strictly disqualified).
  - Camera 8MP (4K) $\rightarrow$ Minimum 8MP DVR/NVR.
  - Mixed setups (e.g., 3x 2MP + 1x 5MP) $\rightarrow$ Minimum 5MP DVR/NVR (sized to the highest camera resolution in the quote).
- **Cost Optimization Tie-Break:** Cheaper higher-spec recorders take precedence (e.g. 5MP DVR chosen over 2MP DVR if priced lower, saving customer cost while running 2MP cameras natively).
- **238 Permutations Pass:** Validated with 238/238 automated matrix tests in `scripts/execute-all-238-tests.ts`.

### Milestone 19: IP Quotation Engine Resilience (4-Channel NVR, PoE Switches & IP Labor)
- **Firestore Soft-Deletion Query Fix:** In `hooks/useRealtimeInventory.ts`, removed `where("is_deleted", "==", false)` from the live Firestore snapshot query. Because Firestore indexes omit documents missing the `is_deleted` property, 4Ch, 8Ch, and 16Ch NVRs and PoE switches were previously invisible to clients. Switched to fetching active items and filtering soft deletions in memory (`.filter(p => p.is_deleted !== true)`). Backfilled `is_deleted: false` to all Firestore catalog products.
- **PoE Switch String Parsing:** In `lib/pricing-engine.ts` and `lib/product-resolver.ts`, fixed PoE keyword detection by concatenating both `technical_name` and `display_name` (`${a.technical_name || ""} ${a.display_name || ""}`). Prevented manufacturer model codes (e.g. `BB-PES4`) from masking PoE keywords and misidentifying PoE switches as Analog SMPS.
- **Standard IP Labor Baseline:** Set baseline IP installation and termination rate to ₹500/camera in `lib/pricing-engine.ts`, correctly billing IP labor instead of defaulting to the HD rate of ₹400/camera.
### Milestone 20: Full Hardware Isolation, Port Sizing & Firestore Normalization
- **Database Attribute Normalization:** Audited and normalized all 65 live Firestore catalog products in `team-cctv-live-8294`. Repaired missing `channels`/`max_cameras` attributes on power devices (`POE-BUD-4CH`, `POE-BUD-8CH`, `POE-DLINK-16CH`, `SMPS-BUD-8CH`, `SMPS-CPP-8CH`) and recorders (`DVR-CPP-4CH-5MP`, `DVR-CPP-8CH-2MP`, `DVR-CPP-16CH-2MP`, `NVR-CPP-32CH`). Normalized `storage_capacity_tb` on HDDs and `form_factor` on dome/bullet cameras. Audit confirmed 0 anomalies remaining.
- **Canonical Channel & Port Capacity (`getProductChannelCapacity`):** Implemented multi-tier capacity detection across `lib/product-resolver.ts`, `lib/pricing-engine.ts`, and `store/configurator.ts`, inspecting `channels`, `max_cameras`, `network_ports`, and regex pattern `(\d+)\s*(?:ch|port|channel|channels|ports)`.
- **Zero-Trust Pinned Hardware Validation:** Hardened `resolveRecorder`, `resolveTransmission`, `resolveHDD`, and `store/configurator.ts` to strictly validate pinned overrides against technology compatibility, channel capacity, resolution limits, and soft-delete exclusion (`is_deleted !== true`). Any cross-technology mismatch (e.g. Analog SMPS pinned for IP cameras) or oversized recorder on small systems is instantly dropped and auto-resolved.
- **PoE Switch Port Tier Sizing:** Enforced strict port-tier ascending sorting for IP PoE switches ($4\text{-port} < 8\text{-port} < 16\text{-port}$) before price, ensuring 4-camera setups resolve to a 4-port PoE switch (₹1,080 / ₹1,350) and never a 16-port switch. HD SMPS units prioritize lowest cost within qualifying capacities.
- **100% Invariant & Matrix Verification:** Validated 238/238 automated matrix test permutations and dedicated resolution invariant test suite covering IP/HD separation, pinned misconfiguration recovery, and recorder resolution sizing.

### Milestone 22: Mixed Camera Count Synchronization, Power Brand Matching & Currency Precision
- **Total Camera Count Truth Invariant:** Fixed critical desynchronization where mixed camera configurations (e.g., 3 Outdoor Bullet + 2 Indoor Dome = 5 cameras) passed initial 2-camera counts into hardware resolvers. Now, total active cameras are automatically calculated and synchronized across `calculateHardware`, `resolveRecorder` (sizing to 8Ch NVR), `resolveHDD` (daily GB for 5 cameras), `resolveTransmission` (sizing to 8-port PoE switch at qty 1), and `InstantQuotationReview` top card and labor badges.
- **Power Device Brand Matching:** Enhanced `resolveTransmission` to evaluate `selection.brand_preference`. Quotes with CP Plus selected now cleanly resolve to CP Plus PoE switches (e.g. CP Plus 8-Port PoE Switch @ ₹2,875) instead of defaulting to Budget Brand.
- **Currency Symbol Encoding:** Eliminated corrupted `?` character in cable remainder line items (`@ ?30/m`), replacing it with standard Indian Rupee symbol `₹` (`@ ₹30/m`).
- **Labor Rate Alignment:** Updated Firestore `settings/app_config` to peg IP installation labor at ₹500/camera and HD labor at ₹400/camera in strict accordance with `BUSINESS_RULES.md`.

### Milestone 23: Complete HDMI Cable Catalog & Multi-Option Expansion
- **Comprehensive HDMI Cable Range:** Expanded the CCTV add-on accessories catalog from a single 3-meter option to the full market range:
  - 1.5 Meter (`HDMI-1.5M`, Compact, ₹84 +GST)
  - 3 Meter (`HDMI-3M`, Essential, ₹168 +GST)
  - 5 Meter (`HDMI-5M`, Extended, ₹252 +GST)
  - 10 Meter (`HDMI-10M`, Long Run, ₹420 +GST)
  - 15 Meter (`HDMI-15M`, Pro Length, ₹630 +GST)
  - 20 Meter (`HDMI-20M`, Max Range, ₹910 +GST)
- **Live Catalog Price Synchronization:** Updated `InstantQuotationReview.tsx` so add-on cards dynamically resolve prices directly from `products` collection (`products.find(p => p.id === acc.id || p.sku === acc.id)?.unit_price || fallbackPrice`). Card prices, BOM line item rates, and gross totals are guaranteed 100% synchronized.
- **Smart Length Switching in Configurator:** Enhanced `toggleAddon` in `store/configurator.ts` to enforce mutual exclusivity across HDMI cable lengths. Selecting an HDMI length automatically switches out any previously selected length, preventing duplicate billing for single-recorder setups.
- **Catalog Add-on Merging & Fallback Defense:** Dynamically merged all active catalog accessories from `products` and `addons` in `InstantQuotationReview.tsx`, and implemented `FALLBACK_CATALOG` in `lib/pricing-engine.ts:calculateAddons` ensuring offline/mock resilience.
### Milestone 25: Wireless CCTV Multi-Camera Storage & Labor Architecture
- **MicroSD Card Multiplication:** Wi-Fi cameras record locally on dedicated MicroSD cards (1 card per camera). The pricing engine enforces `qty = camera_count` for pure wireless setups, and `qty = wifi_camera_count` for hybrid setups.
- **H.265 Bitrate & Mode Estimation:** Storage capacity is dynamically calculated using H.265 baseline daily consumption with intelligent mode multipliers (Smart Motion = `0.40`, Continuous 24×7 = `1.0`).
- **Dedicated Wireless Labor:** Added `labor_wireless_pro_per_camera` pegged at ₹349/camera for professional Wi-Fi camera wall/ceiling mounting and app configuration, with a 100% free DIY Delivery option (`₹0`).
- **Strict Wired Hardware Exclusion:** Pure wireless configurations strictly exclude DVRs, NVRs, SMPS units, PoE switches, BNC/DC/RJ45 connectors, and coaxial/LAN cabling.

### Milestone 26: Mandatory Wi-Fi Connectivity Check & 4G/5G Router Flow (Option B)
- **Wi-Fi Connectivity Invariant:** Wi-Fi cameras require an active broadband Wi-Fi connection to operate.
- **Guided Connectivity Check:** The configurator prompts customers selecting Wireless technology (or adding Wi-Fi cameras in hybrid setups) to verify if a working Wi-Fi connection is available at the installation site.
- **Automated Router Injection:** If the customer does NOT have Wi-Fi, the quotation engine automatically adds a high-speed 4G/5G SIM Wi-Fi Router (`ACC-4G-ROUTER` @ ₹1,885) to the quotation BOM, ensuring a fully operational standalone system out of the box.

### Milestone 27: Solar CCTV Camera Architecture
- **Integrated Unit Invariant:** Standardized rule: Solar CCTV cameras are engineered as complete all-in-one systems with the solar panel and mounting bracket bundled inside the camera box.
- **Zero Separate Solar Panel Charge:** Solar panels are strictly prohibited from being billed or quoted as separate add-on accessories.

### Milestone 28: Mega Compu World CP Plus PTZ & 4G Camera Catalog Expansion
- **6 Top-Selling Models Added to Firestore:** Integrated genuine, high-demand CP Plus cameras from Mega Compu World:
  1. `CAM-CPP-WIFI-E28Q`: CP Plus 2MP Wi-Fi PT Camera with Two Way Talk (CP-E28Q) @ ₹2,429
  2. `CAM-CPP-4G-R33T`: CP Plus 3MP 4G Smart Full Color Bullet Camera with 2-Way Audio (EZ-R33T) @ ₹2,593
  3. `CAM-CPP-WIFI-E31Q`: CP Plus 3MP Wi-Fi PT Camera with Two Way Talk (CP-E31Q) @ ₹2,989
  4. `CAM-CPP-WIFI-E38Q`: CP Plus 3MP Wi-Fi PT Camera with Two Way Audio (CP-E38Q) @ ₹3,104
  5. `CAM-CPP-4G-S35T`: CP Plus 3MP 4G PT Camera Night Color with Two Way Talk (EZ-S35T) @ ₹3,827
  6. `CAM-CPP-WIFI-Z45Q`: CP Plus 4MP Quad HD Wi-Fi PT Camera Night Color with Built-in Siren (CP-Z45Q) @ ₹4,485

### Milestone 29: Inbuilt Speaker Capability & Dynamic MicroSD Capacity Selector (with Safety Caps)
- **Inbuilt Speaker Hardware Option:** Added `Inbuilt Speaker` (`has_speaker`) checkbox in the Admin Product Modal right next to `Audio Mic`. Checking it automatically flags `has_speaker: true` and activates `has_audio: true` for 2-way talk.
- **Dynamic MicroSD Capacity Selector:** Added interactive capacity selector (`[ 128 GB (Default) ]`, `[ 256 GB ]`, `[ 512 GB ]`) when `SD Slot` is checked in the Admin Modal, safely defaulting to **128 GB**.
- **Pricing Engine Hardware Safety Cap:** In `resolveHDD`, candidate MicroSD cards are capped by `cameraProduct?.max_sd_capacity_gb || 128` to guarantee that oversized incompatible cards (e.g., 256GB/512GB) are never quoted for cameras that only support 128GB.
- **Admin Inventory Table Badges:** Displaying `2-Way Talk` (purple) / `Mic` (blue) and `SD: 128GB/256GB` (amber) badges in the product specs column.
- **Firestore Database Synchronization:** Backfilled all existing cameras with SD slots and two-way talk across the database.

### Milestone 30: Form Factor Modernization (PT vs PTZ vs Multi-Lens Multi-Sensor Architecture)
- **Elimination of Ambiguous Form Factor:** Replaced flawed `"Indoor / Outdoor 360° PTZ (Pan/Tilt)"` option with distinct, industry-standard options:
  - `Indoor Ceiling Dome` (`dome`)
  - `Outdoor Bullet (Weatherproof)` (`bullet`)
  - `Indoor Pan & Tilt (PT)` (`indoor_pt`)
  - `Outdoor Pan & Tilt (PT)` (`outdoor_pt`)
  - `Commercial PTZ (Motorized Optical Zoom)` (`ptz`)
  - `Multi-Lens Multi-Sensor (Dual / Triple / Quad)` (`multi_lens`)
  - `Turret / Eyeball` (`turret`)
  - `Wire-Free / Battery Powered` (`wire_free_battery`)
  - `Smart Video Doorbell` (`video_doorbell`)
- **PT vs. PTZ Technical Isolation:**
  - Standard rotating cameras with fixed lenses are classified as **PT (Pan & Tilt)** (`is_pt: true, optical_zoom_x: 0`).
  - Cameras with motorized optical zoom lenses are classified as **PTZ** (`is_pt: true, optical_zoom_x > 1`).
- **Comprehensive Multi-Lens Architecture Sub-Panel:**
  - Added dedicated Multi-Lens configuration UI when `multi_lens` or `is_dual_lens / is_triple_lens / is_quad_lens` is active.
  - Configures **Lens Count** (2 Dual, 3 Triple, 4 Quad), **Archetype** (Fixed + PT, Fixed + Optical PTZ, Panoramic Stitched, Multi-Directional), **Per-Lens Breakdown** (`lens_breakdown`), **NVR Channels Used** (`nvr_channels_consumed`: 1 to 4), and **Recording Streams Multiplier** (`recording_streams_count`: 1 to 4).
- **Engine Sizing & Storage Synchronization:**
  - `lib/configuration-engine.ts` sizes NVR channels based on `nvr_channels_consumed` (e.g. 2 dual-lens IP cameras using 2 channels each size to 4-channel NVR; 3 size up to 8-channel NVR).
  - Multi-stream recording multiplies daily gigabyte rates so MicroSD/HDD storage recommendations are never cut in half.
  - `lib/product-resolver.ts` and `lib/pricing-engine.ts` isolate indoor plastic PT cameras from outdoor weather requirements and cleanly match PT vs PTZ vs Multi-Lens.

### Milestone 32: Hybrid CCTV Systems Architecture (Wired + Wireless in Single Quotation)
- **Guided Setup & Pro Builder Hybrid Integration:**
  - In Guided Setup Wizard (`WizardClientV2.tsx`), Step 0 explicitly highlights `+ Wi-Fi Support` on wired systems, allowing customers to add Wi-Fi cameras in Step 1 alongside indoor and outdoor wired cameras.
  - In Pro Builder (`ProBuilderClient.tsx`), Step 1 features a dual sub-tab switcher: `[Wired {technology} Cameras]` vs `[+ Add Wireless / 4G]` with informative callouts explaining the benefits of wireless cameras for remote gates, terraces, or garden perimeter spots.
- **Sizing NVR/DVR Strictly to Wired Cameras:**
  - Implemented channel capacity checks that evaluate `wiredCamCount` rather than total camera count, recognizing that wireless cameras record to onboard MicroSD cards and stream over the network rather than consuming physical DVR/NVR BNC or PoE channels.
- **Dual-Storage Co-Allocation (Surveillance HDD + Dedicated MicroSDs):**
  - Pro Builder Step 3 features dual-storage guidance and sub-tab filters (`All Storage`, `Surveillance HDDs`, `MicroSD Cards`), allowing simultaneous allocation of a central Surveillance HDD (qty 1) and dedicated MicroSD cards (qty = `wirelessCamCount`).
- **Zero-Transmission for Wireless Hardware:**
  - Connectors (RJ45/BNC), cabling coils, and power devices (PoE/SMPS) size strictly to `wiredCamCount`, preventing unwarranted cabling and power costs for wireless cameras with local wall plug adapters.
- **Independent Installation Labor Billing:**
  - Hybrid quotations separate labor into `PRO_INSTALL_IP`/`PRO_INSTALL_HD` for wired cabling/mounting and `PRO_INSTALL_WIRELESS` (₹349) / `PRO_INSTALL_DIY` (₹0) for wireless fitting.
- **Server Parity & Automated Verification:**
  - Updated `app/api/quote/save/route.ts` to identify wireless cameras via both SKU and `technologies` array.
  - Automated unit test suite (`scripts/test-wireless-storage-multiplication.ts`) verified with 25/25 passing tests (100% pass rate).

### Milestone 33: Competitor Price Match Guarantee, Deal Desk & Self-Healing Baseline Engine (November 2026)
- **Self-Healing Baseline Quotation Engine (`lib/baseline-quote.ts`):**
  - Implemented `getOrCreateLeadQuote(leadOrQuoteId)` to deterministically synthesize server-authoritative quotations with 8 line items from `wizard_answers` if no quote document was created prior to price match upload or checkout.
  - Hardened CRM quote route (`/api/crm/quotes/[quoteId]`), PDF download streaming (`/api/quote/[quoteId]/download`), and PDF URL resolver (`/api/quote/[quoteId]/pdf`).
  - Fixed production lead `TMHfOybvSJ9OGof9xRoE` (Rakesh, 8 cameras) live in production: returned 200 OK, ₹45,286, 8 items, PDF streaming 6,496 bytes.
- **Contextual On-Card Anchoring & Floating Popup Deprecation:**
  - Permanently deleted `components/quotation/PriceMatchPopup.tsx` (the unanchored 45-second floating popup) and removed its references from `ConfiguratorView.tsx`.
  - Replaced with 100% on-card contextual action button `"Lower competitor quote? Match Price"` inside `PriceMatchModal.tsx`, guaranteeing all submissions carry `selected_package_title` and `selected_package_price`.
- **Admin Deal Desk & WhatsApp Counter-Pitch:**
  - Integrated Deal Desk in `/admin/leads/[leadId]` showing side-by-side comparative economics (Catalog vs. Competitor, variance, and counter-strategy options: Match Exact, Beat by ₹500, Custom Counter).
  - Built 1-click WhatsApp counter-pitch generator highlighting 100% Pure Solid Copper Cables and Genuine Surveillance Storage.
  - Enforced strict safety invariant: Zero occurrences of `"2 years onsite warranty"` or `"2 year onsite warranty"` across all customer-facing copy.
- **End-to-End Verification:**
  - Full 7-Phase Customer Cycle Lifecycle Test (`scripts/test-full-customer-lifecycle-e2e.ts`) passed 100%.
  - Playwright UI test (`tests/new-features.spec.ts`) passed 100%.
  - Production deployment `dpl_BwWkqaYJfcCXkb1UoEfgYJA7viJc` active and verified live on `cctvquotation.com`.

---

### Milestone 34: Sales & CRM Lead Urgency & Omnichannel Alignment (November 2026)
- **Omnichannel Site Work Urgency Capture:**
  - **Guided Setup (Step 4):** Embedded dedicated urgency selector card (*When do you want work done on your site?*) with 4 visual choice tiers: `⚡ ASAP (1-2 Days)`, `📅 Within a Week`, `🗓️ This Month (Construction)`, and `🔍 Just Planning`.
  - **Build Your Own Setup (Pro Builder Step 6):** Embedded urgency selector before contact verification to prevent lead prioritization leakage for custom builds.
  - **WhatsApp Omnichannel Bot (`ASK_TIMELINE`):** Added Question 9 of 9 interactive quick-reply button menu before postal code capture, updating Firestore leads with priority eagerly.
  - **Compare Mode & Configurator:** Synchronized `installation_timeline` across state machines, BOM cards, and quote snapshots.
- **Automated CRM SLA Prioritization Engine:**
  - Mapped canonical timelines: `asap` / `immediately` ➔ `HOT` (1-hour SLA, 15m dynamic breach timer); `week` ➔ `HOT` / `WARM` (24-hour SLA, 60m timer); `month` ➔ `WARM`; `research` ➔ `NURTURE` (3-day SLA).
  - Wired auto-queueing into `followup_tasks` collection upon lead creation, alerting sales queue without manual intervention.
- **Admin & Field Workspace Synchronization:**
  - **Admin Table (`/admin/leads`):** High-visibility urgency badges + 1-click WhatsApp chat action button (`💬`) on every row.
  - **Lead 360 Header (`/admin/leads/[leadId]`):** Permanent top-level site work timeline indicator alongside payment and B2B tags.
  - **Kanban Pipeline Board:** Added colored urgency badges to every draggable lead card across all columns.
  - **Lead Details Drawer:** Integrated dedicated site work timeline review block.

---

### Milestone 35: Dual-Entity Beat Planning, Route Optimization & Inactivity Aging (November 2026)
- **Dual-Entity Route Architecture (Customer Leads + B2B Channel Partners):**
  - Integrated B2B Promoters (electricians, interior designers, architects, hardware dealers) into the route planning engine alongside customer site survey leads.
  - Implemented proximity discovery for on-the-way partner check-ins during customer survey trips.
- **Inactivity Aging Engine (`lib/inactivity-tracker.ts`):**
  - Tracks `last_visited_at`, `last_called_at`, `last_whatsapp_at`, and `last_contacted_at` across both `leads` and `promoters`.
  - Visual status badges: `🟢 Active (<7d)`, `🟡 Due Soon (7-14d)`, `🔴 Overdue (>14d)`, and `⚠️ Never Contacted`.
  - Zero-paperwork touchpoint auto-logging: Clicking `💬 WhatsApp` or `📞 Call` automatically posts to `/api/crm/touchpoint`, updating the timestamp and resetting the inactivity clock without manual reporting.
- **Interactive Territory Beat Planner Workspace (`components/crm/BeatPlannerWorkspace.tsx`):**
  - Day schedule broken down into 3 canonical time slots (`Morning 09:30 AM – 01:00 PM`, `Afternoon 01:30 PM – 05:00 PM`, `Evening 05:30 PM – 08:00 PM`).
  - Neglected Accounts Backlog tab highlighting overdue partners and leads with days counter.
  - Dual-entity Google Map with numbered stop markers, polyline route, nearby B2B partner diamonds, and 1-click Google Maps Navigation (`buildGoogleMapsMultiStopUrl`).
  - VRPTW Route Auto-Optimization: Traveling Salesperson Problem heuristic minimizing round-trip drive kilometers.
  - Geofenced Visit Check-In modal (`📍 Check In`) recording meeting notes and timestamps.
- **Admin & Salesperson Integration:**
  - Mounted Admin workspace at `/admin/beat-plans` with sidebar navigation.
  - Mounted Field Sales workspace at `/salesperson/route`.
  - Added inactivity aging badges to Admin Leads table (`/admin/leads`) and Promoters table (`/admin/promoters`).

---

### Milestone 36: Configuration Tool Inventory Grouping, Storage Normalization & Multi-Category Visibility (November 2026)
- **Canonical Storage Type Normalization (`getStorageTypeNormalized`):**
  - Resolved string enum mismatch where Admin Portal (`/admin/products`) saves drives as `Surveillance HDD`, while Configurator expected `Hard Disk`.
  - Dynamically bridges `Surveillance HDD`, `Hard Disk`, and `HDD` into canonical `Hard Disk`, restoring all active Budget Brand drives (500GB, 1TB, 2TB, 4TB) alongside Seagate drives.
  - Normalizes `Micro SD`, `MicroSD`, and `SD Card` into canonical `Micro SD`.
- **Numeric Storage Capacity Sorting (`parseCapacityInGB`):**
  - Replaced alphabetical capacity sorting (`["1TB", "2TB", "4TB", "500GB"]`) with numeric order (`500GB → 1TB → 2TB → 4TB`).
- **Storage Brand & Capacity Filters:**
  - Introduced dedicated `Brand` filter (`Budget Brand`, `Seagate`, etc.) and `Capacity` filter dropdowns under the Storage tab in `FullCustomizerPanel.tsx`.
- **Accessories & Transmission Hardware Sub-Category Grouping (`getAddonGroupLabel`):**
  - Unblocked `network` devices (such as D-Link 4G SIM Wi-Fi Routers) from being filtered out of the Configuration Tool.
  - Structured all accessories and cables into discrete, logical sub-groups:
    - `Cables & Wire` (3+1 Coaxial, CAT6, HDMI)
    - `Connectors` (BNC, DC, RJ45)
    - `Junction Box & Mounts` (PVC Weatherproof Junction Boxes)
    - `Racks & Enclosures` (2U, 4U Wall Mount Racks)
    - `Network & Routers` (4G SIM Wi-Fi Routers, Range Extenders)
    - `Display & Monitors` (LED Surveillance Monitors)
    - `Services & AMC` (Comprehensive Maintenance Contracts)
- **Power Device Compatibility & Zero-Stock Protection:**
  - Removed restrictive single-device channel cutoff in `filteredPower`, allowing multi-unit pairings (e.g. 2x 4-port supplies for 8-camera setups).
  - Preserved active catalog visibility so out-of-stock active products display the designated "Out of Stock" disabled card rather than vanishing.
- **End-to-End Test Suite (`scripts/test-configuration-catalog.ts`):**
  - 24/24 unit and catalog integration tests passing across HD, IP, and Wireless modes.

---

## 3. Comprehensive Verification & Testing Gates

| Verification Layer | Target | Result | Evidence |
|---|---|---|---|
| **Layer 1: Type Safety** | `npx tsc --noEmit` | `PASS` | 0 errors across all routes, components, and lib modules. |
| **Layer 2: Production Build** | `npm run build` | `PASS` | All static and dynamic pages compiled successfully. |
| **Layer 3: Pricing Parity** | Guided vs. Custom Build | `PASS` | Exact mathematical parity verified across HD and IP test matrices. |
| **Layer 4: Payment Webhook Fallback** | Razorpay / Cashfree | `PASS` | Quotes marked BOOKED on success screen even when webhook is bypassed. |
| **Layer 5: Role Boundary Security** | Customer vs. Staff | `PASS` | Staff logins on customer portal restricted to customer privileges. |
| **Layer 6: Mobile Responsiveness** | Small Screens & Safari | `PASS` | Pro Builder drawer and 16px input fields prevent zoom glitch. |
| **Layer 7: Boundary Engine Fidelity** | Google Maps Postal Parity | `PASS` | 100% Google Maps parity for 302041 (Dhankya/Bindayaka/Bichpari, excluding Sirsi) and 302012 (Jhotwara urban core) + true geometric centroid alignment (`getKnownCentroid`). |
| **Layer 8: City Boundary & Framing** | Google Maps Jaipur Parity | `PASS` | Mappls GeoAnalytics official boundary + 34-vertex fallback; camera locked at zoom 11.8 on Jaipur city core; zero rural scatter. |
| **Layer 9: Catalog & Data Hygiene** | Zero Fake Products & Teardown | `PASS` | Genuine products; 0 fake SKUs; test teardown hooks attached; Admin test records hidden by default. |
| **Layer 10: Administrative Geo Hierarchy** | 4-Tier PIN/Tehsil Hierarchy | `PASS` | Granular active vs inactive PIN enforcement; single PIN toggle & bulk Tehsil activation verified; 0 TS errors. |
| **Layer 11: Universal Delivery Micro-Hubs & Halos** | Sub-Post Offices & 3-Tier Geography | `PASS` | Dynamic S.O./B.O. hubs with 850m halos, tokenized address matching, radial dispersion, and 100% India Post coverage. |
| **Layer 12: Production Live Deployment** | https://cctvquotation.com | `PASS` | Live production verified with HTTP 200, fast SSL handshake, and verified delivery micro-hubs. |
| **Layer 13: Map Canvas & Street Tile Rendering** | Google Maps Tiles & Layer Switcher | `PASS` | Zero gray canvas freezes; authentic Google Roads, Satellite, and OSM basemaps with 0 watermarks. |
| **Layer 14: Territory Enclosure Automation** | 1-Click Auto-Trace Polygon & Halos Toggle | `PASS` | Convex hull enclosing covered delivery hubs in 1 click; 850m halos toggleable between ON and OFF. |
| **Layer 15: Universal Full Map View** | Fullscreen Across All Maps | `PASS` | 1-click full screen with Escape key listeners across Coverage Area Editor, Zone Modal, and Territory Boundary Matrix. |
| **Layer 16: Delivery Hub Footprint Isolation** | Interactive Hub Filtering (All/Covered/Uncovered) | `PASS` | Dynamic marker filtering with live count badges, floating map indicators, and 0 canvas latency. |
| **Layer 17: Technician Territory Cascader** | 4-Tier Cascader (State/District/Tehsil/PINs) | `PASS` | Live bidirectional sync between chips, tehsil batch actions, and raw paste fallback; verified with zero TS errors and successful Next.js build. |
| **Layer 18: On-Demand State & District Provisioning** | 4-Tier Expansion Network & Modals | `PASS` | Inactive states/districts removed from baseline; on-demand +Add State and +Add District modals with postal API & AI tehsil auto-generation verified; deployed live to https://cctvquotation.com. |
| **Layer 19: Recorder Resolution & Best-Price Matrix** | 238 Permutations Matrix (`execute-all-238-tests.ts`) | `PASS` | 238/238 passed (100%). Sizing rule $\text{recMaxMP} \ge \text{targetMaxMP}$ + cheaper higher-spec selection verified across 2MP, 4MP, 5MP, 8MP, and mixed cameras. |
| **Layer 20: IP Hardware & Labor Engine Verification** | 2-Cam IP Quotation Simulation | `PASS` | CP Plus 4Ch NVR resolved (₹5,405); PoE Switch resolved (`POE-BUD-4CH` @ ₹1,080); IP Labor billed at ₹500/cam; 0 TS errors; 100% build pass. |
| **Layer 21: Cross-Tech Hardware Isolation & Zero-Trust Pinned Defense** | Invariant Suite (`test-invariants.ts`) & 238 Matrix | `PASS` | 100% invariant pass: IP quotes never receive Analog SMPS, 4-cam quotes never receive 32Ch NVR; mismatched pinned overrides instantly rejected and auto-healed. |
| **Layer 22: Mixed Camera Sizing & Brand Matching Defense** | Live Quote Suite (`verify-quote-fixes.ts`) | `PASS` | 5-cam mixed setup (3 bullet + 2 dome) correctly selects 8Ch NVR, 1x 8-port PoE switch, ₹500 labor/cam, and clean ₹ currency symbol with 100% build pass. |
| **Layer 23: All-Camera-Count Scaling & Industrial Boundary Matrix** | Matrix Suite (`test-all-counts-matrix.ts`) | `PASS` | 432/432 passed (100.0%). Every camera count 1 to 32 across HD, IP, and Wireless cleanly validates channel capacity, port scaling, and dynamic industrial routing with 0 errors. |
| **Layer 24: HDMI Multi-Option & Catalog Pricing Synchronization** | HDMI Suite (`test-hdmi-addons.ts`) & Matrix | `PASS` | 100% pass across all 6 HDMI lengths (1.5m to 20m), mutual length switching in store, dynamic DB price resolution, and 0 TS errors. |
| **Layer 25: Collapsible Category Accordion & Compact HDMI Selector UX** | TypeScript & Build Gates | `PASS` | 70% vertical scroll reduction, active status pills on collapsed rows, compact 6-length pill selector, 100% build pass. |
| **Layer 26: Wireless Storage Multiplication & Labor Suite** | Wireless Suite (`test-wireless-storage-multiplication.ts`) | `PASS` | 22/22 passed (100%). 1 card per camera, motion vs continuous bitrate calculation, Pro fitting ₹349 vs DIY ₹0 verified. |
| **Layer 27: Hardware Safety Cap & Speaker Toggle Verification** | Unit Suite & Type Engine | `PASS` | Strict capping at camera max supported capacity (`max_sd_capacity_gb || 128`), auto-tagging `speaker`/`2-way`/`audio`, 0 TS errors. |
| **Layer 28: Mega Compu World CP Plus Catalog Ingestion** | Database Sync Scripts | `PASS` | All 6 CP Plus cameras verified in Firestore with genuine technical specs, prices, and capabilities. |
| **Layer 29: Pro Builder Wireless Journey & Zero-Trust Pricing** | Pro Builder Suite (`test-pro-builder-wireless-journey.ts`) | `PASS` | 3-card technology selection, dynamic stepper badges, MicroSD storage prioritization, zero-connector/cable/power skip cards, Wireless Pro install (₹349) vs DIY (₹0), 0 TS errors, 100% build pass. |
| **Layer 30: Hybrid CCTV System Architecture & Server-Side Parity** | Hybrid Test Suite (`test-wireless-storage-multiplication.ts`) | `PASS` | 25/25 passed (100%). Sizing NVR/DVR to wiredCamCount, dual storage co-allocation (HDD + MicroSDs), zero transmission/cables/connectors for wireless cams, distinct wired vs wireless labor lines, 0 TS errors, 100% build pass. |
| **Layer 31: Competitor Price Match & Self-Healing Baseline Engine** | 7-Phase Lifecycle Suite (`test-full-customer-lifecycle-e2e.ts`) & Playwright | `PASS` | 7/7 phases passed (100%). Self-healing baseline quote generation (8 BOM items), on-card contextual anchor, Deal Desk counter-strategy, compliant WhatsApp pitch (zero prohibited warranty phrases), live PDF streaming (200 OK). |
| **Layer 32: Sales & CRM Lead Urgency & Omnichannel Alignment** | CRMEngine Unit Suite & Lead Ingestion Gates | `PASS` | 100% test pass on timeline-to-priority mapping (HOT 1h, WARM 24h, NURTURE 3d); 9-question WhatsApp bot state machine verified; Step 4 & Step 6 wizard urgency capture active; 1-click WhatsApp admin action; 0 build errors. |
| **Layer 33: Dual-Entity Beat Planning & Inactivity Tracking** | VRPTW Optimizer & Touchpoint Test Suite | `PASS` | 100% test pass on dual-entity route optimization (7.9km / 19m drive); inactivity aging verification (Active 2d, Due 11d, Overdue 26d, Never); auto-touchpoint logging verified; 0 build errors. |
| **Layer 34: Configuration Tool Catalog Normalization & Grouping** | Catalog Grouping Suite (`scripts/test-configuration-catalog.ts`) | `PASS` | 24/24 passed (100%). Storage type normalization (`Surveillance HDD` ➔ `Hard Disk`), all Budget Brand HDDs restored, numeric capacity ordering, 7 accessory sub-categories, 4G router unblocked, 0 build errors. |
| **Layer 35: Mixed Camera Bucket Customization & Real-Time System Composition** | Per-Bucket Specifications & Engine Isolation | `PASS` | 10/10 E2E customer/admin scenarios passed. Per-bucket independent feature toggling (24/7 Color, Audio Mic, 2-Way Talk, 360° PTZ), elimination of global feature leakage into bucket pricing calculations, real-time System Overview counter bar, immutable standard outdoor IP67 weatherproof & 4G SIM cellular badges. |
| **Layer 36: Educational Feature Guide, Specifications Checklist & Color Harmonization (WCAG 2.1 AA)** | UI/UX & Accessible Color Palette | `PASS` | TagGuideModal with layman real-world examples, SpecificationChecklistModal for customer guidance, unified brand blue pills (`bg-blue-600`), frosted badges, containerized spec chips, muted non-alarming trash buttons, full light & dark mode parity. |
| **Layer 37: Inventory-Driven Catalog Features & Non-Intrusive Modal UX** | Live Inventory Feature Filters & Unblocked UX | `PASS` | 100% build & Playwright pass (232/232 routes). Removed intrusive auto-popup on load; centered modals with zero bottom clipping; removed 5MP from feature checklists (handled exclusively by RESOLUTION selector); dynamic inventory filtering hides unsupported features per technology/brand (e.g., PTZ hidden in HD/IP, 2-Way hidden in IP); connection dropdown inventory gating. |
| **Layer 38: Mega Compu World Wholesale Catalog Ingestion & Real Brand Architecture** | Live Wholesale Inventory Sync & Precision Quotation Engine | `PASS` | Ingested and synchronized all 66 products from Mega Compu World distributor catalog across 6 brands: CP Plus (8 HD + 6 Wireless), Hikvision (15 HD), Prama (3 HD), A+ Products (7 HD Budget), Secureye (5 HD), Trueview (1 HD), and 18 matching DVRs (4/8/16Ch in 2MP & 5MP). Fixed 2-way audio false-positive JSON matching on HD analog cameras; normalized canonical brand keys (`aproducts` -> `A+ Products (Budget)`); verified 100% pass across all pricing permutations and Next.js production build (232/232 routes). |

---

### Milestone 38: Mega Compu World Wholesale Catalog Ingestion & Brand Architecture Alignment
- **Authentic Distributor Catalog Grounding:** Ingested the complete, verified inventory from Mega Compu World Jaipur (`megajaipur.com`), matching 100% of real market models, wholesale purchase costs, and vendor item codes across 6 major Indian CCTV brands:
  1. **CP Plus (8 HD + 6 Wireless):** TC24PL3C (₹1,236), DC24PL3C-L-V2 (₹1,500), TC24PL3C-L-V2 (₹1,620), DA24PL2C-SE (₹1,812), TA24PL2C-SE (₹1,886), DC51PL3C-L (₹1,944), TC51PL3C-L (₹2,014), CP-GPC-DA50PL2C-SE (₹2,222), plus 6 Wi-Fi & 4G PTZ smart cameras.
  2. **Hikvision (15 HD):** Full tiering from Eco 2MP (₹986), Regular with Audio (₹1,193 - ₹1,312), Smart Hybrid Dual Light (₹1,614 - ₹2,285), to ColorVu 3K (₹2,286 - ₹3,125).
  3. **Prama (3 HD):** 2MP Regular Dome (₹1,140), Audio Bullet (₹1,200), and Night Color Dome with Mic (₹1,424).
  4. **A+ Products (7 HD Budget):** Lowest-entry budget brand from ₹892 to ₹1,255, plus genuine 2.4MP AHD PTZ Camera (₹1,980).
  5. **Secureye (5 HD):** Falcon 5MP Regular Dome (₹1,020) and Phoenix 2MP/5MP Dual Light Hybrid cameras with Audio (₹1,114 - ₹1,416).
  6. **Trueview (1 HD):** 2MP Analog HD Mini Pan-Tilt Camera with Night Color & 2-Way Audio (₹1,450).
  7. **Recorders (18 DVRs/XVRs):** 4ch, 8ch, and 16ch DVRs for A+ Products, CP Plus, Hikvision, Prama, and Secureye in both 2MP and 5MP formats.
- **Strict Boolean Property Verification:** Eliminated substring false positives where `has_2way_audio: false` was incorrectly matched by `JSON.stringify().includes("2-way")`. Only genuine hardware capabilities (`has_two_way === true || has_speaker === true`) activate interactive feature pills.
- **Brand Architecture Expansion:** Added canonical mapping for `A+ Products (Budget)` (`aproducts`), allowing customers to explicitly compare entry-level budget quotations against national and international leaders (CP Plus, Hikvision, Prama, Secureye).
- **Resolution Filter Precision:** Guaranteed that HD Analog cameras strictly present `2MP (Full HD)` and `5MP (3K)` based on actual distributor availability, completely eliminating unfulfillable 3MP, 4MP, and 8MP analog options.

---


### Milestone 35: Per-Bucket Camera Customization & Zero Feature Leakage
- **Real-Life Camera Specialization:** In practical installations, customers require mixed capabilities across cameras (e.g. 2 outdoor bullet cameras with Color Night Vision and Audio Mic for street monitoring, 1 camera with 2-way talk and speaker for the front gate, and 1 wireless camera with 4G SIM where no Wi-Fi exists).
- **Per-Bucket Feature Customization:** Each camera bucket card independently manages its own active features (`color`, `mic`, `2-way`, `ptz`).
- **Feature Precedence in Pricing Engine:** `lib/pricing-engine.ts` updated to strictly prioritize per-bucket `req.features` over global selections, completely preventing feature leakage across unrelated camera buckets.
- **Real-Time System Overview:** Live breakdown bar dynamically aggregates hardware composition: Total cameras, Outdoor Weatherproof, Indoor, Color Night, Audio Mic, 2-Way Talk, 360° PTZ, 4G SIM, and Wi-Fi.
- **Immutable Standard Attributes:** IP67 Weatherproofing is permanently marked as standard on all outdoor cameras (`🌧️ IP67 Weatherproof Standard`), and 4G SIM is marked as built-in for 4G cameras (`🛰️ 4G SIM Built-in`).

### Milestone 36: Layman Feature Education & WCAG 2.1 AA Color Harmonization
- **Educational Layman Guide Modal (`TagGuideModal.tsx`):** Provides plain-language explanations, practical Indian daily real-life examples (e.g., cash counter audio proof, gate delivery package talk, intruder shirt color at 2 AM), and recommended installation locations for every feature tag.
- **System Specifications Checklist Modal (`SpecificationChecklistModal.tsx`):** Interactive modal allowing customers to inspect and refine their security checklist with real-time feedback.
- **Accessible & Harmonious Color Palette:**
  - Resolved neon green and saturated indigo contrast clashes by unifying active technology tabs under authoritative brand blue (`bg-blue-600 text-white`) with frosted semi-transparent badges (`bg-white/20 text-white border border-white/25`).
  - Standardized active brand filters with cohesive royal blue (`bg-blue-600 text-white`).
  - Replaced alarming red trash buttons with clean, non-distracting neutral icons (`text-zinc-400 hover:text-red-600`).
  - Containerized bucket specification notes into subtle, high-end specification pills.
  - Achieved full WCAG 2.1 AA contrast compliance across all customer screens in both Light Mode and Dark Mode.

---

### Milestone 37: Inventory-Driven Catalog Features & Non-Intrusive Modal UX
- **Non-Intrusive Customer Landing:** Removed auto-opening modal on quote load (`ConfiguratorView.tsx`). Customer immediately lands on their quotation catalog without blocking modals. Feature checklist is accessible on demand via the `⚙️ Checklist` button.
- **Responsive Centering & Viewport Safety:** Replaced bottom-anchored modal containers with centered, padded modal dialogs (`items-center justify-center max-h-[85vh] rounded-2xl sm:rounded-3xl`) ensuring headers, scrollable bodies, and footer action buttons are 100% visible on all viewports without clipping.
- **Resolution vs Feature Boundary Enforcement:** Removed `5MP (3K) Ultra High Clarity` from feature tags and checklists. Resolution is strictly managed by the `RESOLUTION` dropdown (2MP, 3MP, 4MP, 5MP, 8MP) per camera card. Added a dedicated educational resolution guide to `TagGuideModal.tsx`.
- **Dynamic Inventory-Driven Feature Filtering:**
  - Feature tags on camera cards (`getAvailableFeaturesForBucket`) only display capabilities actively supported in stock for that technology and brand.
  - Automatically hides `360° PTZ` on Standard HD and IP setups (where inventory has 0 PTZ cameras).
  - Automatically hides `2-Way Talk` on IP setups (where inventory has 0 two-way IP cameras).
  - Connection dropdown only offers Wi-Fi or 4G SIM if matching cameras exist in active inventory.
  - Auto-sanitizes bucket selections on technology/brand change, preventing orphaned or invalid feature tags from causing quote calculation failures.
  - `SpecificationChecklistModal` dynamically filters options with `availableFeatureTags`, never asking customers for features out of stock.

---

### Milestone 38: Mega Compu World Jaipur Hardware Catalog Verification
- **Verified 66 SKUs Ingested**: CP Plus (8 HD + 6 Wireless), Hikvision (15 HD), Prama (3 HD), A+ Products (7 HD Budget), Secureye (5 HD), Trueview (1 HD), and 18 matching DVRs (4/8/16ch) synced to Firestore with exact distributor PIDs and Item CDs.
- **Budget Brand Canonical Mapping**: Added `aproducts` canonical mapping to `"A+ Products (Budget)"` in `lib/brand-utils.ts` and `DynamicVariantGenerator.tsx`.
- **False-Positive 2-Way Talk Fix**: Replaced substring check with strict boolean evaluation (`p.has_two_way === true || p.has_speaker === true || p.has_2way_audio === true`), completely eliminating false 2-way talk tags on HD analog cameras.
- **Resolution Boundary Enforcement**: Cleanly constrained analog HD resolution dropdown to 2MP and 5MP (3K).

---

### Milestone 40: Mega Compu World Full Ecosystem Scan, Brand Tune-Up & 99-SKU Inventory Deployment
- **Deep Reference Website Scan (`megajaipur.com`)**: Scanned 740 links across 15 surveillance, storage, networking, cable, and accessory categories.
- **Brand & Vendor Normalization Tune-Up (`lib/brand-utils.ts`)**: Registered canonical mappings, search keys, and name inference for all distributor brands: `Hi-Focus`, `Securelink`, `EVM`, `Toshiba`, `Multybyte`, `Jascom`, `Bungees`, `Ranz`, `Cofe`, and `Comrack`.
- **Dynamic Variant Sequence Integration (`DynamicVariantGenerator.tsx`)**: Added `hifocus` into the standard brand tab order sequence.
- **Full Operational Inventory Seeded (99 Genuine SKUs)**:
  - 45 CCTV Cameras (HD Analog, IP Network, Wi-Fi PT, 4G SIM across CP Plus, Hikvision, Prama, A+ Products, Secureye, Trueview).
  - 21 Recorders (4Ch, 8Ch, 16Ch DVRs supporting 2MP and 5MP 3K).
  - 7 Storage Units (WD Purple 2TB/4TB/6TB, Seagate SkyHawk 1TB, SanDisk High Endurance 64GB/128GB, EVM 256GB).
  - 6 Power & Transmission Devices (CP Plus 8Ch SMPS, Securelink 8Ch SMPS, 16Ch Heavy SMPS, Securelink 4Ch/8Ch PoE Switches, Secureye 16Ch 250W PoE Switch).
  - 4 Cables (CP Plus 90m 3+1 pure copper, Budget 70m 3+1, EVM CAT6 305m pure copper, Prama CAT6 100m pure copper).
  - 3 Connectors (A+ Products BNC copper male, DC power pins, Smart Pro RJ45 modular plugs).
  - 6 HDMI Cables (Bungees/Ranz 1.5M, 3M, 5M, 10M, 15M, 20M with 4K support).
  - 3 Racks & Enclosures (Ranz 2U folding rack, Comrack 4U heavy rack, Securelink PVC rack with PDU).
  - 2 Network Devices (High-speed 4G SIM dual-antenna router, D-Link 5-Port Gigabit desktop switch).
  - 1 Surveillance Display (19-inch LED surveillance monitor).
  - 1 Accessory (Jascom 5x5x2 waterproof PVC junction box with copper thread).
- **Zero Mock Policy**: Every single product reflects genuine dealer wholesale pricing and vendor model codes from Mega Compu World.

---

### Milestone 39: Dual-Collection Product & Addon Deletion Integrity
- **Root Cause Resolution for Undeletable Inventory Items**: Fixed `/api/admin/products` endpoint which previously queried both `products` and `addons` collections for display, but only deleted from `products` during `DELETE`. Items in the `addons` collection (e.g. `ACC-WIFI-EXTENDER`) silently failed to delete while returning a 200 OK.
- **Dual-Collection Cascade Delete**: Updated `DELETE /api/admin/products` to delete from both `adminDb.collection("products")` and `adminDb.collection("addons")` in parallel and in batches.
- **Dual-Collection Update Support**: Updated `PATCH /api/admin/products` to seamlessly update records whether they reside in `products` or `addons`.
- **Row-Level Direct Delete UX (`ProductInventory.tsx`)**: Added a direct Trash icon (`Trash2`) with confirmation dialog in the `ACTIONS` column for every inventory row, eliminating the need to search for the checkbox and bulk header button for single items.
- **Modal-Level Delete UX (`AdminProductsPage`)**: Added a `Delete Product` button directly within the Edit Product modal footer for quick removal during inspection.
- **Orphan Cleaned**: Deleted `ACC-WIFI-EXTENDER` from the live database.

---

### Milestone 41: Multi-Tier Storage Architecture, Physical Law Inverse Scaling & Market Transparency Rules
- **Physical Law Inverse Scaling Parity ($Days \propto \frac{Capacity}{Cameras \times DailyGB}$)**: Centralized DVR/NVR hard drives are shared across all active wired cameras. Sizing correctly yields strictly inverse retention: 4 cameras on 500GB HDD = **~7 Days Backup**, while 8 cameras on 500GB HDD = **~3 Days Backup** (strictly halved, eliminating the ~6 days artifact caused by compound codec discounting). 8 cameras on 1TB HDD yields **~7 Days Backup**.
- **Surveillance Industry Bitrate & Codec Standardization**:
  - HD Analog (DVR): 17.5 GB/day (2MP), 26.0 GB/day (5MP), 45.0 GB/day (8MP).
  - IP Network (NVR): 14.0 GB/day (2MP H.265), 20.0 GB/day (5MP H.265), 35.0 GB/day (8MP H.265+).
  - Smart Wireless IP: 4.5 GB/day (2MP Smart Motion), 10.5 GB/day (2MP Continuous).
- **Smart Wireless Edge Storage Scaling**: Wireless cameras are edge recording devices with dedicated MicroSD card slots. Configurator BOM adds exactly 1 card per camera (`qty = camera_count`). Adding more wireless cameras does not reduce individual retention; UI displays `~X Days Backup per Camera · Dedicated MicroSD`.
- **Quality Tier Separation & Catalog Integrity**:
  - Standard branded packages (CP Plus, Hikvision, Dahua, Trueview) strictly pair **100% Genuine 24×7 Surveillance HDDs (Seagate SkyHawk / WD Purple)** with **3-Year Replacement Warranty** and Green Verification Badges.
  - Economy Match / Budget quotes pair Budget Brand HDDs (`HDD-BUD-500GB`, `HDD-BUD-1TB`, etc.) with transparent pricing.
- **Storage Transparency & Clean Advisory Architecture**: Eliminates visually bloated 10-line red warning blocks on package cards. Uses a clean amber banner under the Recording Retention selector with 1-click 1TB upgrade, a compact 1-line amber pill on cards (`⚠️ Basic 500GB HDD · ~X Days Backup · 1-Yr Local [Advisory ⓘ]`) matching genuine surveillance badge height, and an interactive `StorageAdvisoryModal.tsx` explaining competitor desktop HDD bundling tactics with direct 1-click upgrade.
- **100% Automated Test Suite (`scripts/test-storage-physics-parity.ts`)**: Validates inverse camera scaling, quality tiering, and dedicated MicroSD cards across HD, IP, and Wireless setups.

---



### Milestone 42: Sticky Technology & Brand Filter Bar on Quotation Packages Scroll
- **Direct Child Architecture for Unbounded Stickiness**: Re-architected DOM structure in DynamicVariantGenerator.tsx so the Filter Bar (Technology Switcher + Brand Selector) is an immediate child of the outer master container rather than being constrained within the configuration block.
- **Header Alignment & Z-Index Layering**: Placed at sticky top-14 md:top-20 z-30, aligning precisely beneath the 56px mobile header and 80px desktop header. Content cards scroll cleanly underneath the frosted blur backdrop (g-[#f5f5f7]/95 dark:bg-black/95 backdrop-blur-md).
- **Zero Scroll Friction**: Enables customers comparing 4-8 quotation package cards to switch between HD Analog, IP Network, and Smart Wireless, or filter by specific brands (A+ Products, CP Plus, Hikvision, etc.) directly with a single tap from anywhere on the page without scrolling back up.
- **Mobile Touch Preservation**: Preserved native horizontal touch momentum for brand pills (overflow-x-auto pb-0.5 scrollbar-none) with ultra-compact padding (~75px total height on mobile) ensuring maximum viewport area remains dedicated to quotation packages.

---


### Milestone 43: Bidirectional Dynamic Faceted Filtering & Inventory Search UX (`ProductInventory.tsx`)
- **Bidirectional Dynamic Cascading Dropdowns**:
  - When a Category is selected (e.g., `Storage (HDD & MicroSD)`), the Manufacturer dropdown dynamically filters to ONLY show brands that exist in that segment (`Budget Brand`, `EVM`, `SanDisk`, `Seagate`, `Toshiba`, `WD`), preventing empty dead ends.
  - Vice versa: When a Manufacturer is selected (e.g., `WD`), the Category dropdown dynamically filters to ONLY show segments where that brand has active products (`Storage`). Selecting `Comrack` displays only `Racks`. Selecting `CP Plus` displays `Cameras (11)`, `Recorders (6)`, and `Power Device (3)`.
- **Bidirectional Auto-Reset Safeguard**:
  - Automatically resets incompatible filters to `"all"` without trapping the user in empty "0 products found" views. E.g., switching from `Cameras` (with `Hikvision` selected) to `Storage` immediately resets Manufacturer to `All Manufacturers` since Hikvision does not produce storage.
- **Live Dynamic SKU Count Badges**:
  - Every option displays real-time matching product counts reflecting active cross-filters (e.g. `WD (5)`, `Seagate (6)`, `Storage (20)`).
- **Active Filter Chips Bar & 1-Click Clear**:
  - Visual dismissible chips for active filters (`Search`, `Segment`, `Manufacturer`, `Technology`, `Status`) with direct `✕` dismissal and a `Clear All Filters` button.
- **Smart Section Visibility**:
  - Core CCTV Hardware and Optional Upgrades headers only appear when their respective categories contain matching products, cleanly falling back to a centered empty-state card with a `Reset Filters` action when 0 products match.
- **100% Verification Suite (`scripts/test-dynamic-filter-cascade.ts`)**:
  - Automated tests verify category-to-brand isolation, brand-to-category isolation, technology cross-matching, and auto-reset triggers across all 126 products.

---


### Milestone 44: Interactive Column Header Sorting & High-Contrast Visual Status System (`ProductInventory.tsx`)
- **Resolved Invisible / Bare Status Switch Flaw**:
  - Replaced the unstyled, low-contrast toggle (which lacked Tailwind v4 theme definitions and text labels) with an accessible, high-contrast, dual-element status component.
  - **Active State**: High-contrast emerald green toggle switch (`bg-emerald-500 border-emerald-600` with smooth white knob) paired with an explicit badge: `🟢 Active` (`bg-emerald-50 text-emerald-700 border-emerald-200` with pulsing dot).
  - **Inactive State**: Neutral zinc gray switch (`bg-zinc-200 border-zinc-300`) paired with an explicit badge: `⚪ Inactive` (`bg-zinc-100 text-zinc-500 border-zinc-200`).
  - **Interactive Clarity**: Dynamic hover tooltips clarify action before clicking (`"Active in Store & Quotes (Click to Deactivate)"` vs `"Inactive / Archived (Click to Activate)"`), eliminating guesswork.
- **Interactive Multi-Column Header Sorting**:
  - Clickable sort headers on `SKU / Information`, `Manufacturer`, `Stock`, `Pricing`, and `Status`.
  - Directional icons: Displays active `ArrowUp` (Ascending) / `ArrowDown` (Descending) when active, and subtle `ArrowUpDown` on hover when inactive.
  - Natural cycling: `Default` ➔ `Ascending` ➔ `Descending` ➔ `Default` (3-click cycle).
- **Synchronized Sort By Toolbar Dropdown**:
  - Integrated 6th dropdown in the inventory filters toolbar for rapid global sorting: Default Catalog, Price Low to High, Price High to Low, Name A-Z, Name Z-A, Brand A-Z, Stock Highest First, Status Active First.
  - Two-way sync: Selecting from the toolbar immediately updates table sorting and header arrows; clicking table headers immediately reflects in the toolbar dropdown.
- **Active Filter Sort Chip**:
  - Active sort states render as a dismissible badge in the Active Filters bar with 1-click removal (`✕`) and `Clear All` reset.

---

### Milestone 45: Full Quotation Engine QA & Price Reconciliation Workbook
- **Comprehensive 238-Permutation Test Matrix (100% Pass Rate)**:
  - Validated pricing and bill-of-materials generation across 238 combinations in `scripts/Quotation_Test_Matrix_Executed.csv` and `Quotation_Test_Matrix_Executed.xlsx`.
  - Rigorously tested across HD Analog, IP Network, Smart Wireless, and 4G Cellular setups from 1 to 16 cameras across CP Plus, Hikvision, Dahua, Prama, A+ Products, Trueview, and Budget tiers.
  - Automated verification of recorder channel sizing (4Ch, 8Ch, 16Ch), resolution ceilings ($\text{recMaxMP} \ge \text{targetMaxMP}$), multi-PoE switches with Gigabit uplinks, power supply tie-breaking, and dedicated MicroSD vs centralized HDD allocation.
- **Master Pricing Reconciliation & Audit Workbook**:
  - Generated `Quotation_Engine_QA_and_Price_Reconciliation_Workbook.xlsx` (and CSV companion) compiling full end-to-end pricing and margin analysis.
  - Reconciled wholesale dealer purchase rates from Mega Compu World against active platform seed costs across all 61 standard hardware items.
  - Verified 100% margin alignment for cameras (15-30%), recorders (15%), storage (15%), power supplies (25%), cables (40%), connectors/junction boxes (40%), and racks/accessories.
  - Validated installation and service rates: ₹0 markup labor rules, fitting-only rates, site preparation flags, and AMC maintenance plans.

---

### Milestone 46: Statutory GST-Inclusive Pricing Standard ("GST Paid Master Invariant") & Intrinsic Bullet Weatherproofing
- **GST Paid Master Invariant**:
  - Catalog acquisition costs (`base_cost`) and customer retail unit prices (`unit_price`) are strictly GST-paid (18% GST inclusive) as defined in `BUSINESS_RULES.md` § 3.0.
  - Eliminates tax confusion, prevents double-taxation artifacts, and guarantees 100% statutory transparency across web, PDF quotes, and booking receipts.
  - Standardized reverse-calculation for all quotation line items, tokens, and tax invoices:
    $$\text{Taxable Subtotal} = \frac{\text{Gross Total}}{1 + \text{gst\_rate}}$$
    $$\text{GST Amount} = \text{Gross Total} - \text{Taxable Subtotal}$$
- **HSN & SAC Code Architecture**:
  - Formalized mandatory HSN (Goods) and SAC (Services) codes across all products, addons, quote snapshots, and PDF invoices:
    - CCTV Cameras & Webcams: `8525` (18% GST)
    - DVR & NVR Recorders: `8521` (18% GST)
    - Storage (Surveillance HDDs & MicroSD Cards): `8471` (18% GST)
    - Power Supplies, Adapters & PoE Switches: `8504` (18% GST)
    - 3+1 Coaxial & CAT6 Network Cables: `8544` (18% GST)
    - Connectors, Junction Boxes & Racks: `8536` / `8538` (18% GST)
    - Professional Installation, Fitting & AMC Services: `9987` (18% GST)
- **Admin UI & Bulk Import/Export Tax Integration**:
  - Added editable `HSN Code` and `GST Rate (%)` fields in Admin Product Add/Edit modals (`app/(admin)/admin/products/page.tsx`).
  - Added HSN/SAC and GST Rate fields to Addon Modal (`components/admin/AddonModal.tsx`) and Addons list (`components/admin/AddonsClient.tsx`).
  - Integrated `hsn_code` and `gst_rate` into CSV export, export template, and bulk import parser (`BulkOperationsClient.tsx`, `ReviewImportModal.tsx`, `export/route.ts`).
  - Inventory Dashboard (`app/(admin)/admin/inventory/page.tsx`) displays explicit `[GST Paid]` indicator on stock valuation and unit cost column.
- **Tax Invoice PDF Parity (`lib/pdf/invoice-pdf.tsx`)**:
  - Rendered official GST Tax Invoice with dedicated `HSN/SAC` column, itemized `Taxable Value`, `GST Rate`, and statutory `CGST (9%) + SGST (9%)` / `IGST (18%)` tax schedule.
- **Intrinsic Bullet Weatherproofing Invariant (`lib/product-resolver.ts`)**:
  - Standardized that all bullet form factor cameras (`form === 'bullet'`) are intrinsically outdoor and weatherproofed unless specifically marked indoor, preventing outdoor camera allocation failures.
- **Storage Advisory Modal & Smart Wireless Storage UX (`components/quotation/StorageAdvisoryModal.tsx`)**:
  - Introduced interactive storage advisory dialog clarifying physical law retention duration, continuous vs smart motion recording, and dedicated edge MicroSD cards.

---

### Milestone 47: 15-Day Storage Retention Calibration & Branded Surveillance HDD Inventory Restoration
- **Dual Root Cause Resolution**:
  - **Inventory Restoration**: Reactivated `hdd_1tb_seagate_skyhawk` (which was set to `is_active: false` in Firestore) and verified `hdd_1tb_wd_purple` in active Firestore catalog. Restored 1TB genuine branded surveillance drives so branded packages (Hikvision, CP Plus, Dahua, Prama, Secureye) no longer fall back to 2TB Toshiba S300 drives.
  - **Modern H.265 Bitrate Alignment**: Aligned HD Analog 2MP daily bitrate baseline from legacy 17.5 GB/day to 14.0 GB/day in `lib/pricing-engine.ts`, `lib/configuration-engine.ts`, and `DynamicVariantGenerator.tsx` to match modern DVR compression (Hikvision TurboHD H.265 Pro+, CP Plus Cosmic H.265+).
  - **Target Capacity Mapping & Tolerance**: Implemented explicit `target_storage_tb: 1.0` passing on catalog retention pills (`15 Days (1TB) Rec.`) and a 15% engineering tolerance threshold in `pricing-engine.ts`.
- **Cross-Brand Price Verification (4 Cameras, 15 Days)**:
  - Hikvision 2MP HD Package: ₹23,625 (reduced from ₹34,203) with Seagate SkyHawk 1TB Surveillance HDD.
  - CP Plus 2MP HD Package: ₹22,487 with Seagate SkyHawk 1TB.
  - Dahua 2MP HD Package: ₹18,924 with Seagate SkyHawk 1TB.
  - Prama 2MP HD Package: ₹19,582 with Seagate SkyHawk 1TB.
  - Secureye 2MP HD Package: ₹18,093 with Seagate SkyHawk 1TB.
  - A+ Products (Budget): ₹17,045 with 1TB HDD.
- **Automated Storage Test Suite**:
  - 100% pass rate in `test-storage-physics-parity.ts` across HD, IP, and Wireless configurations.

---

### Milestone 49: Hybrid Camera Breakdown Mathematical Parity Invariant
- **Root Cause & Visual Defect Identified**:
  - In a Hybrid setup (Wired + Wireless), the wizard's Step 4 Security Blueprint badge displayed `📹 74 Cameras (36 Out + 2 In)` when 36 outdoor, 2 indoor, and 36 wireless cameras were selected.
  - The breakdown only evaluated `outdoor_camera_count` and `indoor_camera_count`, leaving 36 wireless cameras omitted from the badge text, resulting in a mathematical contradiction ($36 + 2 = 38 \neq 74$).
- **Universal Dynamic Breakdown Implementation**:
  - **Wizard Blueprint Badge (`WizardClientV2.tsx`)**:
    - Replaced hardcoded `({req.outdoor_camera_count ?? 2} Out + {req.indoor_camera_count ?? 2} In)` with a dynamic evaluator checking `isPureWireless`, `outCount`, `inCount`, and `wifiCount`.
    - Produces `📹 74 Cameras (36 Out + 2 In + 36 Wireless)`, achieving 100% mathematical parity.
    - Preserves standard wired display (`📹 4 Cameras (2 Out + 2 In)`) and pure wireless display (`📹 2 Cameras (2 Wireless)`).
  - **WhatsApp Quote Dispatch (`lib/whatsapp/quote-dispatch.ts`)**:
    - Centralized `formatCameraBreakdown(selection)` helper used in both Price Summary card (line 94) and Brand Variations message (line 226) to include wireless cameras whenever present.
  - **Quotation Specification Checklist Modal (`SpecificationChecklistModal.tsx`)**:
    - Added `wifiCount` prop from `ConfiguratorView.tsx` to display `36 Outdoor + 2 Indoor + 36 Wireless` in the Setup Assistant header.
- **Automated Verification**:
  - Created `scripts/test-camera-breakdown-parity.ts` testing hybrid, pure wired, all-outdoor, all-indoor, and pure wireless configurations (100% pass rate).
  - TypeScript compilation check (`npx tsc --noEmit`) verified clean with 0 errors.

---

### Milestone 48: Multi-Variation Catalog Architecture & Compact Dropdown Filter Toolbar
- **Lowest-Priced Entry Point & Multi-Variation Generation**:
  - Resolved root cause of high initial branded quotes (Hikvision displaying ColorVu at ₹24,451 instead of entry price):
  - Catalog now generates both **Standard IR Night Vision (Lowest Price)** and **24/7 ColorVu (Full Color)** side-by-side for brands that support both sensor types.
  - Standard IR quotes select the cheapest active IR camera (e.g. Hikvision DS-2CE76D0T @ ₹1,193) via `sensor_preference: "standard_ir"`, resulting in a true entry price of **₹18,938** for a complete 4-camera setup with 1TB Seagate SkyHawk HDD.
  - ColorVu quotes select the full-color sensor (e.g. Hikvision DS-2CE70DF0T @ ₹2,286) via `sensor_preference: "colorvu"`, providing clarity in pitch darkness at **₹24,097**.
- **Prominent Key Difference Badging (`key_difference`)**:
  - Every package card features a distinct badge highlighting the exact hardware differentiator that explains the price difference (e.g., `🌙 Standard IR Night Vision · Lowest Entry Price` vs `🌈 24/7 ColorVu Full Color · Daytime Clarity in Darkness`).
- **Compact Dropdown Filter Toolbar**:
  - Replaced legacy scrolling button strips with a clean, responsive 2x2 (mobile) / 4-column (desktop) toolbar:
    1. **Camera Brand:** `All Brands`, `CP Plus`, `Hikvision`, `Dahua`, `Prama`, `Secureye`, `A+ Products (Budget)`.
    2. **Recording Retention:** `15 Days (1TB) Rec.`, `7 Days (500GB Economy)`, `30 Days (2TB Extended)`, `60 Days (4TB Heavy)`.
    3. **Storage Drive Brand:** `All Storage Brands`, `Seagate SkyHawk (3-Yr)`, `WD Purple (3-Yr)`, `Toshiba S300 (3-Yr)`, `Budget Brand (1-Yr Economy)`.
    4. **Night Vision / Sensor:** `All Sensors (IR & Color)`, `🌙 Standard IR (Lowest Price)`, `🌈 24/7 ColorVu (Full Color)`.
  - Added live package count display (`Showing N quotation variations available`) and an instant `[Reset Filters ✕]` button when any non-default filter is applied.
- **Engine Hardening (`pricing-engine.ts`)**:
  - Implemented `sensor_preference` filtering (`"standard_ir"` vs `"colorvu"`) in `resolveCamera`.
  - Implemented `preferred_storage_brand` selection (`"seagate"`, `"wd"`, `"toshiba"`, `"budget"`) in `resolveHDD` with fallback logic and budget drive isolation.
- **Elimination of Inaccurate "Unified Mobile App" Banner**:
  - Completely purged the misleading banner from `DynamicVariantGenerator.tsx` that claimed wired DVR and wireless cameras stream in a single mobile app (Hik-Connect / gCMOB).
  - Aligned catalog messaging with technical reality (e.g. CP Plus uses gCMOB for DVR and EzyKam+ for Wi-Fi; 4G SIM cameras run on cellular cloud endpoints), preventing customer complaints and warranty disputes.
- **Verification**:
  - 100% pass rate in `test-storage-physics-parity.ts`.
  - 100% clean TypeScript build (`npx tsc --noEmit` exited 0).

---

### Milestone 50: WhatsApp Omnichannel Conversational Engine, 11-Language Localization & Resilience Architecture
- **11-Language First-Touch Selection**:
  - Welcomes customer on their very first interaction in both English and Hindi.
  - Numbered selection menu (1 to 11) for all 11 Indian languages (`en`, `hi`, `mr`, `gu`, `ta`, `te`, `kn`, `bn`, `ml`, `pa`, `or`).
  - Strict colloquial laymen terms without jargon or synthetic words (e.g. "घर / फ्लैट", "दुकान / ऑफिस", "तार वाला", "बिना तार").
- **Hybrid Quick-Tap Buttons + Direct Numeric Reply**:
  - For all camera quantity prompts (Outdoor Bullets, Indoor Domes, Wireless Cameras), provides 3 quick-tap buttons (`[ 2 ]`, `[ 4 ]`, `[ 8 ]`) while simultaneously accepting direct typed integers (`1` to `32`).
  - Customer can type "4", "6", or "12" and the bot immediately parses the integer without forcing button clicks.
- **Media & Off-Topic Input Resilience**:
  - When customer sends non-related media (photos, voice notes, stickers, documents) or off-topic text, the engine prevents journey breakdown. It politely acknowledges the media (explaining site survey verification) and re-prompts the pending step.
- **Data Protection & Normalization**:
  - Name protection filter intercepts pricing queries ("rate kya hai", "cctv price") and re-prompts for real customer name.
  - Accidental 10-digit mobile number typed at pincode step is captured and 6-digit pincode re-prompted.
  - Universal phone normalization converts all formats to canonical `91XXXXXXXXXX`.
- **Zero `[object Object]` Invariant**:
  - Sanitized error extraction across all website portals and webhook responses.

---

### Milestone 51: Option A 2-Button Camera Summary & Non-Destructive Quantity Editor (`ASK_CAMERA_EDIT_CHOICE`)
- **Option A (2-Button Checkpoint)**:
  - Replaced legacy `[ ➕ Add Wireless ]` with `[ ✏️ Change Qty ]` (`wf_change_qty`).
  - Meta API compliance: 2 spacious action buttons complying with $\le 3$ button and $\le 20$ character limits:
    - `[ ✅ Done (Proceed) ]` (`wf_done_proceed`)
    - `[ ✏️ Change Qty ]` (`wf_change_qty`)
  - All 11 languages localized for both buttons.
- **Non-Destructive Quantity Modifier (`ASK_CAMERA_EDIT_CHOICE`)**:
  - Tapping `[ ✏️ Change Qty ]` opens an interactive camera editor without wiping customer session data (Language, Property Type, Pincode preserved).
  - Wired/hybrid systems present a 3-button breakdown showing existing counts (`🌧️ Outdoor Bullets`, `🏠 Indoor Domes`, `📶 Wireless Cams`).
  - Pure wireless systems jump straight to the wireless model count prompt.
  - Updates counts dynamically and returns seamlessly to confirmation.
- **Production Verification**:
  - 12/12 automated resilience tests passed (`scripts/test-whatsapp-resilience.ts`).
  - Live deployment verified on `https://cctvquotation.com` via Vercel.

---

### Milestone 52: Cross-Flow Error Sanitization, MSG91 OTP Pipeline Hardening & Cross-Device WhatsApp App Launcher
- **Date:** November 11, 2026 | **Status:** `VERIFIED & DEPLOYED`
- **Client & Server Error Sanitization (`[object Object]` Elimination):**
  - Standardized UI error extraction through `extractErrorMessage()` (`lib/utils.ts`) across Customer Wizard (`WizardClientV2.tsx`), Pro Builder (`ProBuilderClient.tsx`), Configurator (`ConfiguratorView.tsx`), Customer Portal/Login (`CustomerLoginClient.tsx`, `TrackBookingModal.tsx`, `SupportPanel.tsx`), Early OTP Gate (`PhoneCaptureModal.tsx`), Checkout/Survey (`SiteVisitBookingModal.tsx`, `PaymentSuccessClient.tsx`, `PaymentStagesWidget.tsx`, `BookSurveyClient.tsx`), Refer & Earn (`ReferAndEarnClient.tsx`), Pincode Gate (`PincodeWidget.tsx`), Installer/Partner logins (`InstallerLoginClient.tsx`, `PartnerLoginClient.tsx`), and Operations (`SiteSurveyRevisionModal.tsx`).
- **MSG91 WhatsApp OTP Dispatch & Vercel Env Hygiene:**
  - Created `lib/env-utils.ts` (`cleanEnvVar()`, `cleanPhoneEnvVar()`) to strip trailing `\r`/`\n`/whitespace and non-digit characters across server and client boundaries.
  - Cleaned 7 CRLF-corrupted Vercel Production environment variables (`MSG91_WHATSAPP_NUMBER`, `WHATSAPP_PROVIDER`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_META_PIXEL_ID`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `GEMINI_API_KEY`).
  - Unified OTP dispatch via `Msg91WhatsAppProvider.sendOtpTemplate()` (`lib/whatsapp/msg91-provider.ts`) with non-JSON-safe `response.text()` parsing across `/api/auth/otp/whatsapp`, `/api/auth/otp/sms`, and `/api/refer-and-earn/otp/send`, plus uniform env sanitization in `bot-engine.ts`, `quote-dispatch.ts`, `app/wa/[code]/route.ts`, `notification-service.ts`, Razorpay webhook, email OTP routes, `budget-tracker.ts`, and `admin/geo/tehsils/route.ts`.
- **Cross-Device `"Open WhatsApp App"` Deep-Link Fix:**
  - Updated `lib/whatsapp.ts` and `components/shared/WhatsAppOtpNotice.tsx` to replace bare `whatsapp://` and browser-blocked hidden `<iframe>` launches with a native synchronous `<a href="whatsapp://send?phone=...">` anchor (without `target="_blank"`), added iPadOS touch detection (`MacIntel` with `maxTouchPoints > 1`), and rendered device-adaptive fallback links (`https://wa.me/...` on mobile, `https://web.whatsapp.com` on desktop post-mount) with a non-blocking hint after `1600ms`.

### Milestone 53: Deal Profitability Waterfall Audit, Services Accounting & Operating Overheads
- **Root-Cause Classification Fix (`lib/quotation-profit.ts`):** Reordered `classifyItem()` precedence so explicit/canonical Services (`service`, `amc_*`, `promo_free_amc`, word-boundary `/\bcommissions?\b/` and `/\bamc\b/`) evaluate before Cables (`cab-`, `3+1`, `cable`, `wire`) and Accessories/Junction Boxes (`/\b(junction|pvc|weatherproof)\s*box\b/`, `mount`) before Cameras, preventing cable runs and PVC junction boxes from inflating camera counts and protecting `"Installation & Commissioning"` inside Services.
- **Services Bucket Commission & AMC Accounting (`lib/commission.ts`, `lib/quotation-profit.ts`, `lib/profit-context.ts`):** Added `resolvePromoterCommission()` (with positive-value guard on promoter incentive overrides before `commission_slabs` / tier / global fallback) and wired B2B promoter commissions, B2C ₹500 referrals, salesperson commissions, Paid AMC plans + deduplicated `amc_subscriptions`/`amc_contracts`, and complimentary Promo Free AMC PM visit reserves (`2 * cost_labor_visit_charge`) directly into the **Services** bucket—without manufacturing phantom commissions on manual admin discounts lacking a referral code.
- **Operating Overheads & True Net Pocket Profit (`lib/cached-settings.ts`, `lib/pricing-engine.ts`, `QuotationProfitBreakupCard.tsx`, `ProfitabilityAnalyticsClient.tsx`):** Added configurable reserves (`amc_fulfillment_cost_percent`, `payment_gateway_fee_percent`, `warranty_reserve_percent`, `logistics_consumables_per_job`, `travel_fee_payout_percent`), actual Razorpay MDR fees (`payment_history.razorpay_fee`, ₹0 on cash/bank transfer/direct UPI), fixed zeroed `labor_cost_margin_percent` fallback, and surfaced the **True Net Pocket Profit** waterfall across CRM Lead Deals and `/admin/analytics/profitability` without changing customer-facing GST-inclusive totals.
- **Verified Checks:** `npm run build` (exit 0; 226 routes), `npx tsx scripts/verify-profit-waterfall.ts` (6/6 assertions PASS), and Playwright `tests/unit-commission-engine.spec.ts` + `tests/unit-profitability-engine.spec.ts` (11/11 PASS, 0 skipped/failed).

---

## 4. Operational Maintenance & Ongoing Runbooks

1. **Disaster Recovery & Backup:** [`docs/devops/disaster-recovery.md`](file:///c:/Users/hp/Documents/TEAM%20Website/secure-easy/docs/devops/disaster-recovery.md) and [`runbooks/BACKUP_RESTORE.md`](file:///c:/Users/hp/Documents/TEAM%20Website/secure-easy/runbooks/BACKUP_RESTORE.md).
2. **Incident Response:** [`docs/devops/incident-response.md`](file:///c:/Users/hp/Documents/TEAM%20Website/secure-easy/docs/devops/incident-response.md).
3. **Master Business & Pricing Rules:** [`BUSINESS_RULES.md`](file:///c:/Users/hp/Documents/TEAM%20Website/secure-easy/BUSINESS_RULES.md).
