# TEAM CCTV Platform - Master Core Business & Operating Rules

> **CRITICAL DIRECTIVE FOR ALL AI AGENTS & DEVELOPERS:**  
> This file is the single, authoritative source of commercial, architectural, and operational truth for the TEAM CCTV Platform (`cctvquotation.com` / `secure-easy`).  
> ALWAYS consult and strictly adhere to these rules before modifying ANY code related to pricing, margins, catalog filtering, hardware configuration, customer journeys, installer workflows, partner commissions, or checkout.

---

## 1. Catalog & Inventory Rules (Strict)

### 1.1 Active Products Only
- **Zero-Tolerance for Mock / Fake Products:** The system must NEVER inject hardcoded, artificial, or "fallback" products (e.g., legacy fallback 500GB HDD, mock sensors, or fictitious SKUs). If a product does not exist with an active record in the Admin Database, it MUST NEVER be quoted.
- **Strict Prohibition of Synthetic Products in Test Fixtures:** Test suites, developer scripts, and CI runners must NEVER inject dummy products (e.g., `"Test Camera"`, `"TEST-CAM"`) into production collections or quote documents. All automated and manual testing must use genuine active catalog SKUs.
- **Mandatory Automated Teardown (`afterAll`):** Any test script that generates transient records (`QT-E2E-...`, `L_REV_...`, dummy POs) MUST implement an automated `test.afterAll()` teardown hook that immediately purges its created entities from Firestore, ensuring zero test pollution.
- **Admin View Separation:** Synthetic test records (`is_test: true`, `QT-E2E-...`, `9999999999`) must remain filtered and hidden by default from staff lead and quotation tables.
- **Stock Status vs. Active Status:** If a product has `is_active = true`, it is **fully eligible for quotation** regardless of whether `stock_status` is marked as `"out_of_stock"` or `"backordered"`. TEAM CCTV maintains verified vendor tie-ups and procures inventory on demand. Out-of-stock items must NOT be hidden or skipped if `is_active = true`.
- **Add-on vs. Routine BOM Products:** Products flagged with `is_addon = true` are strictly designated as optional upsell accessories (e.g., display monitors, HDMI splitters, 4G Wi-Fi routers) in "Add-ons & Accessories For Your System" and are excluded from routine automatic BOM generation.
- **Core BOM (`MUST_HAVE_CATEGORIES`) vs Optional Add-ons (`OPTIONAL_CATEGORIES`):** Core system essentials (`cctv_camera`, `recorder`, `storage`, `connector`, `cable`, `power_device`) are calculated and bundled automatically based on camera count and technology. They are never rendered as confusing optional checkboxes. Optional upsell accessories (`display`, `rack`, `network`, `hdmi_cable`, `accessories`) populate "Add-ons & Accessories For Your System" strictly sourced from active, genuine Admin Panel / Firestore inventory with 100% price synchronization.
- **Firestore Soft-Deletion Query Invariant:** Firestore query filters must NEVER query `where("is_deleted", "==", false)` on collections containing legacy documents. In Firestore, querying inequality or equality on a field strictly omits all documents where that field is absent/undefined. Queries must fetch active items (`where("is_active", "==", true)`) and filter out soft-deleted items in application memory (`.filter(p => p.is_deleted !== true)`).

### 1.2 Product Specifications & Attributes
- **Pan-Tilt-Zoom (PTZ) Cameras:** Must explicitly specify Form Factor (`PTZ`), Pan capabilities, Tilt range, Optical Zoom factor (e.g., 4x, 10x, 25x), and Digital Zoom factor.
- **Audio Capabilities:** Strictly differentiate between:
  - `Audio Mic`: Unidirectional sound capture.
  - `Speaker`: Audio broadcast/output.
  - `2-Way Audio`: Dual hardware supporting both microphone and speaker.
- **Form Factors & Network Tags:** Distinct tags must be maintained for WiFi, 360-Degree Panoramic/Fisheye, Dual Camera, Triple Camera, and Quad Camera units.
- **Recorders & Racks:** Racks must include `U Height` (e.g., 2U, 4U, 6U, 9U). Recorders must specify supported channels (`4Ch`, `8Ch`, `16Ch`, `32Ch`), technology (`HD`, `IP`), and incoming bandwidth.
- **Admin Duplicate / Copy Product Feature:** When copying products in the Admin Catalog, attributes and specs pre-fill while stripping database IDs and appending `-COPY` to the SKU to protect against accidental duplicate SKU collisions.

---

## 2. Server-Side Authority & Journey Parity

### 2.1 Server Calculation Authority
- **Never Trust The Client:** The frontend (Client) is strictly untrusted for calculating line totals, taxes, margins, discounts, or final quotes. All final math, whether generated via "Guided Setup" or "Custom Build" (Pro Builder), MUST be calculated server-side in `lib/pricing-engine.ts` and `app/api/quote/save/route.ts`.
- **100% Mathematical Parity:** "Guided Setup" and "Custom Build" MUST yield identical totals for identical Bills of Materials. Custom Build is subject to the same margin engines, bundling algorithms, and labor rules as Guided Setup.
- **Webhook + Fallback Verification:** Payment confirmations are driven by Razorpay / Cashfree webhooks. In addition, the payment success screen triggers a server-side Fallback Verification API to proactively verify status and mark the booking as `PAID` / `BOOKED` even if webhooks face network timeouts.

---

## 3. Pricing Engine & Margin Architecture

### 3.1 Margin Waterfall
- **Dynamic Category Margins:** Hardware components (Cameras, Recorders, Storage, Power Supplies, Cables, Connectors, Accessories) strictly follow the dynamic margins configured in the Admin Panel (`margin_cctv_camera`, `margin_hdd`, `margin_connectors`, etc.) via `lib/margin-engine.ts`.
- **Tie-Breaking Rule:** When multiple compatible products meet configuration criteria, the engine selects the one with the lowest calculated retail price to maintain competitive advantage.

