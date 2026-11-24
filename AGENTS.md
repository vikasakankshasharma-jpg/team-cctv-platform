# TEAM CCTV PLATFORM — CORE AGENT INSTRUCTIONS & ARCHITECTURE RULES

## 1. Core Quotation Architecture: Brand & Resolution Matrix (Permanent Ban on 3-Tiers)

**CRITICAL INVARIANT:** Never confuse or revert the quotation presentation strategy for this project.

1. **Permanently Banned Old Strategy:**
   - **NO** `"Plan 1: Value / Budget"`, `"Plan 2: Recommended / Pro"`, `"Plan 3: Premium / 4K"`.
   - **NO** arbitrary marketing tiers (`"Essential"`, `"Smart Plus"`, `"Pro Elite"`, `"Value"`, `"Pro"`, `"Premium"`, `"Elite"`).
   - Real customers do not think in canned buckets. Do not generate, propose, or document 3-tier packages.

2. **The Ground Truth: Brand & Resolution Variations (`DynamicVariantGenerator.tsx`):**
   - Quotation variations are generated and identified strictly by **Hardware Attributes**:
     `${Brand}_${Technology}_${Resolution}`
   - **Active Brands:** CP PLUS, HIKVISION, DAHUA, TRUEVIEW, PRAMA, HI-FOCUS, Budget Brand.
   - **Active Resolutions:** 2MP Full HD, 3MP Super HD, 4MP Quad HD, 5MP Ultra HD, 8MP 4K Ultra.
   - **Active Technologies:** Standard HD (Analog Copper), Digital IP (Network PoE), Smart Wi-Fi (Wireless), 4G SIM Cellular (Standalone), Hybrid Pro (HD + Wi-Fi).
   - **Storage Durations:** 7 Days, 15 Days, 30 Days, 45 Days, 60 Days (using WD Purple, Seagate SkyHawk, or Toshiba Surveillance drives).
   - **Technical Feature Badges:** Built-in Mic Audio, Color Night Vision, Weatherproof IP67, 360° PTZ, 4G SIM.

3. **Authentic Specification Naming Mandate:**
   Package titles must ALWAYS and EXCLUSIVELY be derived from real hardware attributes:
   `{cameraCount}-Camera {brand} {resolution} {technology} Package [({storageDetails})]`
   *Examples:*
   - `4-Camera CP Plus 2MP HD Package (1TB Storage)`
   - `4-Camera Hikvision 5MP IP Package (2TB Storage)`
   - `4-Camera Trueview 3MP Smart Color Package (1TB Storage)`
   - `4-Camera TP-Link WiFi HD Wireless Package (128GB MicroSD)`

## 2. Commercial Accounting Invariant: All Prices Are GST-Paid (18% Inclusive Standard)

- All base wholesale costs and customer retail selling prices are **GST-PAID (18% inclusive standard)**.
- Reverse Tax Calculation:
  $$\text{Taxable Base} = \frac{\text{Gross Selling Price}}{1.18}$$
  $$\text{18% GST} = \text{Gross Selling Price} - \text{Taxable Base}$$
- Guaranteed ₹0.00 mathematical reconciliation: $\text{Taxable Base} + \text{18% GST} = \text{Gross Total}$.
- No customer is surprised with hidden tax additions at checkout.

