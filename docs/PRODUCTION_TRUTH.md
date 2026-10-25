# Production Truth & Credential Tracking

> **Last Updated:** October 13, 2026  
> **Production Domain:** `https://cctvquotation.com`  
> **Vercel Project:** `secure-easy` / `team-cctv-platform`  
> **Rule:** Never mark a credential as `ROTATED` or `VERIFIED` based solely on local files. Evidence from the actual deployment/environment is mandatory.

---

## 1. Credential Lifecycle Matrix

| Credential / Variable | Purpose | Environment Scope | Status | Restrictions / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Backend service account DB access | Server-only (`.env.local` / Vercel) | `ROTATED & SECURE` | Purged from Git history; project: `team-cctv-live-8294`. |
| `FIREBASE_CLIENT_EMAIL` | Service account identifier | Server-only | `VERIFIED` | Server-side Firestore operations. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web Client Auth/DB | Public (Client) | `ACTIVE` | Restricted to `cctvquotation.com` & authorized origins. |
| `NEXT_PUBLIC_MAPPLS_API_KEY` | Mappls (MapmyIndia) Web SDK Map Render | Public (Client) | `ACTIVE` | Key managed via Vercel env vars (`hudvht...`). |
| `MAPPLS_CLIENT_ID` | Mappls OAuth Token Generation | Server-only | `ACTIVE` | Server-side boundary and geocoding queries. |
| `MAPPLS_CLIENT_SECRET` | Mappls OAuth Secret | Server-only | `ACTIVE` | Kept strictly server-side in Vercel. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`| Secondary fallback mapping | Public (Client) | `ACTIVE` | Fallback geocoder restricted by HTTP referrer. |
| `RAZORPAY_KEY_ID` | Payment gateway client identifier | Public (Client) | `ACTIVE` | Linked to active payment modal. |
| `RAZORPAY_KEY_SECRET` | Payment order creation & verification | Server-only | `ACTIVE` | Kept strictly server-side (no `NEXT_PUBLIC_`). |
| `RAZORPAY_WEBHOOK_SECRET` | HMAC signature verification | Server-only | `ACTIVE` | Verified against incoming webhooks; fallback API attached. |

---

## 2. Security Audits & Remediation Log

### 2.1 Git History Scrub (Completed)
- Historical commits were sanitized using `git-filter-repo` to permanently remove exposed credentials and test helper scripts.
- Verified zero raw private keys in git commit trees.

### 2.2 Endpoint & Route Hardening
- Hardcoded OTPs and testing bypass tokens (e.g. `9999999999` OTP bypass) removed from production authentication flows.
- Strict Content Security Policy (CSP) and HTTP Strict Transport Security (HSTS) enforced across all Next.js response headers.
- Route isolation: `/admin`, `/staff`, and `/installer` guarded by server-side session checks (`verifySession`). Public customer logins via `/portal` receive zero administrative elevation.

---

## 3. Production Mutating Guardrails
1. **Zero Destructive Deletes:** Production collections (`quotes`, `leads`, `products`, `users`, `audit_logs`) are append-only or soft-delete only.
2. **Strict Server Authority:** Client pricing calculations are rejected; all final quotes must compute through server pricing engines.
3. **Environment Management:** All sensitive API keys and secrets must be updated via the Vercel CLI / Dashboard, never committed to source control.
4. **Hardware Resolution Compatibility & Best-Price Tie-Break:** Recorders (DVR/NVR) must strictly satisfy $\text{recMaxMP} \ge \max(\text{Camera MP})$. When a higher-resolution recorder is priced lower than a lower-resolution recorder, the pricing engine selects the cheaper unit to optimize customer savings while ensuring full technical compatibility.
5. **MicroSD Hardware Safety Cap:** MicroSD cards for Wi-Fi cameras must strictly be capped by `cameraProduct?.max_sd_capacity_gb || 128` to prevent quoting incompatible oversized cards.
6. **Wi-Fi Connectivity Invariant (Option B):** Wi-Fi camera setups must verify broadband Wi-Fi availability on site, automatically injecting a 4G/5G SIM Wi-Fi router if Wi-Fi is absent.
7. **Bundled Solar CCTV Packaging:** Solar CCTV cameras are complete standalone systems with bundled solar panels; separate solar panel line items are prohibited.
8. **Smart Pay Invariant (GST Section 31):** Quotes paid in full with 2% discount must issue an immutable **TAX INVOICE** (not Advance Receipt) with `amountDue: 0`, `PAID` watermark badge, and discount itemization.
9. **GST Section 15 & 34 Invariant (Change Orders):** Never overwrite or modify a settled Tax Invoice. Any on-site extra materials or work discovered during installation must be billed via an official **Supplementary Tax Invoice (`INV-xxxx-S1`)** tied to a Change Order entity (`CO-xxxx`).
10. **Admin-Gated Cash Collection Guardrail:** Cash collection on site by installers or delivery staff is strictly disabled by default. The cash payment option is active only when `cash_collection_approved: true` has been authorized by Admin staff. Backend rejects unauthorized cash submissions with HTTP 403.
11. **On-Screen Dynamic UPI QR Standard:** Field collection for delivery handovers (90%), installation handovers (10%), and on-site change orders defaults to an on-screen dynamic Razorpay/UPI QR on the technician's mobile screen (`DynamicOnScreenQRCodeModal`), verified via polling in 2-3s with Web Audio chime and automated WhatsApp receipt delivery.

---

## 4. Catalog Integrity & Test Hygiene Guardrails
1. **Zero Fake Products Policy:**
   - No mock/placeholder SKUs (e.g. `"Test Camera"`, `"TEST-CAM"`) are permitted in the catalog or quotation pipeline.
   - All active products must represent genuine hardware from verified OEMs (CP Plus, Hikvision, Dahua, TP-Link, SanDisk).
   - Any test suite that exercises quoting, invoicing, or inventory must use genuine catalog SKUs.
2. **Mandatory Automated Test Teardown (`afterAll`):**
   - Any test creating transient fixtures (`QT-E2E-...`, `L_REV_...`, `INV-TEST-...`) must include an `afterAll()` hook that automatically cleans up its created entities.
3. **Admin View Separation:**
   - Synthetic test records (`is_test: true`, `QT-E2E-...`, `9999999999`) are hidden by default in the Admin Leads table to maintain clean staff visibility.
4. **Day-0 UAT Reset:**
   - Prior to general commercial traffic, execute `npm run reset:uat` (`scripts/reset-uat.ts`) or call `/api/admin/cleanup-test-data` to purge development fixtures.

---

## 5. Administrative Geo Hierarchy & Serviceability Truth
1. **4-Tier Territorial Model:**
   - Hierarchy: `State` → `District` → `Tehsil` → `PINCODE (Active vs Inactive)`.
   - Core launch: Urban Jaipur (`302001`, `302012`, `302017`, `302029`, etc.) is operational for immediate 24-48h site installation.
   - Peripheral rural tehsils (`Chomu`, `Chaksu`, `Bassi`, `Kotputli`) and other districts (`Jodhpur`, `Kota`, `Ajmer`, `New Delhi`, `Nashik`) remain `inactive` by default until installer hubs are appointed.
2. **Hierarchical Serviceability Resolution:**
   - Route `/api/pincode/[pin]` checks Firestore collection `geo_pincodes` overrides and static baseline hierarchy in `lib/geo/geoHierarchy.ts`.
   - Blanket district-wide checks are prohibited; individual PIN status dictates `served: true/false`.
   - Lookups and leads are enriched with resolved `tehsil`, `district`, and `state`.
3. **Regional Expansion Hub (`/admin/expansion`):**
   - Managed via `ExpansionClient.tsx` with single-PIN toggle switches and bulk Tehsil activation actions backed by `/api/admin/geo/hierarchy`.

---

## 6. Map Canvas Architecture & Tile Performance
1. **Modal Invalidation Architecture:**
   - Next.js modal transitions mount DOM elements while unmeasured (`clientWidth = 0`).
   - `MapViewController` in `components/admin/CoverageMapCanvas.tsx` registers an automated `ResizeObserver` on the map container and fires staggered `map.invalidateSize()` calls (0ms, 100ms, 300ms, 700ms) to guarantee instant tile rasterization without gray canvas freezing.
2. **Google Maps & High-Performance Tile Provider:**
   - Powered directly by the configured `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
   - Default roadmap: `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${googleKey}` with subdomains `["0", "1", "2", "3"]`.
   - Admin-selectable basemaps: Google Roads, Google Satellite Hybrid (`lyrs=y`), and OpenStreetMap (`osm`).
   - 100% clean cartography with zero watermarks (completely purged CartoDB), authentic Indian highway/colony labels, and Google global edge CDN caching.