### 3.2 Power Supply (SMPS) & PoE Switch Selection Rules
- **Competitive "Best Price" Selection Rule:** A higher-channel power supply (e.g., 8-channel SMPS) can power a smaller system (e.g., 4 cameras). The pricing engine MUST select the lowest-priced compatible power supply, even if it has a higher channel count, to offer maximum competitive pricing.
- **Fallback Quantity Math:** When falling back to smaller capacity units (e.g., powering 12 cameras with 8Ch SMPS), the quantity must be calculated as `Math.ceil(camera_count / max_cameras_supported)` (e.g., `Math.ceil(12 / 8) = 2` units).
- **Multi-PoE Switch Architecture & Gigabit Uplink:**
  - For IP camera setups where total camera count exceeds the port capacity of a single PoE switch (e.g., 15 cameras on 8-port PoE switches), multiple PoE switches are allocated.
  - An interconnecting Desktop Gigabit Switch is required and added as an upgrade/accessory to aggregate all PoE switches into a single high-speed uplink to the NVR.
- **Strict IP vs. HD Transmission Hardware Isolation:**
  - IP camera setups MUST ALWAYS select PoE Switches (`POE-BUD-4CH`, `POE-BUD-8CH`, etc.). Under no circumstances can an Analog SMPS be assigned to an IP system.
  - HD camera setups strictly use CCTV SMPS Power Supplies.
- **Concatenated Model Code Keyword Parsing:**
  - Keyword and attribute recognition in inventory parsing checks both `technical_name` (e.g., `BB-PES4`, `CP-UNR-104-1P`) AND `display_name` concatenated (i.e. `${technical_name || ""} ${display_name || ""}`). This guarantees manufacturer model codes never mask component type keywords such as "PoE", "NVR", or "DVR".

### 3.3 Cabling Calculation & Margin Slabs
- **Material Billing vs. Free Pulling Labor:** Cable installation labor is FREE (up to 15m/camera), but the cable material itself is billed to the customer.
- **Bundle vs. Per-Meter Optimization:** The engine calculates whether the required cable length is cheaper as full bundles (305m or 100m) plus per-meter balance, or strictly per-meter pricing, offering the customer the best rate.
- **Per-Meter Variants as SKU Attributes:** Per-meter cable rates are maintained directly on the master cable SKU rather than creating confusing duplicate SKUs.
- **Short-Run Margin Slabs:** For small cable lengths, Admin-configured margin slabs subsidize labor time:
  - Slab 1 (<= 5m per camera): Added cable margin (+120% default).
  - Slab 2 (6 - 10m per camera): Added cable margin (+60% default).
  - Slab 3 (11 - 15m per camera): Added cable margin (+20% default).
  - Slab 4 (> 15m per camera): Standard flat cable margin.

### 3.4 Connectors & Junction Boxes
- **Connectors Formula:**
  - Analog HD: `camera_count * 2` BNC connectors + DC power pins.
  - IP Systems: `camera_count * 2` RJ45 connectors + `2 extra RJ45` connectors for the Gigabit uplink from PoE Switch to NVR.
- **Junction Boxes Formula:** Exactly `1 * camera_count` waterproof junction boxes.

### 3.5 "Match My Brand" Dynamic Brand Unification
- By default, quotations are generated as **"Mixed (Best Price)"** across all compatible active products.
- On the Quotation Review screen, customers can click **"Match My Brand"** to dynamically unify all hardware under a single preferred brand (e.g., CP Plus, Hikvision) if active stock exists. The engine recalculates the quotation on the fly.
- Redundant brand sort dropdowns are removed from pages containing dedicated brand selector tabs.

### 3.6 Recorder (DVR/NVR) Resolution Compatibility & Best-Price Selection Rules
- **Technical Resolution Compatibility Invariant:**
  - A recorder's maximum supported camera resolution ($\text{recMaxMP}$) must be greater than or equal to the highest resolution camera in the quote ($\text{targetMaxMP}$):  
    $$\text{Recorder Max MP} \ge \max(\text{Camera MP})$$
  - **Camera 2MP Setup:** Minimum 2MP DVR/NVR required.
  - **Camera 4MP / 5MP Setup:** Minimum 5MP DVR/NVR required (2MP recorders are strictly disqualified).
  - **Camera 8MP (4K) Setup:** Minimum 8MP DVR/NVR required.
  - **Mixed Resolution Setups (e.g., 3x 2MP + 1x 5MP):** Sized to the highest resolution camera in the configuration ($\ge 5\text{MP}$), ensuring all cameras record at full native resolution without down-sampling or blackouts.
- **Cost Optimization ("Cheaper Higher-Spec" Priority):**
  - If a higher-resolution recorder (e.g., 5MP DVR) is priced **cheaper** than a lower-resolution recorder (e.g., 2MP DVR) within the same channel tier and brand preference, the pricing engine selects the cheaper higher-spec recorder.
  - *Commercial Rationale:* A 5MP DVR runs 2MP cameras natively. Delivering the cheaper option maximizes customer savings and quotation competitiveness without violating technical compatibility.
  - *Hard Invariant:* Conversely, a cheaper 2MP recorder can NEVER be selected for 4MP, 5MP, or 8MP cameras because it cannot process higher-resolution signals.
- **Technology Isolation:**
  - Analog HD cameras strictly pair with DVRs (`HD`).
  - IP cameras strictly pair with NVRs (`IP`).
  - Technology filtering executes before resolution and price evaluation.
  - NVRs default to 8MP/4K support unless specified lower in catalog specs.
- **Channel Sizing Tier & Sorting:**
  - Recorders are bucketed by channel tier ($4\text{Ch}$, $8\text{Ch}$, $16\text{Ch}$, $32\text{Ch}$) where $\text{channel\_count} \ge \text{total\_cameras}$.
  - Candidates meeting both technology and resolution compatibility ($\text{recMaxMP} \ge \text{targetMaxMP}$) are sorted:
    1. Primary: Channel capacity ascending (smallest viable channel tier).
    2. Secondary: Unit retail price ascending (cheapest eligible recorder selected).
- **Dynamic Reset of Pinned Recorder:**
  - In configurator state and pricing engine calculations, if a customer or admin reduces camera count (e.g. from 16 to 2 cameras) or changes the brand/technology, any previously selected or pinned `selected_recorder_id` is automatically reset if it exceeds the new required channel capacity or violates technology/brand constraints.
  - This prevents high-capacity recorders (e.g. 16-channel or 32-channel units) from unintentionally persisting on small-scale configurations (e.g. 1 to 4 cameras) when smaller, economical 4-channel units are available.

