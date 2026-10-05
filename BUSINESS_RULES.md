# TEAM CCTV Platform - Core Business & Pricing Rules

**IMPORTANT FOR ALL AI AGENTS:** Always read this file before modifying ANY code related to pricing, margins, catalog filtering, checkout, or quote generation.

## 1. Catalog & Inventory Rules (Strict)
- **Active Products Only:** We only use real products from the vendor catalog. We strictly forbid injecting "fake", hardcoded, or "fallback" products (e.g., defaulting to a fake "500GB HDD" if one isn't found). If it is not in the DB, it cannot be quoted.
- **Stock Status is Ignored:** If a product has `is_active = true`, it is fully eligible for quotation regardless of its `stock_status` (even if marked as "out_of_stock" or "discontinued"). We have tie-ups with vendors and can source them on demand. Do not filter out out-of-stock items from the quotation flow.
- **Overflow & On-Demand:** If a customer requires an extreme configuration (e.g. 6.72TB of storage), and no DB product fulfills it, automatically capture it as a "lead" so the team can manually arrange the BOM. Show them a downgraded estimate using available products so they don't hit a dead end.

## 2. Server-Side Trust & Payment Flow
- **Never Trust The Client:** The frontend (Client) is never trusted with calculating the final price. All final calculations, including Custom Build shopping carts and Guided Setup snapshots, MUST be strictly recalculated on the server (via `app/api/quote/save/route.ts` and `pricing-engine.ts`) before a quote or payment link is generated.
- **Payment Link Generation:** We generate Razorpay Payment Links server-side (using the recalculated amount) with a webhook callback `callback_url`. The Razorpay Webhook is the single source of truth for payment success.
- **Visible Escape Hatches:** Always provide a visible "escape hatch" in the UI for payments (e.g., "Trouble with the payment window? Click here") so customers aren't stuck waiting for timeouts.

## 3. Pricing Engine Architecture
- **Mathematical Parity:** The "Guided Setup" (`lib/pricing-engine.ts`) and "Custom Build" (`app/api/quote/save/route.ts`) must have **100% mathematically identical pricing and rules**. Custom Build is not a simple "cart" — it must rigorously apply all the same limits and rules as Guided Setup.
- **MarginEngine Application:** 
  - Hardware (Cameras, Recorders, Storage, Accessories) strictly follow the dynamic rules in `lib/margin-engine.ts`.
  - The system dynamically looks up specific margins configured in the Admin Panel (e.g. `margin_hdd`, `margin_cctv_camera`, `margin_connectors`) before defaulting to generic category margins. Always check the Admin margins!

## 4. Installation & Cabling Labor Rules (Strictly "As Per Market")
Unlike hardware, **LABOR AND INSTALLATION COSTS NEVER RECEIVE A MARGIN MARKUP**. They are strictly pegged to local market rates to remain competitive. Do not apply `labor_margin` to these line items:
- **Full Installation:** If the customer needs cables pulled (`cabling_done = false`), the base labor rate is strictly ₹500 per IP camera and ₹400 per HD camera.
- **Fitting Only:** If the customer already has cables pulled (`cabling_done = true`), they are charged a strict "Fitting Only" rate of ₹300 per camera (or configured `labor_fitting_only_rate`).
- **Excess Cabling Labor:** Customers receive 15 meters of free cable pulling labor per wired camera. Any cable pulled beyond this limit is charged at a strict market rate of ₹15 per extra meter. This rule applies to BOTH Guided Setup and Custom Build.
- **Surcharges:** Site-specific labor surcharges (e.g., Marble drilling) are charged exactly at their base cost with no margin added.

*Note: You must ensure any updates to `pricing-engine.ts` are perfectly mirrored in `app/api/quote/save/route.ts` so the "two ways of customer journey" never diverge in price.*
