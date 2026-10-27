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