### 3.7 Power, Transmission & Storage Hardware Isolation and Zero-Trust Invariants
- **Strict Technology Isolation for Power Devices:**
  - IP setups MUST ALWAYS resolve to PoE Switches (`technology: ["IP"]`).
  - HD setups MUST ALWAYS resolve to SMPS power supplies (`technology: ["HD"]`).
  - An Analog SMPS (e.g. ₹490) can NEVER be selected for an IP quotation under any circumstance, and a PoE Switch (e.g. ₹1,080) can never be paired with an HD coaxial setup.
- **Canonical Channel & Port Capacity Resolver (`getProductChannelCapacity`):**
  - All power supplies and recorders derive their true hardware camera capacity through a canonical 4-tier resolver:
    1. `channels` (explicit integer)
    2. `max_cameras` (explicit integer)
    3. `network_ports` (explicit integer)
    4. Deterministic regex extraction from combined product identifiers: `(\d+)\s*(?:ch|port|channel|channels|ports)\b`
  - Eliminates bugs where Firestore documents with missing schema properties fall back to `undefined` or 0.
- **Power Device Port Tier Sizing & Sorting:**
  - **IP PoE Switches:** Port tier matches camera counts in strictly ascending channel capacity ($4\text{-port} < 8\text{-port} < 16\text{-port}$) before price. An oversized switch is never auto-selected when a smaller compliant switch exists.
  - **HD SMPS Units:** Unit price takes precedence within qualifying capacities ($\text{capacity} \ge \text{camera\_count}$). For example, an 8-channel SMPS priced at ₹490 is valid for a 4-camera setup if it is cheaper than a 4-channel unit.
- **Zero-Trust Validation of Pinned Hardware Overrides:**
  - If a user, draft quote, or external client supplies a pinned `selected_power_id` or `selected_recorder_id`:
    1. Must exist, be active (`is_active === true`), and not soft-deleted (`is_deleted !== true`).
    2. Technology MUST match configuration (`isTechMatch(device, tech)`). Any cross-technology mismatch (e.g. Analog SMPS pinned for IP cameras) is immediately rejected.
    3. Hardware capacity must be adequate ($\text{capacity} \ge \text{camera\_count}$).
    4. Recorders must meet resolution requirements ($\text{recMaxMP} \ge \text{targetMaxMP}$).
    5. Recorders $\ge 8\text{Ch}$ pinned on small setups ($\le 4$ cameras) are automatically reset when compliant smaller tier units exist.
    6. If any check fails, the invalid pinned ID is dropped and the system gracefully auto-resolves the optimal compliant hardware.
- **Surveillance Storage Hardening:**
  - Storage selection dynamically sizes surveillance-rated HDDs based on daily GB requirements, camera count, and compression.
  - Pinned storage (`selected_storage_id`) is strictly verified to ensure the drive is active and not soft-deleted (`is_deleted !== true`) before quoting.

### 3.8 Mixed Camera Count Synchronization & Unified Brand Matching Invariants
- **Total Camera Count Truth Invariant:**
  - Whenever mixed cameras (e.g. 3 Outdoor Bullet + 2 Indoor Dome = 5 cameras) or indoor/outdoor counts are selected, the pricing engine, configurator store, and UI views MUST automatically synchronize and evaluate `camera_count` as the strict sum of all active camera buckets.
  - A recorder tier MUST size to the sum of all mixed cameras (e.g., 5 cameras must strictly select an 8-Channel NVR/DVR, NEVER an undersized 4-Channel unit).
  - Storage calculation (daily GB, backup duration) MUST size to the sum of all mixed cameras.
  - Power supplies (PoE Switches, SMPS) MUST size to the sum of all mixed cameras (e.g., 5 cameras size to an 8-port switch at qty 1, NEVER duplicate 4-port switches).
  - Installation labor, junction boxes, and connectors MUST bill against the sum of all mixed cameras.
- **Power Supply Brand Matching:**
  - When a brand preference is active (e.g., CP Plus, Hikvision, Dahua), `resolveTransmission` prioritizes power supplies matching the selected brand (e.g., CP Plus PoE Switch for CP Plus IP setups) before falling back to generic/budget options.
- **Strict Currency Symbol Encoding:**
  - All customer-facing bills of materials, cable remainders, unit rates, and totals must strictly render the Indian Rupee symbol (`₹`) and never corrupted ASCII question marks (`?`).

### 3.9 Multi-Camera Quantity Scaling (1 to 32+ Cameras) & Industrial Threshold Defense
- **Channel Tier Invariant Matrix:**
  - $1 \text{ to } 4\text{ Cameras:}$ Strictly sizes to 4-Channel recorder and 4-Port PoE Switch (or 4/8Ch SMPS). Never overquotes 8Ch, 16Ch, or 32Ch hardware.
  - $5 \text{ to } 8\text{ Cameras:}$ Strictly sizes to 8-Channel recorder and 8-Port PoE Switch (or 8Ch SMPS) at quantity 1. Never quotes multiple 4-port switches when an 8-port switch exists.
  - $9 \text{ to } 16\text{ Cameras:}$ Strictly sizes to 16-Channel recorder and 16-Port PoE Switch (or 16Ch SMPS) at quantity 1. Never quotes duplicate 8-port switches when a 16-port switch exists.
  - $17 \text{ to } 32\text{ Cameras:}$ Sizes to 32-Channel NVR for IP. Transmission dynamically scales to multiple 16-port PoE switches with core Gigabit desktop switch uplink.
- **Dynamic Industrial Boundary Routing:**
  - Quotable threshold is determined dynamically per technology via `getCatalogCapacity(products)`:
    - HD: capped at the highest active DVR in catalog (currently 16Ch). Quotes $> 16\text{ HD cameras}$ cleanly route to `requiresIndustrialQuote: true`.
    - IP: capped at the highest active NVR in catalog (currently 32Ch). Quotes $> 32\text{ IP cameras}$ route to `requiresIndustrialQuote: true`.
    - Wireless: capped at 16 if wireless cameras are active in catalog, or 0 if unstocked, routing custom enterprise inquiries cleanly without throwing spurious missing-hardware exceptions.

### 3.10 Wires, Cables & HDMI Cable Catalog Architecture
- **Complete Length Range Availability:**
  The quotation engine and Instant Quotation Review expose all standard CCTV HDMI cable lengths:
  - 1.5 Meter (`HDMI-1.5M`, Compact, ₹84 +GST)
  - 3 Meter (`HDMI-3M`, Essential/Popular, ₹168 +GST)
  - 5 Meter (`HDMI-5M`, Extended, ₹252 +GST)
  - 10 Meter (`HDMI-10M`, Long Run, ₹420 +GST)
  - 15 Meter (`HDMI-15M`, Pro Length, ₹630 +GST)
  - 20 Meter (`HDMI-20M`, Max Range, ₹910 +GST)
