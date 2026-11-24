---
name: quotation-display-strategy
description: Explicitly enforces the Dynamic Catalog Variations strategy and permanently bans obsolete 3-tier (Value/Pro/Elite) or 3-card logic.
trigger: always_on
---

# Business Logic: Dynamic Catalog Variations (No Fixed 3-Tiers)

Never confuse or revert the quotation presentation strategy for this project. The platform's core commercial model is strictly defined as follows:

1. **Strictly Forbidden: The Obsolete "3-Tier (Value, Pro, Elite)" or "3-Card" Pattern**
   - The platform does **NOT** box customers into arbitrary tiers ("Standard", "Professional", "Elite", or "Value", "Pro", "Premium").
   - Do **NOT** propose, generate, or document arbitrary 3-tier quotation packages.

2. **The Ground Truth: Dynamic Open Catalog Variations (`DynamicVariantGenerator.tsx`)**
   - The quotation engine calculates and presents **ALL possible, legitimate quotations/variations** based on the customer's wizard answers (camera count, indoor/outdoor split, technology, storage days, and resolution preferences).
   - Variations are generated dynamically across:
     - **All Active Brands:** CP Plus, Hikvision, Dahua, Budget Brand, Prama, Trueview, Secureye, etc.
     - **Storage Variations:** Requested duration vs. Economy Storage Match (e.g., 500GB HDD saving variant).
     - **Mixed & Smart Configurations:** Wired + Wi-Fi hybrid, mixed resolutions (e.g., 2MP Dome + 5MP Bullet).

3. **Customer Empowerment Philosophy**
   - The customer sees all valid brand options side-by-side with transparent pricing (including GST and installation).
   - The customer has complete autonomy to evaluate what brand trust and features are worth their hard-earned money.

4. **On-Card Competitor Price Match Anchoring & Self-Healing Contract**
   - **No Unanchored Submissions:** The competitor price match CTA (`PriceMatchModal.tsx`) must strictly originate from specific package cards in the open catalog (`selected_package_title`, `selected_package_price`). Generic or floating popups (e.g. `PriceMatchPopup.tsx`) are permanently banned.
   - **Self-Healing Baseline Quotations:** When an unquoted lead uploads a competitor quote or requests a quote, `getOrCreateLeadQuote(leadOrQuoteId)` in `lib/baseline-quote.ts` deterministically constructs an 8-item server-calculated quote from `wizard_answers`. Zero ₹0 quotes or 404 PDF download errors are permitted.
   - **Strict Copy Constraint:** Under NO circumstances use the phrase `"2 years onsite warranty"` or `"2 year onsite warranty"` anywhere in customer copy or WhatsApp messages. Highlight 100% Solid Pure Copper Cable and Genuine Surveillance Storage instead.

5. **Zero-Tolerance Banned Terms & Obsolete Tier Invariant**
   - **Permanently Banned Words as Package Names or Category Tiers:**
     `"Essential"`, `"Smart Plus"`, `"Pro Elite"`, `"Value"`, `"Pro"`, `"Elite"`, `"Standard"`, `"Premium"`, or any other arbitrary marketing tier classifications.
   - **Strictly Banned Code Patterns:**
     - NEVER map `plan_type` (`budget` / `recommended` / `premium`) to marketing tier strings like `"Essential"`, `"Smart Plus"`, or `"Pro Elite"`.
     - NEVER populate UI selectors, quick-pick buttons, or package lists with legacy 3-tier objects (`[pricing_results.budget, pricing_results.recommended, pricing_results.premium]`).
   - **Authentic Specification Naming Mandate:**
     Package titles must ALWAYS and EXCLUSIVELY be derived from real hardware attributes:
     `{cameraCount}-Camera {brand} {resolution} {technology} Package [({storageDetails})]`
     *Valid Examples:*
     - `4-Camera CP Plus 2MP HD Package (1TB Storage)`
     - `4-Camera CP Plus 2MP HD Package (Economy Storage)`
     - `4-Camera Hikvision 5MP IP Package (2TB Storage)`
     - `4-Camera TP-Link WiFi HD Wireless Package (128GB MicroSD)`

