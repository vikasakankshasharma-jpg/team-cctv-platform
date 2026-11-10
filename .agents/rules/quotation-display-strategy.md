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
- **Immediate Context & Zero Friction Switching:** Floating below the site header with ackdrop-blur-md bg-[#f5f5f7]/95 dark:bg-black/95, customers can seamlessly switch technologies or filter by brand anywhere in the catalog without having to scroll all the way back up to the top.
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