- **Dynamic Retail Price Synchronization:**
  Add-on display cards in `InstantQuotationReview.tsx` dynamically pull real-time retail unit prices directly from the live catalog (`products.find(p => p.id === acc.id || p.sku === acc.id)?.unit_price || fallbackPrice`). This guarantees that card prices and itemized Bill of Materials line totals are always 100% identical.
- **Mutual Exclusivity in Length Selection:**
  Selecting an HDMI cable length in `store/configurator.ts` (`toggleAddon`) automatically switches any previously selected HDMI cable length, ensuring customers are never inadvertently double-charged for multiple HDMI cables when choosing between different lengths for their recorder.
- **Catalog Add-on Merging & Fallback Resilience:**
  `InstantQuotationReview.tsx` merges all catalog accessories from both `addons` and `products` collections into `allAccessories`. `calculateAddons` in `lib/pricing-engine.ts` incorporates a standard catalog fallback for all HDMI lengths and safety enclosures to ensure resilient offline, cold-start, or mock test quotation calculation.
- **Collapsible Category Accordion & Compact Variant Selector:**
  `InstantQuotationReview.tsx` organizes the "Add-ons & Accessories For Your System" section into clean collapsible category accordion bars. Categories start collapsed (reducing vertical scroll height by 70%), displaying active badges (`✓ Selected: [Item] (+₹Price)`) with quick remove controls. When "Wires & Cables" is expanded, the 6 HDMI lengths are presented via an interactive Compact Length Pill Selector (`1.5M`, `3M`, `5M`, `10M`, `15M`, `20M`), delivering single-tap switching and instant real-time quote recalculation.


---

## 4. Installation, Labor & Site Survey Rules

### 4.1 Strict Zero Margin on Labor
- **LABOR AND INSTALLATION COSTS NEVER RECEIVE A COMMERCIAL MARGIN MARKUP.** They are strictly pegged to competitive local market rates.

### 4.2 Full Installation Labor (With Cabling)
- **Base Rate:** ₹500 per IP camera; ₹400 per HD camera.
- **Free Cable Pulling Allowance:** Every wired camera includes 15 meters of free cable pulling labor.
- **Excess Cabling Labor:** Any cable pulled beyond 15m per camera is charged at a flat rate of ₹15 per meter.

### 4.3 Fitting-Only Labor (No Cabling Required)
- **Base Fitting Rates:** When cabling already exists on site:
  - ₹200 per HD camera.
  - ₹300 per IP camera.
  - Plus ₹500 standard site visit charge.
- **Small Setup Minimum:** For systems of 2 cameras or fewer, a flat minimum rate of ₹500 per camera applies.
- **Admin Configurable:** All fitting rates remain fully editable in the Admin Panel.

### 4.4 Site Preparation Bitmask Surcharges (Zero Markup)
Exactly 5 site difficulty flags can be set by the Installer, Salesperson, or Admin with zero margin markup:
1. `ladder` (High ceiling / ladder needed): ₹500
2. `marble` (Marble surface cutting/drilling): ₹400
3. `metal` (Metal surface drilling/mounting): ₹200
4. `furnished` (Concealed routing in furnished interiors): ₹300
5. `heavy_drilling` (Heavy concrete core cutting): ₹600

### 4.5 Post-Visit Quotation Versioning
- If an installer or salesperson adjusts site preparation flags, cable lengths, or quantities after a physical site visit, the system automatically creates a **new Quotation Version** (`v2`, `v3`) preserving the original customer snapshot for audit history.

### 4.6 Free Site Survey vs. Paid Installation Clarity
- "Free Onsite Survey" is offered for site feasibility. Marketing copy must avoid claiming "100% free installation" to prevent customer confusion; free cable pulling labor up to 15m and free site visits are offered, while hardware and installation are billed.
- **Quotation Disclaimer:** Every quote must prominently display:  
  *"Note: The final quotation amount may vary depending on actual physical site conditions, cabling length, and structural requirements verified during installation."*

---

## 5. Geographical Coverage, Mapping & Tehsil Delivery Micro-Hubs

### 5.1 Mapping Infrastructure
- **Mappls (MapmyIndia):** Primary cadastral and boundary provider for Indian administrative accuracy, district/tehsil vector boundaries (`MapplsBoundaryMap.tsx`), and geo analytics.
- **Google Maps High-Performance Tile Engine:** Modal editor canvases and territory tools connect directly to Google Maps using the project's authenticated `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (`lyrs=m` for road network, `lyrs=y` for satellite hybrid). Completely eliminates third-party tile providers (e.g. CartoDB) and guarantees zero watermarks.
- **Dynamic Basemap Layer Switcher:** Every interactive map canvas provides a 1-click toggle between **Google Roads** (default street and colony view), **Google Satellite** (high-resolution aerial imagery for site survey and CCTV line-of-sight inspection), and **OpenStreetMap (OSM)**.
- **Map Pin-Drop:** Customers drop a pin to capture their exact geolocation, auto-populating address fields.

### 5.2 Administrative Hierarchy
- `State` → `District` → `Tehsil` → `PINCODE` → `Sub-Post Office Delivery Micro-Hubs`.

### 5.3 3-Tier Layered Geography & Delivery Micro-Hub Strategy
- **3-Tier Layered Geography Standard:**
  1. **Tier 1 (City & Zone Solid Polygons):** Mappls GeoAnalytics / Municipal boundary defining the macro urban perimeter.
  2. **Tier 2 (Cadastral PINCODE Boundary Polygons):** Closed vector polygons (`KNOWN_PINCODE_POLYGONS` / `OFFICIAL_PINCODE_POLYGONS`) rendering the verified municipal service territory filled in green.
  3. **Tier 3 (Sub-Post Office Delivery Hubs & Halos):** Official Sub-Post Offices (`S.O.`) and Branch Offices (`B.O.`) extracted from India Post data and mapped to authentic local communicating names (e.g., `Niwaru Road`, `Lata Circle`, `Khatipura Tiraha`, `Amrapali Circle`).
