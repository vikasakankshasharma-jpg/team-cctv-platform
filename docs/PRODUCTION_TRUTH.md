# Production Truth & Credential Tracking

> **Last Updated:** November 8, 2026  
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

12. **Per-Bucket Feature Isolation & UI Accessibility Invariant:**
    - `mixed_camera_requirements` preserves bucket-level `features` (`color`, `mic`, `2-way`, `ptz`).
    - The pricing engine (`pricing-engine.ts`) strictly processes bucket features independently, preventing feature leakage across unrelated camera buckets.
    - Outdoor cameras are permanently marked with standard IP67 Weatherproofing (`🌧️ IP67 Weatherproof Standard`); 4G cameras are permanently marked with built-in 4G SIM (`🛰️ 4G SIM Built-in`).
    - Color contrast across all customer-facing screens must satisfy WCAG 2.1 AA (minimum 4.5:1) in both Light Mode and Dark Mode, with unified brand blue active states and frosted semi-transparent tags inside colored containers.

13. **Dual-Collection Cascade Delete & Update Invariant:**
    - Hardware management (`/admin/products`) unifies `products` and `addons`. All backend mutations (`DELETE`, `PATCH` via `/api/admin/products`) must operate across both collections in parallel to prevent undeletable orphan records.
    - Table rows in `ProductInventory.tsx` must provide an individual Trash button under `ACTIONS` for direct single-click deletion with confirmation.

14. **Dynamic Inventory-Driven Feature Tag Invariant:**
    - Feature tags on camera cards (`getAvailableFeaturesForBucket`) and in modal checklists (`availableFeatureTags`) must only display capabilities backed by active, stocked products in that technology and brand.
    - Resolution is strictly governed by the `RESOLUTION` selector and prohibited from feature tag arrays.

15. **Non-Intrusive Centered Dialog Invariant:**
    - Landing on quotation catalogs must never trigger auto-opening blocking popups. Modals open strictly on customer click.
    - Dialogs must be centered with responsive `max-h-[85vh]` and internal scroll containers to prevent viewport clipping on mobile and tablet devices.

16. **Vendor Customer Non-Login Retail Price Parity Invariant:**
    - All platform customer prices (`unit_price`) must strictly match our primary distributor / vendor's public customer pricing displayed on their website (`megajaipur.com`) without logging in.
    - Wholesale dealer prices or offline dummy numbers must never overwrite `unit_price`.
    - `base_cost` is calculated strictly using standard distributor margin rules: $\text{base\_cost} = \text{round}(\text{unit\_price} / (1 + \text{margin}/100))$.
    - For genuine 24x7 surveillance hard disks, Mega Compu World non-login customer retail prices are strictly enforced:
      - **2TB:** Toshiba S300 (₹12,065), Seagate SkyHawk (₹12,455), WD Purple (₹12,508).
      - **4TB:** Seagate SkyHawk (₹17,300), WD Purple (₹17,906).
      - **6TB:** Seagate SkyHawk (₹26,267), WD Purple (₹26,267).
      - **8TB:** Seagate SkyHawk (₹38,409), WD Purple Pro (₹38,572).
      - **10TB:** Toshiba S300 (₹48,941), WD Purple Pro (₹50,950), Seagate SkyHawk (₹51,419).

17. **Refurbished / Economy Storage Transparency & Clean Advisory Architecture:**
    - Genuine surveillance hard drives start at 2TB in OEM distributor catalogs. For budget options below 2TB (500GB, 1TB) or economy options where competitors secretly bundle refurbished desktop HDDs with branded cameras to artificially lower quotes, our platform explicitly discloses the component honestly without degrading the quote card UX.
    - **Global Advisory Banner:** A clean amber advisory banner sits directly below the Recording Retention selector when 500GB / Economy storage is selected, providing instant transparency and a 1-click upgrade button to 1TB Recommended.
    - **Compact Card Badge (Zero Clutter):** Instead of bloated 10-line text boxes, package cards render a sleek 1-line amber pill (`⚠️ Basic 500GB HDD · ~X Days Backup · 1-Yr Local [Advisory ⓘ]`) preserving uniform card height and visual clarity.
    - **Educational Modal (`StorageAdvisoryModal.tsx`):** On clicking `[Advisory ⓘ]` or `[Learn More]`, an interactive modal details competitor desktop HDD bundling tactics, compares 500GB vs 1TB+ surveillance drives, and allows seamless 1-click upgrading.
    - **Physics-Accurate Backup Scaling:** Inversely scales backup days strictly according to camera count, resolution, and H.265 compression (e.g., 500GB yields ~7 days for 4 cameras, ~3 days for 8 cameras).

