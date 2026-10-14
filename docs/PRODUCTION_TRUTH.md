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

---

## 4. Catalog Integrity & Test Hygiene Guardrails
1. **Zero Fake Products Policy:**
   - No mock/placeholder SKUs (e.g. `"Test Camera"`, `"TEST-CAM"`) are permitted in the catalog or quotation pipeline.
   - All 68 active products must represent genuine hardware from verified OEMs (CP Plus, Hikvision, Dahua).
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