- **Visual Map Indicators:**
  - Red badges & dashed red halos: Unassigned / uncovered delivery hubs.
  - Green badges & translucent 850m halos: Active / serviceable delivery hubs with 2-letter shortcode pills (`[✓ NR]`, `[✓ LC]`, `[✓ BW]`, etc.).
  - Polygons: Solid fill indicates active PINCODE boundary coverage; individual hubs do not render disjoint micro-polygons to avoid boundary clipping and visual clutter.
- **Micro-Hub Halo Decluttering (`Halos: ON / OFF`):** Admin console provides a 1-click toggle to suppress the 850m circular beat halos, giving an unobstructed view when inspecting street geometry or drawing manual boundaries.
- **1-Click ⚡ Auto-Trace Territory:** Uses monotone chain convex hull computation (`lib/geo/pincodePolygons.ts`) to instantly generate a tight, closed polygon perimeter enclosing all covered delivery hubs in 1 click, eliminating manual point-by-point drawing.
- **Dynamic Hub Capacity:** Supports 1 to 8 natural delivery hubs per PINCODE based on actual India Post beats rather than artificial 4-box cardinal grids.
- **Batch Tools:** Admin console provides dynamic hub discovery and verified hub injection for all PINCODEs across selected Tehsils/Districts.

### 5.4 Universal Full Map View Architecture
All mapping views across the entire platform must provide a synchronized Fullscreen / Expanded workspace:
1. **Coverage Area Map Editor (`CoverageAreaMapEditor.tsx`):** 1-click "Full Map View" button in the toolbar and on-map header, expanding canvas to panoramic workspace (`fixed inset-0 z-[9999]`) with an ESC key listener and dedicated exit banner.
2. **Coverage Zone Modal (`SalespersonsClient.tsx`):** Dedicated modal maximize/restore button in dialog header, expanding to `97vw x 96vh` with `560px` canvas.
3. **Territory Boundary Matrix (`TerritoryMatrix.tsx`):** 1-click "Full Map View" button expanding Mappls district choropleth map to `100vw x 100vh` with automated SDK resize.
4. **Embedded Maps (`MapplsBoundaryMap.tsx`):** Built-in full-screen toggle icon in the floating legend for all embedded views.

### 5.5 Tri-Factor Coverage Enforcement
Serviceability is verified by matching against:
1. Assigned Sub-Post Office Delivery Micro-Hub (via tokenized string matching of customer street/colony addresses against local communicating names).
2. Circular Operating Radius (e.g., 15 km from service hub).
3. Polygon Boundary Tool drawn in the Admin Console.

### 5.6 Multi-Tier Boundary Resolution & Centroid Targeting
To ensure professional, 100% accurate map rendering across all PIN codes in India without missing or broken shapes, territory boundaries are resolved through a strict hierarchical engine:
1. **Tier 1 (Verified Google Maps Cadastral Boundaries):** Curated in `KNOWN_PINCODE_POLYGONS` for core launch urban centers (e.g., Jaipur metro PINs 302001–302048). Takes top precedence over raw government datasets to eliminate algorithmic Voronoi artifacts.
2. **Tier 2 (Official Open Postal Boundary Layer):** Pre-extracted vector multi-polygons (`OFFICIAL_PINCODE_POLYGONS`) from public cadastral data.
3. **Tier 3 (Universal Dynamic Convex Hull):** For any unmapped rural or outer PIN across India, the engine computes a 2D convex hull across all constituent post office locations with a calibrated 1.6 km delivery buffer.
4. **Centroid Alignment (`getKnownCentroid`):** Map camera center and pin-drop markers are anchored to the true geometric centroid of verified polygons, preventing camera drift caused by corrupted third-party postal coordinates.

---

## 6. Referral, Affiliate & Partner Ecosystem

### 6.1 B2B Business Partners (Trade)
- **Target Audience:** Electricians, shopkeepers, architects, interior designers, IT contractors.
- **Onboarding:** By Admin invitation or verified business review.
- **Tooling:** Dedicated Partner Portal + custom branded QR code.
- **Commercial Terms:**
  - Partner Commission: **2%** of total quote value.
  - Customer Discount: **3%** instant discount when using the partner's code/QR.

### 6.2 B2C Individual Referral Partners ("Refer & Earn")
- **Target Audience:** General public, existing happy customers.
- **Onboarding:** Open self-signup via verified Mobile Number (WhatsApp OTP).
- **Tooling:** Automated referral code + downloadable occasion/festival EDMs (Diwali, Holi, New Year, National Days) pre-stamped with their code for WhatsApp Status sharing.
- **Commercial Terms:**
  - Referrer Incentive: **₹500** flat payout per completed installation.
  - Referred Customer Discount: **₹500** discount on their quotation.

### 6.3 Payout Maturity & Financial Dashboard
- Admin Financial Dashboard governs all payouts for Installers, B2B Promoters, and B2C Referrers.
- Payouts unlock only after 100% job completion with zero open punch-list items/pendencies, tracking maturity days and overdue alerts.

---

## 7. Customer Journey & Checkout Pathways

### 7.1 Four Checkout Options on Quotation Review
1. **Pay Full Upfront:** **2% Instant Discount** on total quotation.
2. **3-Step Milestone Booking:** **₹500 Advance Token** to confirm technician visit and lock pricing.
3. **EMI Financing:** Low-cost EMI financing plans prominently featured.
4. **Free Site Visit Booking:** Date & time picker (strictly future dates) for customers wanting an in-person survey before paying.

### 7.2 Lead Capture in Custom Build (Pro Builder)
- Customer Name and Mobile Number (verified via WhatsApp OTP) are captured **at step 1** before entering the custom hardware builder, preventing lead abandonment.
- Mobile Safari Auto-Zoom prevention: Input fields enforce `text-base sm:text-sm` (16px font on mobile).
- Single-option filter auto-collapse: Category filters with only 1 option automatically collapse to keep UI clean.