18. **Statutory GST-Paid Master Invariant & Reverse-Tax Compliance:**
    - All vendor acquisition costs (`base_cost`) and customer retail unit prices (`unit_price`) across products, addons, and inventories are strictly GST-paid (18% inclusive) as defined in `BUSINESS_RULES.md` § 3.0.
    - Prevents double-taxation artifacts and guarantees 100% tax compliance across quotations, booking tokens, change orders, and official PDF Tax Invoices:
      $$\text{Taxable Subtotal} = \frac{\text{Gross Total}}{1 + \text{gst\_rate}}$$
      $$\text{GST Amount} = \text{Gross Total} - \text{Taxable Subtotal}$$
    - Mandatory HSN and SAC codes across all hardware and labor line items:
      - CCTV Cameras & Webcams: `8525` (18% GST)
      - DVR & NVR Recorders: `8521` (18% GST)
      - Storage (Surveillance HDDs & MicroSD Cards): `8471` (18% GST)
      - Power Supplies, Adapters & PoE Switches: `8504` (18% GST)
      - 3+1 Coaxial & CAT6 Network Cables: `8544` (18% GST)
      - Connectors, Junction Boxes & Racks: `8536` / `8538` (18% GST)
      - Professional Installation, Fitting & Maintenance Services: `9987` (18% GST)

19. **Intrinsic Bullet Camera Weatherproofing Invariant:**
    - All bullet form factor cameras (`form === 'bullet'`) are intrinsically outdoor and weatherproofed unless specifically marked indoor (`lib/product-resolver.ts`), eliminating false indoor assignments and preventing outdoor camera allocation failures.