6. **Per-Bucket Specification Customization & Zero Feature Leakage**
   - **Real-Life Daily Situation Support:** Practical installations require mixed camera specifications across the same property (e.g., 2 outdoor cameras requiring Color Night Vision and Audio Mic, 1 entrance camera needing 2-way talk and speaker, and 1 wireless camera requiring 4G SIM where no Wi-Fi exists).
   - **Independent Bucket Feature Toggling:** Customers must have the freedom to configure features per bucket without global feature leakage. The pricing engine (`pricing-engine.ts`) strictly prioritizes per-bucket `features` over global selections.
   - **Real-Time System Overview Counter:** The catalog header MUST display a live breakdown bar showing total cameras alongside real-time counts for Weatherproof, Indoor, Color Night, Audio Mic, 2-Way Talk, 360° PTZ, 4G SIM, and Wi-Fi.
   - **Immutable Standard Attributes:** Weatherproof IP67 is standard on all outdoor cameras (`🌧️ IP67 Weatherproof Standard`), and 4G SIM is built-in for all 4G cameras (`🛰️ 4G SIM Built-in`).
   - **Layman Technical Education:** The catalog MUST offer easy access to `TagGuideModal.tsx` (`💡 Feature Guide`) with plain-language explanations and practical real-life examples for every technical feature.

## 7. Inventory-Driven Feature Tags & Modal Safety (Layer 37)
- **Inventory Filtering Invariant:** Feature options on camera cards and modals must be dynamically computed against active inventory (`products`). Never display feature chips or checkboxes for capabilities that lack matching stock in the active technology (e.g. no PTZ in HD/IP, no 2-way in IP).
- **Separation of Resolution and Features:** 5MP / clarity belongs exclusively to the `RESOLUTION` selector. It must never appear as an add-on feature tag.
- **Zero Blocking Popups on Page Load:** Let the customer view their quote immediately upon landing. Checklist and Feature Guide modals are accessible on-demand.
- **Centered Responsive Dialogs:** All modal dialogs must use centered layouts (`items-center justify-center max-h-[85vh] rounded-2xl sm:rounded-3xl`) with dedicated internal scroll containers to prevent action button clipping on mobile and tablet screens.

## 8. Storage Transparency & Clean Advisory Architecture
- **Physical Inverse Scaling Law:** For wired systems (HD/IP), storage days must scale inversely with camera count ($Days \propto \frac{Capacity}{Cameras}$). An 8-camera setup on a 500GB HDD yields **~3 Days Backup**, strictly half of a 4-camera setup (~7 Days).
- **Dedicated Wireless Storage:** Wireless cameras receive 1 MicroSD card per camera (`qty = camera_count`). The UI must display `(~X Days Backup per Camera · Dedicated MicroSD)` and never divide card capacity across multiple wireless cameras.
- **Global Advisory Banner at Selector Level:** When Economy/500GB storage is active (`selectedStorageDays === 7`), a clean, non-intrusive amber banner renders directly beneath the Recording Retention selector with market transparency context and a 1-click `[Switch to 1TB Rec. →]` button.
- **Sleek Amber Card Pill (Zero-Clutter Invariant):** Packages quoting basic 500GB / refurbished storage must NOT render bloated 10-line text boxes on individual cards. Instead, they render a compact, elegant 1-line amber pill (`⚠️ Basic 500GB HDD · ~X Days Backup · 1-Yr Local [Advisory ⓘ]`) matching the exact height and rhythm of genuine surveillance badges.
- **Interactive Storage Advisory Modal (`StorageAdvisoryModal.tsx`):** On clicking `[Advisory ⓘ]` or `[Learn More]`, a dedicated modal educates the user on competitor tactics (bundling scrap desktop HDDs) and presents a clean side-by-side comparison between 500GB desktop vs. 1TB+ genuine surveillance drives with direct 1-click upgrade.
- **Green Trust Badge for Genuine Surveillance Drives:** Standard branded quotes pairing Seagate SkyHawk or WD Purple must display the Green Trust Badge: `100% Genuine 24×7 Surveillance HDD · ~X Days Backup · 3-Yr Warranty`.