### 7.3 Wireless System (Wi-Fi / 4G) Custom Build Architecture
- **3-Card Technology Selection:** Pro Builder provides equal first-class standing to `IP / Network System`, `HD / Coaxial System`, and `Wireless (Wi-Fi / 4G)`.
- **Dynamic Stepper Adapters:** Stepper badges non-wired steps gracefully: `Recorders (Optional)`, `Storage (MicroSD)`, `Connectors (N/A)`, `Cables (Optional)`, `Power Device (Included)`.
- **Cameras Step:** Provides filters for `Connection: All | Wi-Fi | 4G SIM`, Form Factor (`Dome`, `Bullet`, `360° PTZ`, `Multi-Lens`), and surfaces `Inbuilt Speaker & 2-Way Audio` badges.
- **Standalone App Operation (Recorders Step):** Renders informative architecture cards explaining that Wi-Fi & 4G cameras stream directly to phone apps and record to local MicroSD cards without a bulky NVR. Includes 1-click `Skip to MicroSD Storage (Recommended)` button and optional `View Compatible IP NVRs` toggle.
- **Storage Prioritization:** MicroSD cards are sorted first. The default 128GB High Endurance card (~15-20 days continuous backup) is badged as Recommended per the camera hardware safety rule (`max_sd_capacity_gb`).
- **No Inapplicable Steps:** Connectors, video cables, and SMPS/PoE devices display clean domain cards with 1-click proceed/skip actions instead of empty filter error states.
- **1-Click Smart Setup Assistant for Wireless:** Bundles 128GB MicroSD cards (1/camera), Weatherproof Junction Boxes (1/camera), and Wireless Pro Fitting (₹349/camera). Never bundles coaxial/CAT6 cables, PoE switches, SMPS, or RJ45/BNC connectors.
- **Dedicated Wireless Labor Parity:** `PRO_INSTALL_WIRELESS` authoritatively verified server-side at ₹349/camera (`labor_wireless_pro_per_camera`) and `PRO_INSTALL_DIY` at ₹0, strictly preventing fallback to wired IP labor rates (₹500).

---

## 8. Role Isolation & Localization

### 8.1 Role & Portal Isolation
- Strict route & permission separation:
  - Customer Portal: `/portal`
  - Staff / Salesperson CRM: `/staff`
  - Installer App: `/installer`
  - Admin Console: `/admin`
- Staff or Admin members logging into the customer portal are treated strictly as customers with zero administrative escalation.

### 8.2 Localization Standards
- Languages: English (default), Hindi, regional languages.
- Everyday colloquial vocabulary is required over archaic bookish terms (e.g., using "कम" for Low and "ज्यादा" for High instead of formal Hindi words like "अनुशंसित").
- Language selection modal appears on first visit with clean labels (no underscores).

---

## 9. Territory, Coverage & Boundary Governance

### 9.1 Zero External Dependency for Coverage Data
- **Self-Contained Operating Record:** All operational coverage boundaries, serviceability definitions, and sales partner assignments are persisted directly in the project's internal Firestore database and static geo modules.
- **Coverage Zones Collection (`coverage_zones`):** Stores polygon coordinates, circular operating radii, and associated PIN code sets. Lead routing (`lib/territory.ts`) queries this collection first.
- **Pincode Knowledge Base (`pincode_cache`):** Stores validated latitude, longitude, and sub-post office delivery micro-hubs with authentic local communicating names.
- **Internal Admin Matrix (`/admin/salespersons`):** All territory inspections, gap detections (uncovered PINs in red), and one-click assignments are performed internally without requiring external Google Maps lookups or third-party mapping subscriptions.

### 9.2 Administrative Boundary Parity & Display Rules
- **Jaipur City Boundary:** Rendered using the official Survey of India / Municipal Corporation administrative boundary fetched via Mappls GeoAnalytics SDK (`filters: "district_name='Jaipur' AND state_name='Rajasthan'"`), falling back to the 34-vertex cadastral perimeter in `lib/geo/pincodePolygons.ts`.
- **Zero Rural Clutter:** District overview maps must never render nationwide or statewide point markers. Only urban municipal PINs (e.g., `302xxx`) with active `covered` status are displayed as filled green territory polygons.
- **Centroid Locking:** Camera targeting must lock to geometric commercial centroids (`getKnownCentroid`) at zoom 11.8 for district overviews, and zoom 13.2 for individual PIN isolation.

### 9.3 4-Tier Administrative Geo Hierarchy (State → District → Tehsil → PINCODE)
- **Hierarchical Governance Architecture:** Operational serviceability is strictly organized into four tiers:
  `State` → `District` → `Tehsil / Taluka` → `PINCODE (Active vs Inactive)`.
- **Active vs. Inactive PIN Policy:** A PINCODE is marked `active` if and only if TEAM CCTV has verified installer coverage capable of 24-48h site survey and physical delivery. PINs without verified installer coverage must remain `inactive`.
- **Granular Serviceability Resolution (`/api/pincode/[pin]`):** Serviceability (`served: true`) is determined exclusively by the individual PIN's active status (via Firestore `geo_pincodes` override or the verified urban launch set). Blanket district-wide checks (e.g., treating all of Jaipur district or other cities as automatically served) are strictly prohibited.
- **Tehsil Metadata Propagation:** All public lookups, waitlist submissions, and traffic impressions MUST record the resolved `tehsil`, `district`, and `state`.
- **Bulk Tehsil Activation:** Administrators can toggle an entire Tehsil's PIN codes between `active` and `inactive` in a single batch operation from the Regional Expansion Hub (`/admin/expansion`).
- **Dynamic PINCODE Expansion:** Admins can register any new 6-digit Indian PIN code into the administrative hierarchy with custom locality, sub-district/tehsil, and activation status.

### 9.4 Universal Sub-Post Office Delivery Micro-Hubs & Coordinate Sanity Governance
- **Replacement of Artificial Compass Quadrants with Real Delivery Hubs:** The platform strictly replaces artificial 4-quadrant compass conventions (`North-West`, `North-East`, `South-West`, `South-East`) with **Official Sub-Post Office Locations & Local Communicating Names** (e.g., `Niwaru Road`, `Lata Circle`, `Khatipura`, `Bandra West`, `Koramangala`, `Talwandi`).
- **All-India Applicability Across 19,000+ PIN Codes:**
  - For curated launch PIN codes (Jaipur urban launch), authoritative micro-hubs originate from `lib/geo/jaipurQuadrants.ts`.
  - For ANY other PIN code in India, micro-hubs are dynamically extracted directly from official India Post Sub-Post Offices (`S.O.`) and Branch Offices (`B.O.`) via `https://api.postalpincode.in/pincode/{pin}`.
  - LLM prompts and synthetic landmark generators are strictly banned from generating fake quadrant labels.