## 3. Offline Tools & Parity
- Offline Excel Workbooks ([`TEAM_CCTV_Offline_Quotation_Engine.xlsx`](file:///c:/Users/hp/Documents/TEAM%20Website/TEAM_CCTV_Offline_Quotation_Engine.xlsx) in root and [`secure-easy/TEAM_CCTV_Offline_Quotation_Engine.xlsx`](file:///c:/Users/hp/Documents/TEAM%20Website/secure-easy/TEAM_CCTV_Offline_Quotation_Engine.xlsx)) are 1:1 duplicates of the live website, driven by the Brand & Resolution dropdown in Cell `D25` and Brand variation cards in Columns F, G, H.

## 4. WhatsApp Omnichannel Customer Journey & Resilience Invariants

1. **11-Language First-Touch Selection & Layman Phrasing:**
   - The very first interaction presents a bilingual (English + Hindi) welcome message offering numbered options (1 to 11) for all 11 supported Indian languages (`en`, `hi`, `mr`, `gu`, `ta`, `te`, `kn`, `bn`, `ml`, `pa`, `or`).
   - Customer communicates throughout in their chosen language.
   - All conversational copy strictly uses natural, colloquial layman phrasing (e.g., "घर / फ्लैट", "दुकान / ऑफिस", "तार वाला (Wired)", "बिना तार (Wireless)", "कम / ज्यादा") — no bureaucratic jargon or synthetic words like "अनुशंसित".

2. **Hybrid Direct Numeric Input + Quick-Tap Buttons:**
   - For all quantity prompts (outdoor bullets, indoor domes, wireless cameras), the system presents hybrid quick-tap buttons (`[ 2 ]`, `[ 4 ]`, `[ 8 ]`) AND natively accepts any direct typed integer (`1` to `32`).
   - Direct numerical reply takes immediate precedence, minimizing customer keystrokes and friction.

3. **Option A: 2-Button Checkpoint (`[ ✅ Done (Proceed) ]` and `[ ✏️ Change Qty ]`):**
   - At the camera configuration summary, the bot renders strictly 2 spacious action buttons complying with Meta Cloud API constraints ($\le 3$ buttons, title $\le 20$ chars):
     - `[ ✅ Done (Proceed) ]` (`wf_done_proceed`)
     - `[ ✏️ Change Qty ]` (`wf_change_qty`)
   - Banned: Asking redundant `"Add Wireless"` prompts when customer has already completed their camera count.

4. **Non-Destructive Camera Edit Flow (`ASK_CAMERA_EDIT_CHOICE`):**
   - Tapping `[ ✏️ Change Qty ]` or typing "change qty" / "edit camera" intercepts into an interactive modifier without wiping customer session data (Language, Property Type, Pincode remain 100% preserved).
   - Allows targeted re-prompting of Outdoor Bullets, Indoor Domes, or Wireless Cameras with real-time recalculation before returning to the 2-button confirmation.

5. **Media & Off-Topic Input Resilience Engine:**
   - **Unrelated Media / Images / Documents:** If a customer sends an image, sticker, audio, or video at any step, the journey NEVER breaks. The engine retains session state, acknowledges receipt, politely explains that images can be reviewed during the site survey, and re-prompts the exact pending question with its action buttons.
   - **Name Protection Filter:** Intercepts pricing queries (e.g., "rate kya hai", "price list", "discount") or generic greetings sent during the name capture step, preventing false customer names and politely re-asking for their real name.
   - **Accidental Mobile in Pincode Step:** Intercepts 10-digit mobile numbers typed at the pincode prompt, maps/validates phone, and re-prompts for the 6-digit area pincode.
   - **Universal Phone Normalization:** Standardizes all incoming phone variants (`+91`, `91`, `0`-prefix, 10-digit) to canonical `91XXXXXXXXXX`.
   - **Zero `[object Object]` Invariant:** All webhook loggers, customer notices, client error banners/toasts (`extractErrorMessage()` in `lib/utils.ts`), and API error handlers sanitize message inputs and error objects to guarantee human-readable strings.
   - **Env Sanitization & MSG91 OTP Dispatch Invariant:** Always sanitize integration env vars and sender phone numbers with `cleanEnvVar()` / `cleanPhoneEnvVar()` (`lib/env-utils.ts`) to prevent Vercel CRLF corruption, and route OTP templates through `Msg91WhatsAppProvider.sendOtpTemplate()` (`lib/whatsapp/msg91-provider.ts`).
   - **Cross-Device WhatsApp App Launcher Invariant:** Launchers in `lib/whatsapp.ts` and `WhatsAppOtpNotice.tsx` must use native synchronous `<a href="whatsapp://send?phone=...">` protocol links (never bare `whatsapp://` or hidden `<iframe>` elements) with iPadOS touch detection and adaptive `https://wa.me/...` (mobile) / `https://web.whatsapp.com` (desktop) fallback after `1600ms`.

## 5. Profit Waterfall, Services Accounting & Overhead Invariants

1. **Item Classification Precedence (`classifyItem()` in `lib/quotation-profit.ts`):**
   - Evaluates Services (`service`, `amc`, `commission` via word-boundary regex `/\bcommissions?\b/` and `/\bamc\b/` so items like `"Installation & Commissioning"` stay in `service`) before Cables (`cab-`, `3+1`, `cable`, `wire`) and Accessories/Junction Boxes before Cameras, preventing cables and boxes from inflating Camera counts.
2. **Services Bucket Accounting (Paid/Promo AMC & Referral Commissions):**
   - **Paid AMC & Free Promo AMC:** Quote AMC add-ons (`amc_1yr`, `amc_2yr`, `amc_3yr`, `promo_free_amc`) and linked `amc_subscriptions` / `amc_contracts` count directly inside the **Services** bucket with deduplication to prevent double-counting checkout AMC records; complimentary promo AMC carries technician PM visit fulfillment reserve.
   - **Referral & Partner Commissions (`resolvePromoterCommission()` in `lib/commission.ts`):** B2B commission slabs (`commission_slabs`), B2C ₹500 refer-and-earn payouts, salesperson commissions, and actual `commission_records` / `commissions` deduct inside the **Services** bucket (`services.cost` / `services.profit`) and never manufacture phantom commissions when a manual admin discount is applied without a referral code.
3. **True Net Pocket Profit & Operating Overheads (`lib/cached-settings.ts`, `SettingsForm.tsx`, `lib/profit-context.ts`):**
   - Admin-configurable reserves (`amc_fulfillment_cost_percent`, `payment_gateway_fee_percent`, `warranty_reserve_percent`, `logistics_consumables_per_job`, `travel_fee_payout_percent`) plus actual Razorpay MDR fees (`payment_history.razorpay_fee`, ₹0 for cash/direct UPI) compute `overheads` (`total_overheads`, `net_profit`, `net_margin_percent`) across CRM lead deals (`QuotationProfitBreakupCard.tsx`) and portfolio analytics (`/admin/analytics/profitability`) without altering GST-inclusive customer `total_payable`.

## 6. Interactive Page-by-Page Guided Tour Invariants (`components/tour/`)

1. **Journey-Wise / Per-Step Micro-Tours:**
   - Rather than a massive upfront walkthrough, guidance is delivered contextually per page or wizard step (`activeStep={step}`) or per page route via `InteractivePageTour.tsx`.
   - Focuses strictly on **Layman Hardware Impact**: explaining what changing camera quantities, technology (HD vs IP), or storage days actually does to hardware, cabling, and GST-inclusive pricing.
2. **User Agency & Non-Intrusive Controls:**
   - **`[ Next / Try It ]`**: Progresses to the next spotlighted element on the current step.
   - **`[ Skip ]`**: Closes the guide only for the *current step* (`team_tour_page_skip:<pageId>`).
   - **`[ Don't show guides automatically again ]`**: Globally disables auto-launching across the platform (`team_tour_skip_all: true` in `localStorage`).
   - **Header Persistent Trigger (`[ 💡 Guide ]`)**: A compact pill is pinned inside page/wizard headers via `renderTrigger`, ensuring zero layout overlap with floating WhatsApp widgets or sticky bottom CTA bars.
3. **Mobile-First UX & Compositor Motion:**
   - **Dynamic Viewport Inversion:** If the target element's center is in the lower half of the screen, the guide card flips to the top; if in the upper half, it docks to the bottom. Never obscures the button the user needs to touch.
   - **Body Scroll Locking:** Automatically locks body scroll (`document.body.style.overflow = "hidden"`) during active spotlights to prevent viewport misalignment on touchscreens.
   - **iOS Safe-Area:** Utilizes `env(safe-area-inset-bottom)` for iPhone home indicator safety.
   - **Compositor Motion:** Uses GPU-friendly `translate3d`, static `supports-[backdrop-filter]:backdrop-blur-[1px]`, ring-only pulsing (`animate-tour-pulse`), and `@media (prefers-reduced-motion: reduce)`.
4. **Full Omnichannel Persona Coverage:**
   - Customer Builder (`cctv-wizard`, `quote-catalog`, `quote-review`), Operations (`track-booking`, `customer-dashboard`), Admin Deal Closer (`admin-deal-tour`), Installer On-Site Mobile Card (`installer-job-tour`), and Partner Portal (`partner-leads-tour`, `partner-commissions-tour`).
5. **Decoupled Telemetry Layer (`lib/analytics/tour-analytics.ts`):**
   - Emits allow-listed events (`tour_started`, `tour_step_viewed`, `tour_completed`, `tour_skipped`, `tour_skip_all`) via synchronous custom DOM events and lazy-loaded Firebase Analytics. Enforces zero PII leakage (no customer names, phones, emails, order/quote IDs, or secret PINs).
6. **Certified Core Isolation:**
   - The tour engine is strictly a **read-only visual presenter / observer**. It has zero authority to mutate pricing, 18% GST tax math, hardware BOM, or quotation state.
7. **Tour Drop-off & Funnel Telemetry Dashboard (`lib/analytics/tour-funnel-calculator.ts`, `TourPerformanceWidget.tsx`):**
   - Pure functional aggregation converting raw tour telemetry into a structured `TourFunnelDataset` with per-screen `starts`, `completions`, `completionRate`, and step-by-step `dropOffRate` / `skipRate`.
   - Renders live in `/admin/analytics/funnel` with highest drop-off step detection and global "Skip All" metric.
8. **11-Language Modular Lazy-Loaded Localization Architecture (`locales/tours/[locale].json`, `lib/i18n/tour-translations.ts`):**
   - Supports all 11 Indian languages (`en`, `hi`, `mr`, `gu`, `ta`, `te`, `kn`, `bn`, `ml`, `pa`, `or`) dynamically loaded on-demand to protect mobile bundle size.
   - Enforces colloquial layman phrasing (e.g. "तार वाला", "बिना तार", "18% GST पहले से शामिल है", "हमारा बेहतर विकल्प", zero bureaucratic jargon).

## 7. Global AI Gateway Single-Chokepoint Consolidation (`lib/ai/ai-gateway.ts`)

1. **Zero Direct AI Imports Outside Gateway:**
   - All generative AI, LLM inquiries, catalog enrichment, and natural language tasks must route strictly through `AIGateway.generateResponse()` (`lib/ai/ai-gateway.ts`).
   - Direct imports of `@google/genai`, `@google-cloud/vertexai`, or raw Gemini endpoints anywhere else in the repository are strictly prohibited.
2. **Deterministic Positive Authorization & Bounded Budgets:**
   - Every AI request requires positive authorization, purpose categorization, and bounded token allocations (maximum 1,024 output tokens per turn).
   - In-memory catalog caching and SHA-256 prompt fingerprinting prevent redundant API calls for unchanged catalog questions.
3. **L2 Persistent Observability Ledger (`ai_usage_ledger`):**
   - Every invocation logs token metrics, model execution latency, caller role, and resolution status to Firestore `ai_usage_ledger` for cost tracking and security auditing.
   - Non-blocking asynchronous writes ensure zero latency impact on customer-facing interactions.
4. **Zero-Cost Circuit Breakers:**
   - Rate limiters and fallback guards intercept quota exhaustion, gracefully returning pre-configured rule-based catalog fallback responses without degrading customer UX.

## 8. Multi-Stage Customer Refund Protocol & Section 34 Credit Notes (`app/api/payment/refund/route.ts`, `components/admin/RefundDialog.tsx`)

1. **3-Stage Refund Architecture:**
   - **Stage 1 (Advance Booking Refund):** Full cancellation prior to dispatch; 100% refund of the ₹500 booking token.
   - **Stage 2 (Part-Payment Dispatch Cancellation):**
     - *Stage 2A:* 100% cancellation after 90% payment prior to field handover (returns both booking fee and milestone payment).
     - *Stage 2B:* Partial adjustment / hardware downgrade while keeping the job active (refunds the price delta).
   - **Stage 3 (Post-Installation Settlement / Goodwill Refund):**
     - *Stage 3A:* Goodwill adjustment on final 10% payment for site discrepancies.
     - *Stage 3B:* Complete post-installation contract return and full refund upon physical equipment recovery.
2. **Statutory Reverse-GST Reconciliation (18% Inclusive Standard):**
   - In accordance with Section 34 of the CGST Act, every customer refund automatically issues a matching Credit Note.
   - Reversal math mirrors the 18% inclusive standard:
     $$\text{Credit Taxable Base} = \frac{\text{Refund Amount}}{1.18}$$
     $$\text{Credit 18% GST} = \text{Refund Amount} - \text{Credit Taxable Base}$$
   - Guaranteed ₹0.00 mathematical reconciliation across accounting ledgers.
3. **Razorpay API Integration & Idempotency:**
   - Programmatic refund execution routes through Razorpay with deterministic idempotency keys (`refund_${paymentId}_${amount}_${timestamp}`) and audit logging to prevent double-refunds.

## 9. Third-Party Delivery & Subcontractor Handshake Invariants (`app/d/[token]/`, `lib/taxation-engine.ts`)

1. **Public Magic Link Security (`/d/[token]`):**
   - Zero-authentication tokenized access for external couriers (Porter, Dunzo, third-party riders) with cryptographic UUID tokens, expiry guards, and strict field projection security.
2. **Strict Zero-Cash Authority Invariant:**
   - External delivery personnel and subcontractors have ZERO authority to collect cash.
   - If the 90% milestone payment remains unpaid, the token screen displays a payment lockout (`PAYMENT_REQUIRED`); the 4-digit delivery handover OTP cannot be validated until the payment is confirmed online via Razorpay/UPI.
3. **Subcontractor Section 194C TDS Withholding (`TaxationEngine` in `lib/taxation-engine.ts`):**
   - Applies statutory Indian Income Tax TDS rules on contractor payouts exceeding threshold:
     - 1% for Individual freelance contractors with valid PAN.
     - 2% for Registered Subcontractor Firms (e.g. Porter Logistics agency) with valid PAN.
     - 20% Penal Rate under Section 206AA if PAN is missing or invalid.
4. **Promoter Section 194H TDS Withholding:**
   - 5% statutory TDS on broker/partner referral commissions exceeding ₹15,000 threshold with valid PAN; 20% penal rate without PAN.
5. **Field Delivery Exception Handling:**
   - Couriers can submit standardized delivery failure reports (`CUSTOMER_UNAVAILABLE`, `PREMISES_CLOSED`, `REFUSED_DELIVERY`, `WRONG_ADDRESS`) via `reportPublicDeliveryFailure`, triggering instant alerts to the central dispatch hub and synchronizing `/track/[id]`.

## 10. Salesperson CRM & Lead Assignment Dual-Pointer Sync (`lib/salesperson-utils.ts`, `app/api/admin/salespersons/me/`)

1. **Atomic Dual-Pointer Synchronization:**
   - Whenever a lead is assigned or reassigned to a salesperson, both `assigned_to_salesperson_id` and `assigned_salesperson_id` must be updated atomically to guarantee consistency across `/salesperson/leads`, `/salesperson/dashboard`, and `/admin/leads`.
2. **Margin-Protected Price Match Governance:**
   - Salesperson manual discount authority is strictly bounded by individual commercial margin ceilings.
   - Competitor counter-offers exceeding the salesperson's discount ceiling automatically trigger an approval escalation flag (`requires_manager_approval: true`), requiring Sales Manager or Super Admin sign-off before quote synchronization.

## 11. Internal Catalog Price Sovereignty & Zero External Speculation Invariant

1. **Internal Catalog Ground Truth:**
   - The platform's internal product database (`data/mega-products.generated.json`, active inventory, Firestore `products`) is the **sole, immutable ground truth** for all wholesale costs, component rates, and GST-inclusive customer retail selling prices.
   - **Permanent Ban on External Speculative Price Auditing:** Never second-guess, dispute, override, or evaluate internal catalog prices against external memories, assumptions, or outdated third-party estimates.
   - Real-world surveillance-grade components (such as Toshiba S300, WD Purple, Seagate SkyHawk, high-end PoE switches) reflect real distributor and e-commerce listings (e.g. Amazon India listing Toshiba S300 2TB at ₹14,999+). The internal catalog rates (e.g. ₹12,065) represent verified vendor-backed pricing and must be respected 100% without modification unless explicitly updated by an authorized admin.
2. **Pricing Engine Determinism:**
   - The quotation and pricing engine (`pricing-engine.ts`) must strictly compute line items, margins, and taxes directly from the database and active vendor catalog snapshots.
   - No agent, AI gateway prompt, or automated test is permitted to flag or alter catalog item prices based on external web benchmarks.

## 12. Universal CAT6 Dual-Compatibility Invariant (HD Analog & IP Systems)

1. **Dual-Use CAT6 Standard:**
   - Installers and field technicians natively utilize CAT6 Pure Copper UTP cable for **both HD Analog and IP installations**.
   - Modern surveillance practice splits the 4 twisted pairs (8 cores) of CAT6 for HD Analog systems: dedicated twisted pairs are utilized directly for high-definition video transmission and 12V DC power delivery using standard BNC connectors and DC power pins.
   - For typical residential and commercial cable distances (< 60–90 meters), solid pure copper CAT6 carries 2MP, 3MP, and 5MP Turbo HD/AHD/CVI signals crisply without requiring external video baluns.
2. **Future-Proof Infrastructure Certification:**
   - Quoting CAT6 Pure Copper cable with BNC connectors and DC power pins is an authorized, standard, and superior installation topology.
   - It guarantees future-proofing: the customer gets high-grade network cabling today that is ready for an instant, seamless upgrade to digital IP cameras in the future without breaking walls or replacing wiring.
   - Agents, audit tools, and BOM verifiers must **never** flag CAT6 paired with BNC connectors or DC pins as a cabling mismatch.

## 13. Strict Hardware Topology Alignment, Cabling Optimization & Brownfield Decision Matrix

1. **Strict Hardware Topology Alignment (Permanent Ban on Frankenstein Mixing):**
   - The pricing and quotation engine enforces strict architectural separation between transmission and recording subsystems:
     - **HD Analog Systems:** Must ALWAYS and EXCLUSIVELY pair with an **HD DVR** (Digital Video Recorder), **12V Central SMPS Power Supply**, **BNC Video Connectors**, and **12V DC Power Pins**. NEVER quote an NVR or PoE Switch for HD analog cameras.
     - **Digital IP Systems:** Must ALWAYS and EXCLUSIVELY pair with an **NVR** (Network Video Recorder), **PoE Switch** (or PoE NVR), and **RJ45 Modular Connectors**. NEVER quote a DVR, SMPS, or BNC/DC pins for IP cameras.
     - **Hybrid Systems (Mixed Wired + Wi-Fi):** The wired portion strictly abides by its respective technology (HD DVR + SMPS + BNC/DC or NVR + PoE + RJ45), while the wireless cameras utilize dedicated MicroSD cards and mounting/pairing labor.
     - Package titles must dynamically reflect the true topology (e.g., `4-Camera CP Plus 2MP HD Package`, `4-Camera Hikvision 5MP IP Package`, `7-Camera Hikvision Hybrid HD + Wi-Fi Package`).

2. **Cable Cost Optimization for New HD Installations (3+1 vs. CAT6 Cheaper Price Check):**
   - HD Analog setups natively support two authorized cabling options: **3+1 Coaxial CCTV Cable** and **CAT6 Pure Copper LAN Cable**.
   - When a new HD quote is generated without explicit user cable pinning, the pricing engine runs a knapsack bundle/meter evaluation across BOTH cable types and automatically selects the **cheaper total retail cost to the customer**.
   - If costs are equal, CAT6 is prioritized because it offers the customer future-proof upgradability to digital IP cameras without rewiring.

3. **Brownfield / Existing Cabling Compatibility Matrix:**
   - **Existing 3+1 Coaxial Cabling:** 3+1 cable physically cannot transmit digital Ethernet/PoE signals. The pricing engine and quotation catalog strictly offer **HD Analog CCTV camera** packages only. Digital IP options are marked as incompatible ("Requires CAT6 cabling").
   - **Existing CAT6 Cabling:** CAT6 supports both digital IP (PoE) and HD Analog (via twisted pair cores). The quotation engine actively empowers the customer with **both HD Analog AND Digital IP** quotation options.
   - **Faulty Camera Replacement on Existing Setup:** Strictly quote **HD Analog CCTV cameras** on existing 3+1 cabling with 0 meters new cable, fitting-only mounting labor, and fresh BNC/DC connectors.
   - **Camera Expansion / Add-ons on Existing Setup:**
     - For existing HD Analog systems: New cameras must be HD Analog (to connect to existing DVR). For the *new cabling* portion, the engine compares 3+1 vs. CAT6 and selects the cheaper cable price.
     - For existing IP systems: New cameras must be IP, and new cabling strictly uses CAT6.

4. **Reverse-GST Accounting & Reconciliation in Quotation Documents:**
   - In accordance with Section 2, all catalog and quote prices are 18% GST-inclusive standard.
   - Every quotation PDF, receipt, and tax invoice must compute the reverse GST breakup:
     $$\text{Taxable Base} = \frac{\text{Gross Total}}{1.18}$$
     $$\text{18% GST} = \text{Gross Total} - \text{Taxable Base}$$
     $$\text{CGST 9%} = \frac{\text{18% GST}}{2}, \quad \text{SGST 9%} = \text{18% GST} - \text{CGST 9%}$$
   - Zero ₹0 CGST/SGST amounts are permitted on standard GST-paid customer quotes.

## 14. Automated CCTV Vendor Sync, Catalog Sovereignty & Price Drift Governance (`lib/vendor/cctv-domain-filter.ts`, `app/api/cron/vendor-cctv-sync/`)

1. **Internal Catalog Sovereignty & Whitelist Invariant:**
   - The platform's active system inventory/product list (`products` collection in Firestore / `mega-products.generated.json`) is the supreme, immutable ground truth.
   - Any hardware item already listed or previously approved by admin (e.g. `HDMI-10M`, `HDMI-15M`, `HDMI-20M`, `ACC-WIFI-EXTENDER`, specialized mounts) is **permanently whitelisted** and 100% immune to automated heuristic rejection.
   - The rejection gate applies exclusively to **new, unlisted incoming vendor items**.

2. **Strict CCTV Domain Validation & Non-CCTV Clutter Rejection:**
   - Evaluates vendor products using deterministic domain classification:
     - **Allowed CCTV Hardware:** Bullet/Dome cameras, PTZ cameras, 4G SIM cameras, Solar cameras, DVRs, NVRs, surveillance-grade HDDs (WD Purple, Seagate SkyHawk, Toshiba S300), MicroSD cards, CCTV SMPS power supplies, PoE Switches, BNC/DC/RJ45 connectors, CCTV 3+1 & CAT6 copper cables, short HDMI cables (1.5m–5m for DVR racks), CCTV junction boxes, camera wall/pole mounts, surveillance equipment racks (4U, 6U, 9U), and wireless P2P bridges/4G routers.
     - **Permanently Rejected Non-CCTV Electronics:** Consumer televisions (Sony Bravia, Samsung/LG OLED/Smart TVs unless dedicated CCTV monitors), unmanaged plastic desktop non-PoE switches, consumer PC SSDs (Kingston A400, NVMe drives unsuitable for 24×7 write streams), home Wi-Fi repeaters, general PC peripherals (keyboards, mousepads, multimedia speakers, PC motherboards), and long-run AV fiber cables (>10m).

3. **Statutory 18% GST-Paid Standard & Wholesale Margin Calibration:**
   - In accordance with Section 2, all vendor prices displayed on vendor feeds/portals are treated as **GST-inclusive retail customer prices**.
   - The reverse GST taxable base is calculated as:
     $$\text{Taxable Base} = \frac{\text{Vendor Price}}{1.18}$$
     $$\text{18% GST} = \text{Vendor Price} - \text{Taxable Base}$$
     $$\text{CGST 9%} = \frac{\text{18% GST}}{2}, \quad \text{SGST 9%} = \text{18% GST} - \text{CGST 9%}$$
   - Wholesale `base_cost` is calibrated from vendor retail via category margin percentage, ensuring mathematically verified ₹0.00 tax reconciliation.

4. **Automated Scheduling, Admin Sovereignty & Dismissal Blacklist (`settings/vendor_sync`):**
   - **Admin Schedule Customization:** Admin has complete authority to toggle the background sync `Active` or `Paused (OFF)`, select `Daily` or `Weekly` frequency, choose execution time (e.g. `03:00` AM IST), and set the drift threshold (default `±5%`).
   - **Safe Drift Auto-Approval:** Fluctuations within tolerance ($\le 5\%$) are applied automatically. Fluctuations exceeding threshold ($> 5\%$) are diverted to Staging for 1-click review.
   - **Recommendation Blacklist ("Dismiss & Never Show Again"):** Clicking Dismiss on any new recommendation permanently registers the vendor PID in `dismissed_vendor_pids`. The engine permanently blacklists the SKU from future runs, while maintaining an unblock/restore option in the dashboard.
   - **Zero-Cost Architecture:** Pure functional regex evaluation (0 LLM tokens) and minimal Firestore footprint (<0.4% daily quota) guarantee **₹0.00/month** operational cost.
   - **Anti-Staleness & Cloudflare Hybrid Fallback:** Cache-busting headers (`no-cache, no-store`), dynamic query nonces, and React hydration checks guarantee fresh extraction. If Cloudflare blocks serverless cloud IPs, the engine logs a clear notice and activates the 1-click residential desktop sync (`[Run Live Sync Now]`).


## 15. Zero-Cost Universal Indian Postal Hierarchy & Zero "Unknown" Location Invariant (`lib/geo/pincode-resolver.ts`)

1. **100% In-Memory Static Indian Postal Hierarchy (Zero-Cost, Zero-Latency):**
   - Maps all 6-digit Indian PIN codes instantly through hierarchical resolution:
     - 2-Digit Postal Sub-Region -> State / Union Territory (all 28 states & 8 UTs).
     - 3-Digit Postal Division -> District & Division Hub (e.g. `508` -> Nalgonda, Telangana; `331` -> Churu, Rajasthan; `302` -> Jaipur, Rajasthan).
   - Zero external paid API calls (no Google Maps Geocoding bills, no external network timeouts).
2. **Permanent Ban on the String `"Unknown"` across Locations:**
   - Under NO circumstances may customer location, address banner, lead table, quote PDF, or CRM view render `"Unknown"` alongside or in place of a PIN code.
   - `formatLocationDisplay({ area, city, district, state, pincode })` always delivers authentic, human-readable Indian geographical context (e.g. `📍 Nalgonda, Telangana (508001)`).
3. **Dynamic Self-Healing on CRM & Ingestion Boundaries:**
   - Lead ingestion (`app/actions/lead.ts`, `app/api/submissions/route.ts`) and quote detail loading (`app/api/crm/quotes/[quoteId]/route.ts`, `app/api/crm/leads/[id]/route.ts`) automatically filter and self-heal any legacy lead records containing `"Unknown"`, replacing them with authentic district and state.

## 16. Indian Standard Time (IST) Date Boundary & Anti-Past Scheduling Invariant (`lib/date-utils.ts`)

1. **Strict Indian Standard Time (`Asia/Kolkata`, UTC+5:30) Enforcement:**
   - Eliminates UTC day-boundary drift (`new Date().toISOString().split("T")[0]`) which previously caused premature day rollovers before midnight in India.
   - `getTodayIST()` and `getTomorrowIST()` compute authentic dates matching the customer's Indian wall-clock calendar.
2. **Deterministic Anti-Past Scheduling Guard ($Date \ge Today_{IST}$):**
   - Enforced on both server APIs (`/api/bookings`, `/api/public/book-survey`, `/api/crm/beat-plan`, `updateNextFollowUp`) and client components (`SiteVisitBookingModal.tsx`, `BookSurveyClient.tsx`, `FollowUpManager.tsx`, `LeadIntelligencePanel.tsx`, `ProgressiveDialer.tsx`, `LeadDetailsDrawer.tsx`).
   - Any booking or scheduling attempt on a past date ($Date < Today_{IST}$) is blocked with HTTP 400 and user-friendly error banners.
3. **Intraday Slot Protection (`isPastSlotIST()`):**
   - For same-day bookings ($Date == Today_{IST}$), time slots that have already elapsed in Indian Standard Time (e.g., Morning slot after 1:00 PM IST, Afternoon slot after 5:00 PM IST, Evening slot after 8:00 PM IST) are intercepted and rejected, prompting the customer to select an upcoming slot or next day.


## 18. Layman Profitability Intelligence & Semantic Deal Health Invariant (`QuotationProfitBreakupCard.tsx`, `quotation-profit.ts`)

1. **Reassuring Green Confirmation for Healthy Deals:**
   - When a deal is healthy (`health.status === "healthy"`), the quotation intelligence card strictly renders a **reassuring Green status card** (`bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900`) with `<CheckCircle2 className="text-emerald-600" />` titled `✅ सुरक्षित व मुनाफे वाली डील (बढ़िया मार्जिन)` (EN: `✅ Safe & Profitable Deal (Healthy Margins)`).
   - Amber (`AlertTriangle`), Orange (`AlertCircle`), and Red (`AlertOctagon`) warning banners are strictly reserved for actual deal risks (`subsidized`, `low_margin`, or `critical`).
2. **Zero False Warnings from Normal Operating Overheads:**
   - Standard business overheads (Payment Gateway fee, 1st-year warranty reserve, local fittings/consumables) are expected operating deductions already transparently shown in the In-Hand Profit waterfall.
   - The pricing engine (`lib/quotation-profit.ts`) must NEVER push informational overhead deductions into `health.warnings` when a deal is healthy, preventing healthy deals from triggering false alert banners.
3. **Colloquial Layman Indian Market Phrasing:**
   - Academic corporate finance and MBA jargon is permanently replaced with natural Indian market terminology:
     - *"Waterfall"* $\rightarrow$ **"जेब में कितनी असली कमाई बचेगी? (खर्चे व सर्विस काटकर शुद्ध मुनाफा)"** / **"In-Hand Net Pocket Profit (After all expenses & warranty reserve)"**
     - *"Turnkey Composition"* $\rightarrow$ **"बिल का बंटवारा: 📦 सामान (कैमरा, DVR, HDD, तार) vs 🛠️ काम व फिटिंग (मजदूरी)"**
     - *"PG MDR (Est.)"* $\rightarrow$ **"💳 ऑनलाइन पेमेंट फीस (कार्ड / Razorpay चार्ज; कैश या डायरेक्ट UPI पर ₹0)"**
     - *"1st-Yr Warranty Reserve"* $\rightarrow$ **"🛡️ 1 साल सर्विस फंड (वारंटी विजिट का रिज़र्व)"**
     - *"Consumables & Local Ops"* $\rightarrow$ **"🔩 टेप, गिट्टी व पेच (लोकल फिटिंग व फुटकर सामान)"**
     - *"Total Overheads"* $\rightarrow$ **"📉 कुल अतिरिक्त खर्चे (सारे खर्चे मिलाकर)"**

## 18. System Expansion / Add-to-Existing Quotation Transparency & Recorder Upgrade Invariant (`CustomerJourneyBlueprint.tsx`, `LeadIntelligencePanel.tsx`)

1. **100% Visibility of Wizard Existing System Selections:**
   - Whenever a customer selects `"मौजूदा सिस्टम में जोड़ना (System Expansion / Add-on)"` (`installation_type: "addon"`), the Admin Lead Pipeline (`/admin/leads/[leadId]`) and Customer Journey Blueprint (`CustomerJourneyBlueprint.tsx`) must NEVER hide the underlying wizard equipment specifications.
   - The lead detail blueprint prominently displays the dedicated **"मौजूदा सिस्टम का विवरण (Existing System Blueprint)"** sub-card directly inside Box 1 (`परिसर व स्थापना का प्रकार`):
     - **तकनीकी स्पेसिफिकेशन्स स्थिति:** Customer Declared vs. Unknown Specs / Callback Required (`existing_system_known`).
     - **मौजूदा टेक्नोलॉजी:** `एनालॉग HD (BNC वायर)` vs `डिजिटल IP (CAT6 तार)`.
     - **मौजूदा रिकॉर्डर:** `{existing_recorder_channels} चैनल DVR/NVR`.
     - **सक्रिय कैमरे:** `{existing_working_cameras} चालू कैमरे`.
     - **खाली पोर्ट (Spare Capacity):** `{spare_channels} खाली पोर्ट उपलब्ध` ($\text{Spare} = \max(0, \text{Channels} - \text{Working})$).
     - **हार्ड डिस्क / स्टोरेज नीति:** Reusing existing HDD vs. New Surveillance HDD for total active cameras ($\text{TotalActive} = \text{New} + \text{Working}$).

2. **Deterministic Recorder Upgrade vs. Reuse Accounting:**
   - **Upgrade Required ($\text{TotalActive} > \text{ExistingChannels}$):** The blueprint and behavioral comparison table clearly explain why a new recorder was placed in the BOM:
     *`"⚠️ नया रिकॉर्डर अपग्रेड शामिल: {new} नए + {working} चालू = कुल {total} कैमरे। पुराने {channels}-Ch DVR की क्षमता कम होने से BOM में नया 16-चैनल DVR शामिल है।"`*
   - **Compatible / Reused ($\text{TotalActive} \le \text{ExistingChannels}$):** Explains that the customer's existing recorder is sufficient, recording ₹0 recorder cost and highlighting genuine customer savings:
     *`"✅ मौजूदा रिकॉर्डर कम्पैटिबल: {new} नए कैमरे पुराने {channels}-चैनल रिकॉर्डर में आसानी से जुड़ जाएंगे ({remaining} पोर्ट शेष रहेंगे)। रिकॉर्डर पर ₹0 अतिरिक्त खर्च।"`*
   - **Unknown Specs / Callback Scenario (`existing_system_known === false`):** Prominently displays:
     *`"🔍 तकनीकी स्पेसिफिकेशन्स अज्ञात (साइट सर्वे जरूरी): ग्राहक को पुराने रिकॉर्डर की क्षमता की जानकारी नहीं है। इंजीनियर कॉल या साइट पर बैक-पैनल चेक करके कम्पैटिबिलिटी तय करेंगे।"`*

3. **Lead Intelligence Panel Consistency (`LeadIntelligencePanel.tsx`):**
   - The installation type dropdown must natively support `"Addon"` (`"मौजूदा सिस्टम में जोड़ना"`) and auto-detect addon leads from `lead.wizard_answers.installation_type` instead of silently falling back to `"New"`.

## 19. Lowest-Storage Baseline & Anti-Competitor Shield Invariant (`DynamicVariantGenerator.tsx`, `ConfiguratorView.tsx`)

1. **Lowest Storage (7-Day / 500GB Economy Match) Entry Default:**
   - To eliminate competitor price-undercutting (where local competitors quote scrap 500GB drives to appear artificially cheaper), the quotation catalog opens by default with **7 Days (500GB / Economy Storage)** or customer-selected storage.
   - An elegant amber advisory pill renders on the card: `⚠️ Basic 500GB HDD · ~X Days Backup · 1-Yr Local [Advisory ⓘ]`, with an immediate 1-click upgrade button `[Switch to 1TB Rec. →]`.
   - Packages quoting 100% Genuine 24x7 Surveillance Drives (WD Purple / Seagate SkyHawk) display the Green Trust Badge with official 3-year warranty.

2. **Expansion Recorder Sizing Strategy (Dual DVR Exact vs. Dual DVR Future vs. Single Screen):**
   - When expanding an existing setup where capacity is exceeded ($\text{TotalCombinedWired} > \text{ExistingChannels}$):
     - The quotation catalog defaults to the **Dual DVR Combo (Exact Fit)** mode, sizing the additional recorder strictly for $\max(1, \text{Wired} - \text{SparePorts})$ (e.g. 4-Ch DVR), yielding the **cheapest headline price** and saving ₹4,856+ vs an all-in-one 16-Ch replacement.
     - **Interactive Channel Pills (`recorderStrategy`):**
       - `[ 💰 4-Ch न्यूनतम लागत (Exact Fit) ]`: Maximum immediate cost saving.
       - `[ 🚀 8-Ch फ्यूचर रेडी (+4 खाली) ]`: Sizes the add-on recorder to 8-Ch, providing spare ports for planned future expansion without re-purchasing a DVR later.
       - `[ 📺 16-Ch सिंगल स्क्रीन (ऑल-इन-वन) ]`: Replaces the old DVR with a single master recorder for 1 unified TV and mobile app screen.
     - Tapping any pill recalculates the entire quotation catalog in real-time ($0 reload latency).
     - **Cabling & Power Supply Protection:** SMPS and cabling are sized strictly for the new cameras being installed today ($\text{WiredCameraCount}$), never inflating accessories for future spare ports.


## 20. Universal Modal Viewport Containment & Zero-Trap Navigation Invariant (`TrackBookingModal.tsx`, `components/tour/InteractivePageTour.tsx`, `app/(public)/login/page.tsx`)

1. **React Portal Viewport Containment (`createPortal(..., document.body)`):**
   - In modern CSS and browser engines (Chromium, WebKit/Safari, Firefox), any ancestor container utilizing CSS `backdrop-filter` (e.g. `<header className="sticky top-0 backdrop-blur-md">`), `filter`, `transform`, or `perspective` establishes a new containing block for `position: fixed` elements.
   - Modals and floating overlays mounted inside such ancestors are constrained by the ancestor's bounds rather than the window, causing top cut-offs and hidden close buttons.
   - **Mandate:** All full-screen modals, dialogs, and floating sheets must mount via React `createPortal(modalContent, document.body)` with client-side mount guards (`mounted && typeof document !== "undefined"`).

2. **Quadruple Zero-Trap Exit Channels:**
   - Every modal and dialog must provide four redundant, frictionless exit channels so no user is ever trapped:
     1. **Top-Right Close Button:** Dedicated `[ ✕ ]` button with a minimum $44 \times 44\text{pt}$ touch target.
     2. **Explicit Bottom Action Button:** A visible `[ Cancel ]` or `[ Close ]` button paired alongside the primary action button.
     3. **Backdrop Click-to-Dismiss:** Dimmed overlay listener (`onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}`) allowing instant dismiss on tap outside.
     4. **Hardware / Keyboard Escape Key:** Global `keydown` listener (`event.key === "Escape"`) automatically closing the active modal.

3. **Laptop & Mobile Viewport Clamping ($\le 560\text{px}$ Visible Height):**
   - On standard 14-inch laptops (1366x768 resolution) common in India, browser UI (tabs, address bar, bookmarks) and the OS taskbar reduce active viewport height to ~550px.
   - Modals must strictly enforce `my-auto max-h-[90vh] max-h-[90dvh] overflow-y-auto` rather than fixed vertical margins or static heights, ensuring that headers, inputs, and action buttons remain 100% visible and accessible without clipping.
   - Body scroll locking (`document.body.style.overflow = "hidden"`) must engage on modal open and cleanly release on unmount.

4. **Zero Dead-End Navigation on Dedicated Pages:**
   - Secondary portal entry and standalone action pages (e.g., `/login`, `/customer/login`, `/register`, `/track/[id]`) must NEVER form navigation dead-ends.
   - They must render a prominent, accessible `← Back to Home` or `← Back to Portal Options` navigation link at the top, allowing users to return effortlessly to the main experience.

5. **Cross-Platform Device Optimization (Apple, Android, Windows & Linux):**
   - **Apple iOS / iPadOS:** Next.js `Viewport` export enforces `viewportFit: "cover"`; tours and modals observe `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to protect against Dynamic Island and Home Indicator overlaps. Mobile Safari gesture interference is blocked via `touch-none` on overlay backdrops.
   - **Android / Low-End Devices:** Text inflation is stabilized with `-webkit-text-size-adjust: 100%`; tap highlight flicker is eliminated via `-webkit-tap-highlight-color: transparent`.
   - **Horizontal Stability:** `body { overflow-x: clip; }` eliminates unintentional horizontal page jitter on narrow screens (280–360px) while preserving `position: sticky` headers.