## 9. Sticky Filter Bar Navigation for Catalog Variations
- **Sticky Technology & Brand Bar:** The Technology Selector (HD Analog, IP Network, Wireless, Hybrid) and Brand Selector pills must remain pinned (sticky top-14 md:top-20 z-30) as customers scroll down to browse and compare Available Packages.
- **Immediate Context & Zero Friction Switching:** Floating below the site header with backdrop-blur-md bg-[#f5f5f7]/95 dark:bg-black/95, customers can seamlessly switch technologies or filter by brand anywhere in the catalog without having to scroll all the way back up to the top.
- **Viewport Height Efficiency:** Designed with compact padding (~75px total height on mobile) to preserve maximum vertical screen space for quotation cards while keeping touch targets comfortably accessible.

## 10. WhatsApp Omnichannel Conversational Engine & Resilience Standards
- **11-Language First-Touch Selection & Layman Phrasing:**
  - Initial interaction presents bilingual greeting (English & Hindi) with 1 to 11 options for all supported Indian languages (`en`, `hi`, `mr`, `gu`, `ta`, `te`, `kn`, `bn`, `ml`, `pa`, `or`).
  - Strict colloquial laymen terms without jargon or synthetic words (e.g., "घर / फ्लैट", "दुकान / ऑफिस", "तार वाला", "बिना तार").
- **Hybrid Quick-Tap & Direct Numeric Reply:**
  - Customers can tap quick-tap buttons (`[ 2 ]`, `[ 4 ]`, `[ 8 ]`) or directly type an integer (`1` to `32`) for camera counts.
- **Option A (2-Button Checkpoint):**
  - Camera setup confirmation uses strictly 2 Meta API compliant buttons ($\le 20$ chars):
    - `[ ✅ Done (Proceed) ]` (`wf_done_proceed`)
    - `[ ✏️ Change Qty ]` (`wf_change_qty`)
- **Non-Destructive Camera Quantity Editor (`ASK_CAMERA_EDIT_CHOICE`):**
  - Tapping `[ ✏️ Change Qty ]` allows modifying Outdoor Bullet, Indoor Dome, or Wireless counts on-the-fly while strictly preserving customer language, property type, and pincode session data.
- **Media & Off-Topic Input Resilience:**
  - Inbound media (images, stickers, audio, documents) or off-topic text never crashes or resets the session. The bot gracefully acknowledges and re-prompts the current step.
- **Name Protection Filter & Data Normalization:**
  - Rejects rate/pricing queries in the name prompt; intercepts 10-digit mobile numbers typed into the pincode prompt; standardizes phone numbers to canonical `91XXXXXXXXXX`.
- **Error, Env Hygiene & Cross-Device WhatsApp App Launcher Invariants:**
  - Zero `[object Object]` across client/server boundaries via `extractErrorMessage()` (`lib/utils.ts`).
  - All integration keys and phone env vars must be trimmed/sanitized via `cleanEnvVar()` / `cleanPhoneEnvVar()` (`lib/env-utils.ts`) to prevent CRLF header/API failures (`MSG91_WHATSAPP_NUMBER`, `WHATSAPP_PROVIDER`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `GEMINI_API_KEY`, etc.).
  - WhatsApp OTP and quote links launch via native `<a href="whatsapp://send?phone=...">` (no bare `whatsapp://` or hidden `<iframe>`), with iPadOS detection and adaptive mobile (`wa.me`) vs desktop (`web.whatsapp.com`) fallback (`lib/whatsapp.ts`, `WhatsAppOtpNotice.tsx`).

## 11. Interactive Page-by-Page Guided Tour Invariants (`components/tour/`)
- **Journey-Wise Step Micro-Tours:** Guidance is delivered contextually per wizard step (`activeStep={step}`) or per page route via `InteractivePageTour.tsx` rather than a blocking upfront tour.
- **Hardware Impact Focus:** Explains the real-world impact of button choices (weatherproof bullets vs indoor domes, HD vs IP, storage duration) on hardware, cabling, and 100% GST-paid pricing.
- **User Agency:** Features explicit `[ Next / Try It ]`, `[ Skip ]` (current step only: `team_tour_page_skip:<pageId>`), and `[ Don't show guides automatically again ]` (`localStorage.setItem('team_tour_skip_all', 'true')`).
- **Header Persistent Trigger:** The `[ 💡 Guide ]` pill is mounted in top headers via `renderTrigger` to eliminate any visual clash with floating WhatsApp widgets or bottom CTA bars.
- **Mobile Viewport Inversion:** Dynamically docks cards above or below the highlighted target based on screen position, with body scroll locking and iOS safe-area handling.
- **Operational & Staff Persona Coverage:** Extends guided tour coverage across all personas: Customer Builder (`cctv-wizard`, `quote-catalog`, `quote-review`), Operations (`track-booking`, `customer-dashboard`), Admin Deal Closer (`admin-deal-tour`), Installer On-Site Mobile Card (`installer-job-tour`), and Partner Portal (`partner-leads-tour`, `partner-commissions-tour`).
- **Decoupled Telemetry Layer (`lib/analytics/tour-analytics.ts`):** Emits allow-listed events (`tour_started`, `tour_step_viewed`, `tour_completed`, `tour_skipped`, `tour_skip_all`) via synchronous custom DOM events and lazy-loaded Firebase Analytics. Enforces zero PII leakage (no customer names, phones, emails, order/quote IDs, or secret PINs).
- **Compositor-Friendly Mobile Motion:** Utilizes GPU-accelerated CSS keyframes (`animate-tour-pulse`, `animate-tour-card-enter` with `translate3d`), static `supports-[backdrop-filter]:backdrop-blur-[1px]`, ring-only scaling, and `@media (prefers-reduced-motion: reduce)` safety.
- **Certified Isolation:** Read-only UI overlay; never mutates pricing, GST, or BOM data structures.
- **Funnel Drop-off Telemetry (`lib/analytics/tour-funnel-calculator.ts`, `TourPerformanceWidget.tsx`):** Pure functional aggregation turning raw tour events into `TourFunnelDataset` with `completionRate`, `skipRate`, and step `dropOffRate` rendered live on `/admin/analytics/funnel`.
- **11-Language Modular Lazy-Loading (`locales/tours/[locale].json`, `lib/i18n/tour-translations.ts`):** Complete colloquial layman translations for all 11 languages (`en`, `hi`, `mr`, `gu`, `ta`, `te`, `kn`, `bn`, `ml`, `pa`, `or`) loaded on demand without inflating bundle sizes.

## 12. Internal Catalog Price Sovereignty & Zero External Speculation Invariant
- **Sole Source of Ground Truth:** The internal product catalog (`data/mega-products.generated.json`, active inventory, Firestore `products`) is the immutable ground truth for all item pricing, base costs, and margins.
- **Strict Ban on Outside Price References:** Never evaluate, dispute, or alter internal catalog prices against external memories, speculative assumptions, or unverified market chatter. If a price is set in the system catalog (e.g. Toshiba S300 2TB @ ₹12,065), it must be taken as authentic and verified (e.g. compared to Amazon India retail @ ₹14,999+).
- **Audit & Review Guard:** Code audits and quotation reviews must verify that calculations align mathematically with the internal catalog rather than second-guessing catalog price points.

## 13. Universal CAT6 Dual-Compatibility Standard (HD Analog & IP Systems)
- **Universal Field Practice:** Modern installers natively install HD Analog cameras over CAT6 Pure Copper UTP cable by utilizing the multi-core twisted pairs (8 cores / 4 pairs) for direct video and 12V DC power transmission with standard BNC connectors and DC power pins.
- **Future-Proof Cabling Guarantee:** Quoting CAT6 with BNC and DC pins provides customers with future-proof network infrastructure, allowing effortless upgrade to IP systems without re-wiring. It is an authorized and certified standard configuration across the platform.

## 14. Strict Hardware Topology Alignment, Cabling Optimization & Brownfield Decision Matrix
- **Strict Hardware Topology Alignment (Permanent Ban on Frankenstein Mixing):**
  - **HD Analog Systems:** Must ALWAYS and EXCLUSIVELY pair with an **HD DVR**, **12V Central SMPS Power Supply**, **BNC Video Connectors**, and **12V DC Power Pins**. NEVER quote an NVR or PoE Switch for HD analog cameras.
  - **Digital IP Systems:** Must ALWAYS and EXCLUSIVELY pair with an **NVR**, **PoE Switch** (or PoE NVR), and **RJ45 Modular Connectors**. NEVER quote a DVR, SMPS, or BNC/DC pins for IP cameras.
  - **Hybrid Systems (Mixed Wired + Wi-Fi):** The wired portion strictly abides by its respective technology, while wireless cameras utilize dedicated MicroSD cards and mounting/pairing labor.
  - Package titles must dynamically reflect the true topology (e.g., `4-Camera CP Plus 2MP HD Package`, `4-Camera Hikvision 5MP IP Package`, `7-Camera Hikvision Hybrid HD + Wi-Fi Package`).
- **Cable Cost Optimization for New HD Installations (3+1 vs. CAT6 Cheaper Price Check):**
  - HD Analog setups natively support both **3+1 Coaxial CCTV Cable** and **CAT6 Pure Copper LAN Cable**.
  - When generating new HD quotes without explicit cable pinning, the engine evaluates both cable options and automatically selects the **cheaper total retail cost to the customer**.
  - If costs are equal, CAT6 is prioritized for future-proof IP upgradability.
- **Brownfield / Existing Cabling Compatibility Matrix:**
  - **Existing 3+1 Coaxial Cabling:** Strictly offer **HD Analog CCTV camera** packages only (3+1 cannot carry digital Ethernet/PoE). Digital IP options are marked as incompatible.
  - **Existing CAT6 Cabling:** Actively offer **both HD Analog AND Digital IP** quotation options.
  - **Faulty Camera Replacement on Existing Setup:** Strictly quote **HD Analog CCTV cameras** on existing 3+1 cabling with 0m new cable, fitting-only mounting labor, and fresh BNC/DC connectors.
  - **Camera Expansion / Add-ons on Existing Setup:**
    - Existing HD Analog systems: New cameras must be HD Analog. For new cabling runs, compare 3+1 vs. CAT6 and select the cheaper cable price.
    - Existing IP systems: New cameras must be IP, and new cabling strictly uses CAT6.
- **Reverse-GST Accounting & Reconciliation in Quotation Documents:**
  - All prices are 18% GST-inclusive standard. Reverse GST breakup ($\text{Base} = \text{Gross} / 1.18$, $\text{GST} = \text{Gross} - \text{Base}$) must calculate exact 9% CGST and 9% SGST. Zero ₹0 GST amounts are permitted on standard GST-paid customer quotes.

## 15. Automated CCTV Vendor Sync, Catalog Sovereignty & Price Drift Governance (`lib/vendor/cctv-domain-filter.ts`)
- **Internal Catalog Sovereignty Whitelist:** The platform's active inventory (`products` / `mega-products.generated.json`) is the supreme ground truth. All admin-listed or approved products (including `HDMI-10M`, `HDMI-15M`, `HDMI-20M`, `ACC-WIFI-EXTENDER`) are permanently whitelisted and immune to heuristic rejection. The rejection gate applies strictly to new, unlisted incoming vendor items.
- **Strict Non-CCTV Clutter Rejection:** Consumer TVs, unmanaged non-PoE desktop switches, PC SSDs, home Wi-Fi repeaters, general computer peripherals, and long-run AV fiber cables are permanently rejected from vendor imports unless already approved in the catalog.
- **Statutory 18% GST-Paid Standard:** All vendor retail prices are GST-inclusive retail customer prices. Reverse GST ($\text{Taxable Base} = \text{Gross} / 1.18$, $\text{GST} = \text{Gross} - \text{Base}$) guarantees ₹0.00 accounting reconciliation.
- **Admin Schedule Customization & Blacklist Sovereignty:** Background sync is fully configurable via `settings/vendor_sync` (`enabled: boolean`, `frequency: "daily" | "weekly"`, `schedule_time: "03:00"`, `drift_threshold_percent: 5`, `auto_apply_safe_updates: boolean`). Safe drift ($\le 5\%$) is applied automatically. Admin can permanently blacklist unwanted recommendation PIDs via "Dismiss & Never Show Again" (`dismissed_vendor_pids`) with 1-click restore capability.
- **₹0.00/Month Operational Cost & Cloudflare Hybrid Fallback:** Regex-based classification (0 LLM tokens) and minimal Firestore footprint ensure zero recurring costs. When vendor anti-bot security challenges serverless cloud cron IPs, the admin can execute a 1-click desktop browser sync directly from the dashboard.

## 16. Zero-Cost Universal Indian Postal Hierarchy & Zero "Unknown" Location Invariant (`lib/geo/pincode-resolver.ts`)
- **100% In-Memory Static Indian Postal Hierarchy:** Resolves all 6-digit PIN codes across India instantly without paid Google Maps geocoding or external API requests.
- **Permanent Ban on "Unknown":** Addresses, lead headers, and quote PDFs must never display `"Unknown"` alongside or in place of a PIN code. The system automatically derives authentic District and State (e.g. `📍 Nalgonda, Telangana (508001)`).
- **Dynamic Self-Healing:** Legacy lead records and quotes with missing or corrupted locations are automatically cleaned and stamped with authentic administrative divisions.

## 17. Indian Standard Time (IST) Date Boundary & Anti-Past Scheduling Invariant (`lib/date-utils.ts`)
- **IST Calendar Ground Truth (`Asia/Kolkata`):** All booking calendars, survey scheduling, beat planning, and follow-ups operate strictly on Indian Standard Time, eliminating UTC day-boundary drift.
- **Strict Anti-Past Date Defense ($Date \ge Today_{IST}$):** Server APIs and UI date pickers deterministically block scheduling any visit, survey, or follow-up on past dates.
- **Intraday Slot Protection:** Time slots that have already elapsed in Indian Standard Time on the current day cannot be selected or booked.

## 18. Lowest-Storage Baseline & Anti-Competitor Shield Invariant (`DynamicVariantGenerator.tsx`, `ConfiguratorView.tsx`)
- **Lowest Storage (7-Day / 500GB Economy Match) Entry Default:**
  - To eliminate competitor price-undercutting (where local competitors quote scrap 500GB drives to appear artificially cheaper), the quotation catalog opens by default with **7 Days (500GB / Economy Storage)** or customer-selected storage.
  - An elegant amber advisory pill renders on the card: `⚠️ Basic 500GB HDD · ~X Days Backup · 1-Yr Local [Advisory ⓘ]`, with an immediate 1-click upgrade button `[Switch to 1TB Rec. →]`.
  - Packages quoting 100% Genuine 24x7 Surveillance Drives (WD Purple / Seagate SkyHawk) display the Green Trust Badge with official 3-year warranty.
- **Expansion Recorder Sizing Strategy (Dual DVR Exact vs. Dual DVR Future vs. Single Screen):**
  - When expanding an existing setup where capacity is exceeded ($\text{TotalCombinedWired} > \text{ExistingChannels}$):
    - The quotation catalog defaults to the **Dual DVR Combo (Exact Fit)** mode, sizing the additional recorder strictly for $\max(1, \text{Wired} - \text{SparePorts})$ (e.g. 4-Ch DVR), yielding the **cheapest headline price** and saving ₹4,856+ vs an all-in-one 16-Ch replacement.
    - **Interactive Channel Pills (`recorderStrategy`):**
      - `[ 💰 4-Ch न्यूनतम लागत (Exact Fit) ]`: Maximum immediate cost saving.
      - `[ 🚀 8-Ch फ्यूचर रेडी (+4 खाली) ]`: Sizes the add-on recorder to 8-Ch, providing spare ports for planned future expansion without re-purchasing a DVR later.
      - `[ 📺 16-Ch सिंगल स्क्रीन (ऑल-इन-वन) ]`: Replaces the old DVR with a single master recorder for 1 unified TV and mobile app screen.
    - Tapping any pill recalculates the entire quotation catalog in real-time ($0 reload latency).
    - **Cabling & Power Supply Protection:** SMPS and cabling are sized strictly for the new cameras being installed today ($\text{WiredCameraCount}$), never inflating accessories for future spare ports.