3. **Delivery Micro-Hub Halos & Territory Tools:**
   - 850m micro-service radii halos default to visible, but can be toggled OFF with 1 click via the `Halos: ON/OFF` button.
   - Closed polygon territories can be generated in 1 click from covered hubs via `⚡ Auto-Trace Territory` using monotone chain convex hull computation (`lib/geo/pincodePolygons.ts`).
4. **Universal Full Map View Architecture:**
   - Supported across all map components:
     - `CoverageAreaMapEditor`: 1-click 'Full Map View' expanding the canvas to a panoramic workspace (`fixed inset-0 z-[9999]`) with Escape key listener and exit banner.
     - Coverage Zone Modal (`SalespersonsClient`): Maximize modal header button expanding dialog to `97vw x 96vh` with dynamic `560px` canvas.
     - Territory Boundary Matrix (`TerritoryMatrix`): 1-click 'Full Map View' button expanding the Mappls district boundary to `100vw x 100vh`.
     - `MapplsBoundaryMap`: Built-in full-screen toggle icon in the floating legend for all embedded views.
     - `LeafletMapFallback`: Upgraded to Google Maps tile infrastructure.
5. **Delivery Hub Footprint Isolation & Filtering:**
   - Supported in `CoverageAreaMapEditor`:
     - 3-state segmented filter tabs: `All ({total})`, `Covered ({covered})`, `Uncovered ({uncovered})`.
     - Instant visual marker isolation on the Leaflet/Google Maps canvas via reactive React props with zero map re-render lag.
     - Bi-directional toggling (clicking active tab deselects back to "All").
     - On-canvas floating filter badge (`Showing X Hubs [✕]`) with instant clear action.
     - Direct integration with `Claim All Uncovered` and `⚡ Auto-Trace Territory`.

