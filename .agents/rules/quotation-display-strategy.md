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