- **Dynamic Hub Capacity (1 to 8 Natural Hubs):** Micro-zones are never artificially forced into a 4-cardinal grid. Single-facility PINs (e.g. `400050` Bandra West, `302005` SMS Hospital) cleanly represent their actual delivery count, while multi-beat tehsils support up to 8 primary postal delivery hubs.
- **Lead Routing Accuracy:** Lead address matching in `lib/territory.ts` directly compares customer street and colony address tokens against the local communicating name, enabling automated beat-level salesperson assignment.
- **Cross-Pincode Landmark Bleed Prevention:** Generic central city government landmarks (e.g., Vidhan Sabha, Raj Bhawan, 22 Godown, Ambedkar Circle) must NEVER be assigned to peripheral or non-central PIN codes.
- **Strict Geofenced Coordinate Bounding:** All hub markers and sub-office coordinates must pass geographical boundary sanity checks:
  - Latitude must strictly fall within `[26.50, 27.50]°N` and Longitude within `[75.40, 76.20]°E` for the Jaipur urban agglomeration.
  - Any coordinates outside these bounds (e.g., Lucknow, Delhi, Gujarat, Telangana coordinate bleed from ungrounded geocoding) are strictly rejected and automatically scrubbed to prevent map viewport distortion.

---

## 10. Wireless & Wi-Fi CCTV Systems & Hybrid Architecture

### 10.1 Mandatory Wi-Fi Connectivity Check & 4G/5G Router Injection (Option B)
- **Wi-Fi Connectivity Invariant:** Wi-Fi cameras strictly require an operational broadband Wi-Fi connection at the premises to function.
- **Guided Check Protocol:** Whenever a customer selects Wireless technology (or chooses Wi-Fi cameras in a hybrid configuration), the configurator MUST ask: *"Do you have a working Wi-Fi connection at the camera location?"*
- **Automatic Router Injection:** If the customer answers **No**, the pricing engine automatically injects a high-speed 4G/5G SIM Wi-Fi router (`ACC-4G-ROUTER` @ ₹1,885) into the quotation BOM. If the customer answers **Yes**, no router is added.
- **Hybrid System Parity:** Customers selecting wired HD or IP systems who add supplemental Wi-Fi cameras also trigger the Wi-Fi connectivity assessment and receive dedicated MicroSD cards and router support.

### 10.2 MicroSD Card Multiplication & Storage Sizing
- **Dedicated Local Storage:** Each Wi-Fi camera records locally on its own independent MicroSD memory card.
- **Quantity Formula:**
  - Pure Wireless: `MicroSD Quantity = camera_count` (1 card per camera).
  - Hybrid Systems: `MicroSD Quantity = wifi_camera_count` (in addition to the shared HDD for wired cameras).
- **H.265 Bitrate Baselines:**
  - 2MP: 8 GB/day
  - 3MP / 4MP / 5MP: 14 GB/day
  - 6MP / 8MP (4K): 22 GB/day
- **Recording Mode Multipliers:**
  - Smart Motion Detection: `0.40` (saves up to 60% card storage).
  - Continuous 24×7 Recording: `1.0`.

### 10.3 MicroSD Hardware Safety Cap (`max_sd_capacity_gb`)
- **Strict Compatibility Sizing:** Every camera specifies its maximum supported card capacity (`max_sd_capacity_gb`).
- **Safe Baseline Default:** If unspecified or missing in catalog specs, `max_sd_capacity_gb` safely defaults to **128 GB**.
- **Engine Enforcement:** The pricing engine strictly filters candidate MicroSD cards to `getCardGb(card) <= (camera.max_sd_capacity_gb || 128)`. An oversized card (e.g., 256GB or 512GB) must NEVER be automatically quoted for a camera that only supports 128GB.

### 10.4 Solar CCTV Camera Packaging Invariant
- **Bundled Solar Panels:** Solar-powered CCTV cameras are packaged and sold as complete all-in-one standalone systems. The solar panel, mounting arm, and battery bracket are included in the box.
- **No Separate Solar Panel Charge:** Solar panels must NEVER be listed or billed as a separate add-on or accessory in quotations.

### 10.5 Wireless Installation & Labor Rules
- **Wireless Pro Fitting:** Professional installation for wireless cameras is billed at `₹349/camera` (`labor_wireless_pro_per_camera`).
- **DIY Delivery:** Customers may choose DIY delivery for wireless cameras with **₹0 installation labor**.
- **Wired Hardware Exclusion:** Pure wireless configurations strictly omit DVRs, NVRs, SMPS units, PoE switches, BNC/DC/RJ45 connectors, and coaxial/LAN cabling.

### 10.6 Hardware Capabilities & Inbuilt Speaker Distinction
- **Audio Mic (`has_audio`):** Unidirectional listen-only microphone.
- **Inbuilt Speaker (`has_speaker`):** Hardware speaker enabling Two-Way Talk and Active Deterrence Siren/Alarm.
- **Auto-Tagging:** Setting `has_speaker: true` automatically activates `has_audio: true` and attaches `speaker`, `2-way`, and `audio` feature tags.

---

## 11. Camera Form Factor, PT vs. PTZ, and Multi-Lens Architecture

### 11.1 Distinct Form Factor Classification
The platform enforces clean, industry-standard camera form factors:
1. `Indoor Ceiling Dome` (`dome`): Fixed lens, indoor plastic/metal ceiling mount.
2. `Outdoor Bullet (Weatherproof)` (`bullet`): Fixed lens, outdoor wall/pole mount (`IP66` or `IP67`).
3. `Indoor Pan & Tilt (PT)` (`indoor_pt`): 360° horizontal / 90° vertical rotation, fixed lens, digital zoom only, strictly indoor unsealed housing.
4. `Outdoor Pan & Tilt (PT)` (`outdoor_pt`): 360° rotation, fixed lens, digital zoom only, weatherproof sealed housing (`IP66`).
5. `Commercial PTZ (Motorized Optical Zoom)` (`ptz`): 360° rotation with motorized physical moving glass lenses (4x, 10x, 25x, 32x optical zoom).
6. `Multi-Lens Multi-Sensor (Dual / Triple / Quad)` (`multi_lens`): 2, 3, or 4 lenses integrated into a single physical unit.
7. `Turret / Eyeball` (`turret`): Flat-faced ball-and-socket dome.
8. `Wire-Free / Battery Powered` (`wire_free_battery`): Battery or Solar standalone units.
9. `Smart Video Doorbell` (`video_doorbell`): Entrance intercom and camera.

