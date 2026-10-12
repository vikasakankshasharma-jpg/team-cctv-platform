# TEAM CCTV Platform - Master Core Business & Operating Rules

> **CRITICAL DIRECTIVE FOR ALL AI AGENTS & DEVELOPERS:**  
> This file is the single, authoritative source of commercial, architectural, and operational truth for the TEAM CCTV Platform (`cctvquotation.com` / `secure-easy`).  
> ALWAYS consult and strictly adhere to these rules before modifying ANY code related to pricing, margins, catalog filtering, hardware configuration, customer journeys, installer workflows, partner commissions, or checkout.

---

## 1. Catalog & Inventory Rules (Strict)

### 1.1 Active Products Only
- **Zero-Tolerance for Mock / Fake Products:** The system must NEVER inject hardcoded, artificial, or "fallback" products (e.g., legacy fallback 500GB HDD, mock sensors, or fictitious SKUs). If a product does not exist with an active record in the Admin Database, it MUST NEVER be quoted.
- **Stock Status vs. Active Status:** If a product has `is_active = true`, it is **fully eligible for quotation** regardless of whether `stock_status` is marked as `"out_of_stock"` or `"backordered"`. TEAM CCTV maintains verified vendor tie-ups and procures inventory on demand. Out-of-stock items must NOT be hidden or skipped if `is_active = true`.
- **Add-on vs. Routine BOM Products:** Products flagged with `is_addon = true` are strictly designated as optional upsell accessories (e.g., display monitors, HDMI splitters, 4G Wi-Fi routers) in "Add-ons & Accessories For Your System" and are excluded from routine automatic BOM generation.

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

## 5. Geographical Coverage, Mapping & Tehsil Quadrants

### 5.1 Mapping Infrastructure
- **Mappls (MapmyIndia):** Primary mapping provider for Indian address accuracy, district/tehsil boundaries, and pincode mapping.
- **Google Maps & OpenStreetMap (OSM):** Automatic secondary fallbacks.
- **Map Pin-Drop:** Customers drop a pin to capture their exact geolocation, auto-populating address fields.

### 5.2 Administrative Hierarchy
- `State` → `District` → `Tehsil` → `PINCODE` → `4 Quadrants / Micro-Zones`.

### 5.3 4-Quadrant Partitioning Strategy
- Government sub-post office names are converted into 4 intuitive, equal-partition quadrants anchored by well-known local landmarks:
  1. **North-West Zone**
  2. **North-East Zone**
  3. **South-East Zone**
  4. **South-West Zone**
- **Visual Map Indicators:**
  - Red circles: Unselected / Uncovered zones.
  - Blue circles: Selected / Serviceable zones.
- **Batch Tools:** Admin console provides a "Gen All Quadrants" tool to automatically generate quadrant partitions for all PINCODEs in a selected Tehsil/District.

### 5.4 Tri-Factor Coverage Enforcement
Serviceability is verified by matching against:
1. Assigned 4-Quadrant micro-zone.
2. Circular Operating Radius (e.g., 15 km from service hub).
3. Polygon Boundary Tool drawn in the Admin Console.

### 5.5 Multi-Tier Boundary Resolution & Centroid Targeting
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
