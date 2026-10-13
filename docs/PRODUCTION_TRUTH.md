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