20. **Multi-Variation Catalog & Lowest Entry Price Invariant:**
    - For each brand in the quotation catalog (`DynamicVariantGenerator.tsx`), the engine must generate both the lowest entry price Standard IR night vision variation (`plan_type: "budget"`, `sensor_preference: "standard_ir"`, e.g. Hikvision @ ₹18,938) and the 24/7 ColorVu full-color variation (`plan_type: "recommended"`, `sensor_preference: "colorvu"`, e.g. Hikvision @ ₹24,097) when both camera types exist in active catalog inventory.
    - Standard IR requests must resolve strictly to `pool[0]` (the cheapest camera in the brand's pool) in `resolveCamera`, preventing high-priced ColorVu cameras from inflating entry quotes.
    - Each package card must carry an explicit differentiator badge (`key_difference`) directly below the resolution title explaining the technical difference driving the price variance.
    - The top-level toolbar provides 4 compact `<select>` dropdowns (Camera Brand, Retention Days, Storage Brand, Sensor Type) + live match count and one-click reset, keeping the sticky header clean and ultra-fast.

21. **Prohibition of "Single Mobile App" Claims on Hybrid Setups:**
    - Wired DVRs and standalone smart wireless/4G cameras use independent OEM cloud protocols (e.g. CP Plus uses `gCMOB` for DVR and `Ezykam+` for Wi-Fi; Hikvision uses `Hik-Connect` while EZVIZ uses `EZVIZ` app; 4G SIM cameras run on cellular cloud endpoints).
    - Marketing banners or promises claiming all hybrid cameras stream together in a "single unified mobile app" are strictly prohibited to prevent misrepresentation and customer complaints.

---

22. **Camera Count Breakdown Mathematical Parity Invariant:**
    - Across all UI badges (`WizardClientV2.tsx` security blueprint summary), checklist modals (`SpecificationChecklistModal.tsx`), and WhatsApp quotation notifications (`quote-dispatch.ts`), any parenthetical breakdown displayed alongside a total camera count MUST strictly sum to that exact total:
      $\text{total\_cameras} = \text{outdoor} + \text{indoor} + \text{wireless}$
    - Disallowed Omission: Displaying `📹 74 Cameras (36 Out + 2 In)` when 36 wireless cameras are configured is strictly prohibited. The breakdown dynamically interpolates `${wifi} Wireless` (e.g. `📹 74 Cameras (36 Out + 2 In + 36 Wireless)`), guaranteeing 100% mathematical consistency.

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

## 18. Inventory-Driven Feature & Filter Parity Rule (Layer 37 & 38)
- **Principle:** No customer screen or modal may offer a feature tag, resolution, connection, or brand filter for which zero active inventory exists in the product catalog.
- **Resolution vs Features:** Resolution (2MP, 3MP, 4MP, 5MP, 8MP) is a camera sensor grade configured solely via the `RESOLUTION` dropdown on camera cards. It must NEVER be offered as an add-on feature tag checkbox.
- **Dynamic Feature Filtering:**
  - In Standard HD (Analog): Features limited to `IP67 Weatherproof`, `24/7 Color`, and `Audio Mic`. `2-Way Talk` is strictly suppressed (0 in inventory, no HD analog cameras have speakers). `360° PTZ` is displayed only if A+ Products or Trueview PTZ is active.
  - In Premium IP (Network): Features limited to `IP67 Weatherproof`, `24/7 Color`, and `Audio Mic`. `2-Way Talk` and `360° PTZ` are suppressed (0 in inventory).
  - In Smart Wireless (Wi-Fi / 4G): All features (`24/7 Color`, `Audio Mic`, `2-Way Talk`, `360° PTZ`) are supported by inventory and displayed.
- **Non-Intrusive Modal Standard:** Quoting pages MUST NOT auto-open blocking modals on load. All assistant modals (`TagGuideModal`, `SpecificationChecklistModal`) must be triggered on demand by customer action and render centered (`max-h-[85vh]`).

## 19. Mega Compu World Jaipur Wholesale Ingestion Standard (Layer 38)
- **Source of Ground Truth:** Mega Compu World Jaipur (`megajaipur.com`) is the primary wholesale distributor for CP Plus, Hikvision, Prama, A+ Products, and Secureye in Rajasthan.
- **Synchronized Catalog:** 66 active, verified hardware items across 6 camera brands and matching 4ch/8ch/16ch 2MP & 5MP DVRs.
- **Brand Representation:** Brand filters feature authentic available distributor stock: `All Brands` (Recommended) | `A+ Products (Budget)` | `CP Plus` | `Hikvision` | `Prama` | `Secureye` | `Trueview`.
- **Zero-Dead-End Guarantee:** If a brand does not stock a specific resolution (e.g. Prama only stocks 2MP in this catalog), switching to that brand auto-adjusts the bucket resolution dropdown to available stock (`2MP`), completely eliminating quotation dead ends or missing product errors.


## 20. WhatsApp Omnichannel Production Engine & Resilience Invariants
- **Webhook Endpoint:** `https://cctvquotation.com/api/webhooks/whatsapp` (Meta Cloud API).
- **Out-of-Flow & Media Resilience:**
  - Inbound media (photos, voice notes, stickers, PDFs) never crashes or breaks the conversational state machine. The bot acknowledges media receipt (explaining it can be reviewed during survey) and re-prompts the exact pending question with its quick-tap buttons.
  - Name protection filter intercepts off-topic pricing queries ("rate kya hai", "cctv price") and politely re-prompts for genuine name.
  - Accidental 10-digit mobile number typed at the pincode step is captured as telephone and the 6-digit pincode is re-prompted.
  - Canonical phone formatting standardizes all numbers to `91XXXXXXXXXX`.
- **Zero `[object Object]` Guarantee:**
  - All webhook handlers, notification catch blocks, and API responses strictly sanitize error messages to prevent raw JS object leaks.

## 21. 11 Indian Languages Standard & Natural Colloquial Phrasing
- **Supported Languages:** English (`en`), Hindi (`hi`), Marathi (`mr`), Gujarati (`gu`), Tamil (`ta`), Telugu (`te`), Kannada (`kn`), Bengali (`bn`), Malayalam (`ml`), Punjabi (`pa`), Odia (`or`).
- **First-Touch Welcome:** Initiates with a bilingual English/Hindi greeting and numbered 1–11 menu.
- **Layman Colloquial Dictionary:** Strict ban on synthetic bureaucratic translations. Natural everyday terms used across all languages (e.g. "घर / फ्लैट", "दुकान / ऑफिस", "तार वाला", "बिना तार", "कम / ज्यादा").

## 22. Hybrid Numeric Reply & Option A 2-Button Checkpoint
- **Hybrid Input:** Customers can tap quick-tap buttons (`[ 2 ]`, `[ 4 ]`, `[ 8 ]`) or directly type an integer (`1` to `32`) for camera quantities. Direct typed numbers are immediately parsed.
- **Option A (2-Button Checkpoint):** Summary confirmation uses 2 Meta API compliant buttons ($\le 20$ chars):
  - `[ ✅ Done (Proceed) ]` (`wf_done_proceed`)
  - `[ ✏️ Change Qty ]` (`wf_change_qty`)
- **Non-Destructive Camera Quantity Editor (`ASK_CAMERA_EDIT_CHOICE`):**
  - Tapping `[ ✏️ Change Qty ]` allows modifying counts per camera bucket without resetting customer session data (Language, Property Type, Pincode preserved).