---

## 7. Technician Territory Assignment & Onboarding
1. **4-Tier Geographic Cascader (`TerritoryPincodeSelector.tsx`):**
   - Replaced flat, error-prone manual 6-digit text inputs with an administrative 4-tier cascader: `State` → `District` → `Tehsil` → `PINCODEs`.
   - Used across both `Onboard Technician Modal` and `Edit Profile & Territory Modal` in `InstallersClient.tsx`.
   - Connected directly to the Authoritative Geo Hierarchy Engine (`/api/admin/geo/hierarchy`).
   - **Operational Truth (Active-Only by Default):** Filters out non-operational regions. States, districts, and tehsils without active PINs are excluded by default, preventing accidental assignment to unserved markets.
   - **On-Demand Expansion:** When an admin activates a state or tehsil in the **Regional Expansion Hub (`/admin/expansion`)**, it immediately lights up in the installer cascader with zero latency.
   - **Expansion / Pre-launch Mode:** An interactive pill toggle allows admins to view and provision upcoming expansion hubs before city launches.
   - Displays matching PINCODEs as interactive cards enriched with major colony and commercial anchor names from `JAIPUR_VERIFIED_QUADRANTS` and postal office data (e.g., `302012 (Khatipura / Jhotwara)`, `302019 (Mansarovar / VT Road)`, `302020 (Vaishali Nagar / Chitrakoot)`).
2. **Productivity Batch Controls & Search:**
   - `+ Select All ({count})`: Batch assigns all filtered PINs in the tehsil/district to the technician with 1 click.
   - `Deselect in View`: Removes visible PINs from technician territory.
   - `✕ Clear All`: Resets assigned territory with 1 click.
   - Real-time search filter: Instantly searches PINs by 6-digit number or locality name.
3. **Bi-directional Synchronized Manual Paste Fallback:**
   - Collapsible raw text editor allows pasting comma, space, or newline-separated PIN lists (e.g. from WhatsApp or spreadsheets).
   - Automatically synchronizes two-way with the visual chips and assigned badges in real time.
4. **Assigned Pincodes Badge Area:**
   - Interactive badge wrap displaying currently assigned PINs with 1-click `✕` removal buttons.

---

## 8. Add-ons, Accessories & HDMI Cable Range Architecture (Production Invariants)
1. **Strict Active Catalog & Anti-Synthetic Rule (Section 1.1):**
   - The platform strictly renders only genuine, verified items existing in the Firestore `products` collection (`is_active === true` and `is_deleted !== true`).
   - Fictitious, placeholder, or mock accessories (e.g., dummy sensors, fake UPS systems) are strictly forbidden in customer quotations.
2. **Category Boundaries:**
   - `MUST_HAVE_CATEGORIES`: Cameras, Recorders, Storage HDDs, Power Supplies (SMPS/PoE), System Cables, and Connectors are essential core Bill of Materials items sized automatically by the pricing engine based on camera count and technology. They are NOT optional customer checkboxes.
   - `OPTIONAL_CATEGORIES`: Display Monitors, DVR/NVR Racks, 4G Wi-Fi Routers, Desktop Gigabit Switches, and HDMI Cables are rendered in "Add-ons & Accessories For Your System" for customer upsell.
3. **HDMI Cable Suite (1.5M to 20M):**
   - 6 standardized SKUs: `HDMI-1.5M` (₹84), `HDMI-3M` (₹168), `HDMI-5M` (₹252), `HDMI-10M` (₹420), `HDMI-15M` (₹630), `HDMI-20M` (₹910).
   - **Smart Mutual Exclusivity:** Selecting any HDMI length in `store/configurator.ts` (`toggleAddon`) automatically switches out any previously selected length, preventing duplicate billing for single-recorder setups.
4. **Dynamic Price Synchronization & Fallback Defense:**
   - Add-on cards in `InstantQuotationReview.tsx` resolve unit prices dynamically from `products.find(...)?.unit_price`.
   - `FALLBACK_CATALOG` in `lib/pricing-engine.ts:calculateAddons` matches live Admin database prices (`DISP-19-INCH` @ ₹2,415, `ACC-4G-ROUTER` @ ₹1,885, Racks @ ₹490/₹630), guaranteeing 100% price parity between display cards, BOM line items, and invoice documents.