### 11.2 PT vs. PTZ Engineering Distinction
- **PT (Pan & Tilt):** Rotates on 2 axes with a fixed focal length lens (3.6mm/4mm). Features only digital zoom (pixel crop). Low-cost consumer/SOHO models (₹1,400 to ₹4,500).
- **PTZ (Pan-Tilt-Zoom):** Rotates on 2 axes AND possesses motorized optical zoom lenses with physical optical magnification (`optical_zoom_x > 1`). High-end commercial models (₹15,000 to ₹60,000+).

### 11.3 Indoor vs. Outdoor Weatherproofing Isolation
- Indoor requirements strictly resolve cameras with `ip_rating === "Indoor"` or form factors `dome`, `turret`, or `indoor_pt`.
- Outdoor requirements strictly resolve weatherproof cameras with `ip_rating` in `["IP65", "IP66", "IP67"]` or form factors `bullet`, `outdoor_pt`, or `ptz`.
- Indoor plastic cameras must NEVER be quoted or allocated to outdoor positions.

### 11.4 Multi-Lens Camera Architecture & System Sizing
- **Lens Archetypes:**
  - `Fixed Overview + Pan-Tilt (PT)`: 1 or 2 fixed wide lenses (24/7 overview) + 1 rotating PT dome (smart auto-tracking).
  - `Fixed Overview + Motorized PTZ Zoom`: 1 fixed overview + 1 high-speed optical zoom dome.
  - `Panoramic 180° / 360° Stitched`: Multiple fixed lenses seamlessly stitched into one wide picture.
  - `Multi-Directional Independent`: Multiple adjustable fixed lenses aimed in separate directions.
- **NVR Channel Consumption (`nvr_channels_consumed`):**
  - Stitched or standalone Wi-Fi cameras consume **1 channel**.
  - Multi-stream IP cameras consume independent ONVIF channels (e.g. 2, 3, or 4 channels). The configuration engine sizes the NVR capacity to `sum(camera_count * nvr_channels_consumed)` to prevent undersized recorders.
- **Storage Multiplier (`recording_streams_count`):**
  - Cameras recording multiple simultaneous 24/7 video streams multiply daily gigabyte storage requirements by the number of active recording streams.

---

## 12. Hybrid CCTV Architectures (Wired + Wireless in Single Quotation)

### 12.1 Definition & Commercial Rationale
A **Hybrid CCTV System** combines a central wired CCTV setup (Analog HD with DVR or Network IP with NVR) with standalone wireless Wi-Fi or 4G cameras within a single quotation, invoice, and bill of materials. This is purpose-designed for customer properties where detached gates, perimeter boundary walls, terrace gardens, remote outbuildings, or finished interior spaces make central video cabling impractical, unsightly, or cost-prohibitive.

### 12.2 Recorder (DVR/NVR) Capacity Sizing Invariant
- **Local Recording Independence:** Wireless cameras record locally to onboard MicroSD cards and stream directly via mobile apps (e.g. Tapo, Imou, CP Plus). They do NOT connect to or consume physical video channels on the central DVR or NVR.
- **Strict Sizing Formula:** Central DVR/NVR channel capacity is sized strictly to `wiredCamCount`:
  $$\text{Recorder Sizing Capacity} = \text{wiredCamCount} = \text{camera\_count} - \text{wifi\_camera\_count}$$
- **Capacity Alert Enforcement:** Channel capacity alerts (e.g. 4Ch, 8Ch, 16Ch) in Pro Builder and Guided Setup compare `wiredCamCount` against `recorder.channel_count`. For example, a 3 Wired IP + 1 Wi-Fi system strictly pairs with a 4-Channel NVR, avoiding premature upselling to an 8-Channel unit.

### 12.3 Dual-Storage Architecture (Surveillance HDD + Dedicated MicroSD Cards)
- **Co-Allocation:** Hybrid systems require both storage media to be co-allocated in the Bill of Materials:
  1. **Surveillance HDD:** Quantity 1, sized dynamically to meet the backup retention target for wired cameras recording to the central recorder.
  2. **MicroSD Cards:** Quantity = `wirelessCamCount`, dedicated to each wireless camera, sized to the customer's recording preference (Continuous vs. Motion) and capped by each camera's `max_sd_capacity_gb` (safely defaulting to 128GB).
- **Pro Builder UI:** Step 3 displays a dual-storage banner and tabbed filters (`All Storage`, `Surveillance HDDs`, `MicroSD Cards`) to allow selecting both HDD and MicroSD cards simultaneously.

### 12.4 Transmission Cabling & Connectors Sizing Invariant
- Wireless cameras require zero coaxial or LAN transmission cabling back to the central recorder and zero BNC/DC/RJ45 connectors:
  - **RJ45 Connectors:** `(wiredCamCount * 2) + 2` (uplink ports).
  - **BNC Connectors:** `wiredCamCount * 2`.
  - **CCTV Cable Coils:** `Math.max(1, Math.ceil(wiredCamCount / 4))` coils.
  - **Waterproof Junction Boxes:** Billed per camera position as selected by the customer.

### 12.5 Power Device (PoE Switch / SMPS) Sizing Invariant
- Wireless cameras are powered by individual 12V/5V DC adapters plugged into local power points, or integrated solar/battery modules. They do NOT draw power from the central SMPS or PoE switch.
- Central SMPS channel count and PoE switch port capacity size strictly to `wiredCamCount`.
- Example: 3 Wired IP + 1 Wi-Fi camera utilizes a 4-port PoE switch, NOT an 8-port switch.

### 12.6 Labor & Installation Separation
- **Dual Labor Lines:** Hybrid quotations separate installation labor into distinct transparent lines:
  1. **Wired Camera Installation:** Billed at `PRO_INSTALL_IP` (₹500/camera) or `PRO_INSTALL_HD` (₹400/camera), covering video cabling pulling up to 15m, connector termination, camera mounting, and recorder setup.
  2. **Wireless Camera Fitting:** Billed at `PRO_INSTALL_WIRELESS` (₹349/camera) for physical mounting and app/Wi-Fi pairing, or `PRO_INSTALL_DIY` (₹0) if self-installed.
- **Server Parity & Verification:** `app/api/quote/save/route.ts` and `lib/pricing-engine.ts` independently evaluate wired vs. wireless camera counts to ensure 100% mathematical parity across Guided Setup and Pro Builder.


