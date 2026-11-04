#!/usr/bin/env python3
"""
scripts/update-md-docs.py
Updates all markdown (.md) documentation files to reflect the current position
of the project (Milestones 36 to 39):
1. README.md
2. BUSINESS_RULES.md
3. STATUS.md
4. HANDOVER.md
5. docs/PRODUCTION_TRUTH.md
6. docs/UX_ARCHITECTURE.md
7. .agents/rules/quotation-display-strategy.md
"""

import os
import sys

def update_file(path, old_text, new_text, description):
    if not os.path.exists(path):
        print(f"[-] File not found: {path}")
        return False
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Normalize line endings for replacement
    content_norm = content.replace("\r\n", "\n")
    old_norm = old_text.replace("\r\n", "\n")
    new_norm = new_text.replace("\r\n", "\n")
    
    if old_norm not in content_norm:
        print(f"[-] Target text not found in {path} for: {description}")
        return False
        
    updated = content_norm.replace(old_norm, new_norm)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(updated)
    print(f"[+] Successfully updated {path}: {description}")
    return True

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print(f"Updating docs in base directory: {base_dir}")

    # =========================================================================
    # 1. README.md
    # =========================================================================
    readme_path = os.path.join(base_dir, "README.md")
    old_readme_sec8 = """### 8. Per-Bucket Camera Customization, Layman Feature Guide & Accessible UI
- **Per-Bucket Feature Independence:** Eliminates the constraint of uniform camera specifications. Customers can configure specific camera buckets with unique combinations (e.g. 2 outdoor cameras with Color Night Vision and Audio Mic, 1 entrance camera with 2-way talk and speaker, and 1 wireless camera with 4G SIM cellular).
- **Zero Feature Leakage in Pricing Engine:** `lib/pricing-engine.ts` prioritizes per-bucket `req.features` over global selections, guaranteeing that features chosen for one camera type do not inflate or alter other camera buckets.
- **Real-Time System Overview Breakdown:** High-visibility dynamic counter bar displaying total cameras alongside real-time counts for Weatherproof, Indoor, Color Night, Audio Mic, 2-Way Talk, 360° PTZ, 4G SIM, and Wi-Fi.
- **Immutable Standard Attributes:** Weatherproof IP67 is automatically included as standard for outdoor cameras (`🌧️ IP67 Weatherproof Standard`), and 4G SIM connectivity is permanently built-in for 4G units.
- **Educational Layman Guide Modal (`TagGuideModal.tsx`):** Explains technical terms in simple language with practical Indian daily real-life examples (e.g., cash counter verbal negotiations, gate package delivery instructions, identifying intruder shirt color at 2 AM).
- **System Specifications Checklist Modal (`SpecificationChecklistModal.tsx`):** Interactive checklist modal to inspect and apply requirements in 1 click.
- **WCAG 2.1 AA Compliant Color System:** Unified brand blue active states (`bg-blue-600`), frosted badges within active tabs, containerized specification chips, muted non-distracting delete actions, and high contrast ratios across both Light Mode and Dark Mode."""

    new_readme_sec8_9 = """### 8. Per-Bucket Camera Customization, Layman Feature Guide & Accessible UI
- **Per-Bucket Feature Independence:** Eliminates the constraint of uniform camera specifications. Customers can configure specific camera buckets with unique combinations (e.g. 2 outdoor cameras with Color Night Vision and Audio Mic, 1 entrance camera with 2-way talk and speaker, and 1 wireless camera with 4G SIM cellular).
- **Dynamic Inventory-Driven Feature Tags:** Feature chips on camera cards and in modal checklists dynamically query active catalog inventory (`products`). Tags are only displayed if matching products exist in stock for that specific technology and brand (e.g., `360° PTZ` is automatically hidden on HD/IP setups without PTZ cameras, and `2-Way Talk` is hidden on IP setups without 2-way cameras).
- **Resolution vs Feature Boundary Enforcement:** Resolution is strictly governed by each camera's `RESOLUTION` dropdown (2MP, 3MP, 4MP, 5MP, 8MP). "5MP (3K) Ultra High Clarity" is excluded from feature tags, avoiding redundant prompts and keeping specifications clean.
- **Centered, Non-Intrusive Modal Architecture:** Replaced blocking auto-opening popups with centered dialogs accessible on-demand (`💡 Feature Guide` and `⚙️ Checklist`). Viewport-safe styling (`items-center justify-center max-h-[85vh] rounded-2xl sm:rounded-3xl`) guarantees headers, scrollable body text, and footer action buttons are 100% visible on all screen sizes.
- **Zero Feature Leakage in Pricing Engine:** `lib/pricing-engine.ts` prioritizes per-bucket `req.features` over global selections, guaranteeing that features chosen for one camera type do not inflate or alter other camera buckets.
- **Real-Time System Overview Breakdown:** High-visibility dynamic counter bar displaying total cameras alongside real-time counts for Weatherproof, Indoor, Color Night, Audio Mic, 2-Way Talk, 360° PTZ, 4G SIM, and Wi-Fi.
- **Immutable Standard Attributes:** Weatherproof IP67 is automatically included as standard for outdoor cameras (`🌧️ IP67 Weatherproof Standard`), and 4G SIM connectivity is permanently built-in for 4G units.
- **Educational Layman Guide Modal (`TagGuideModal.tsx`):** Explains technical terms in simple language with practical Indian daily real-life examples (e.g., cash counter verbal negotiations, gate package delivery instructions, identifying intruder shirt color at 2 AM) alongside a dedicated resolution comparison guide.
- **System Specifications Checklist Modal (`SpecificationChecklistModal.tsx`):** Interactive checklist modal to inspect and apply requirements in 1 click, strictly synchronized with available catalog capabilities.
- **WCAG 2.1 AA Compliant Color System:** Unified brand blue active states (`bg-blue-600`), frosted badges within active tabs, containerized specification chips, muted non-distracting delete actions, and high contrast ratios across both Light Mode and Dark Mode.

### 9. Dual-Collection Product & Addon Management & Row-Level Actions
- **Dual-Collection Cascade Delete & Update (`/api/admin/products`):** The Hardware Management dashboard seamlessly unifies the `products` and `addons` collections. All mutations (batch delete, updates, status toggles) operate across both collections in parallel, eliminating undeletable orphan records.
- **Row-Level Direct Delete UX (`ProductInventory.tsx`):** Every product row features a dedicated red Trash icon under the `ACTIONS` column with a confirmation dialog, enabling single-click deletion without requiring bulk header selection.
- **In-Modal Direct Delete:** The Edit Product modal footer includes an immediate "Delete Product" button for quick removal during specification inspection.
- **Distributor Inventory Integration (Mega Compu World Jaipur):** Ingestion tooling and verification scripts (`scripts/sync-all-megacompu-catalog.js`) map 66 verified SKUs across CP Plus, Hikvision, Prama, A+ Products (Budget), Secureye, Trueview, and matching DVRs with genuine dealer wholesale pricing and exact distributor Item IDs."""

    update_file(readme_path, old_readme_sec8, new_readme_sec8_9, "README.md Section 8 and new Section 9")

    # =========================================================================
    # 2. STATUS.md
    # =========================================================================
    status_path = os.path.join(base_dir, "STATUS.md")
    old_status_header = """> **Last Updated:** November 3, 2026"""
    new_status_header = """> **Last Updated:** November 4, 2026"""
    update_file(status_path, old_status_header, new_status_header, "STATUS.md Last Updated Date")

    old_status_scorecard = """| **Customer Journey & Pro Builder** | `VERIFIED` | WhatsApp OTP lead capture before custom build; Mobile slide-over cart drawer; iOS Safari auto-zoom patch (`text-base sm:text-sm`); single-filter auto-collapse. |
| **Checkout & Payment Pathways** | `VERIFIED` | 4 pathways: Pay Full (2% discount), ₹500 3-step token, EMI option, Free Site Visit calendar (future dates only); Webhook + Fallback Verification API. |
| **Catalog & Inventory Integrity** | `VERIFIED` | Active-only inventory enforcement; zero fake fallback products; PTZ, 2-way audio, and U-height specs; Add-on vs. BOM separation; Admin Duplicate Product tool. |"""

    new_status_scorecard = """| **Customer Journey & Pro Builder** | `VERIFIED` | WhatsApp OTP lead capture before custom build; Mobile slide-over cart drawer; single-filter auto-collapse; Dynamic inventory-driven feature tags; Resolution vs feature boundary enforcement; Centered non-intrusive modal dialogs; Per-bucket feature independence with zero feature leakage. |
| **Checkout & Payment Pathways** | `VERIFIED` | 4 pathways: Pay Full (2% discount), ₹500 3-step token, EMI option, Free Site Visit calendar (future dates only); Webhook + Fallback Verification API. |
| **Catalog & Inventory Integrity** | `VERIFIED` | Active-only inventory enforcement; zero fake fallback products; Dual-collection (`products` + `addons`) cascade delete and update; Direct row-level trash button in `ProductInventory.tsx`; Edit Modal delete action; 0-orphan clean state; Mega Compu World distributor integration with 66 verified SKUs and wholesale dealer pricing. |"""

    update_file(status_path, old_status_scorecard, new_status_scorecard, "STATUS.md Scorecard")

    # =========================================================================
    # 3. BUSINESS_RULES.md
    # =========================================================================
    rules_path = os.path.join(base_dir, "BUSINESS_RULES.md")
    old_rules_sec1_1 = """- **Firestore Soft-Deletion Query Invariant:** Firestore query filters must NEVER query `where("is_deleted", "==", false)` on collections containing legacy documents. In Firestore, querying inequality or equality on a field strictly omits all documents where that field is absent/undefined. Queries must fetch active items (`where("is_active", "==", true)`) and filter out soft-deleted items in application memory (`.filter(p => p.is_deleted !== true)`)."""

    new_rules_sec1_1 = """- **Firestore Soft-Deletion Query Invariant:** Firestore query filters must NEVER query `where("is_deleted", "==", false)` on collections containing legacy documents. In Firestore, querying inequality or equality on a field strictly omits all documents where that field is absent/undefined. Queries must fetch active items (`where("is_active", "==", true)`) and filter out soft-deleted items in application memory (`.filter(p => p.is_deleted !== true)`).
- **Dual-Collection Unified Inventory Operations (`products` and `addons`):**
  - The Hardware Management dashboard (`/admin/products`) aggregates both `products` and `addons` into a unified inventory view.
  - Backend mutations (`DELETE /api/admin/products` and `PATCH /api/admin/products`) MUST execute across both `adminDb.collection("products")` and `adminDb.collection("addons")` in parallel.
  - Deleting an accessory (e.g. Wi-Fi extender, router, rack, monitor) must delete it from `addons`, eliminating orphan persistence.
  - In `ProductInventory.tsx`, every row under the `ACTIONS` column must provide a direct Trash icon with a confirmation prompt for immediate single-click deletion, alongside the header bulk checkbox."""

    update_file(rules_path, old_rules_sec1_1, new_rules_sec1_1, "BUSINESS_RULES.md Section 1.1")

    old_rules_sec8 = """### 8.4 Color Palette Harmony & WCAG 2.1 AA Accessibility Standards
- **Authoritative Brand Primary:** Primary interactive selections, active technology tabs, and active brand pills must use brand blue (`#2563eb` / `bg-blue-600 text-white`).
- **Frosted Badges in Active Containers:** Tags inside active colored buttons must use frosted semi-transparent styling (`bg-white/20 text-white border border-white/25`) to avoid chromatic aberration and visual vibration.
- **Muted Non-Alarming Action States:** Destructive actions (e.g. bucket deletion) must remain neutral gray (`text-zinc-400 hover:text-red-600 hover:bg-red-50`) when idle to prevent visual clutter and anxiety.
- **Contrast Ratios:** All body text, dropdown labels, and status badges must meet or exceed the WCAG 2.1 AA standard of 4.5:1 across both Light Mode and Dark Mode."""

    new_rules_sec8 = """### 8.4 Color Palette Harmony & WCAG 2.1 AA Accessibility Standards
- **Authoritative Brand Primary:** Primary interactive selections, active technology tabs, and active brand pills must use brand blue (`#2563eb` / `bg-blue-600 text-white`).
- **Frosted Badges in Active Containers:** Tags inside active colored buttons must use frosted semi-transparent styling (`bg-white/20 text-white border border-white/25`) to avoid chromatic aberration and visual vibration.
- **Muted Non-Alarming Action States:** Destructive actions (e.g. bucket deletion) must remain neutral gray (`text-zinc-400 hover:text-red-600 hover:bg-red-50`) when idle to prevent visual clutter and anxiety.
- **Contrast Ratios:** All body text, dropdown labels, and status badges must meet or exceed the WCAG 2.1 AA standard of 4.5:1 across both Light Mode and Dark Mode.

### 8.5 Resolution vs Feature Dropdown Boundary Enforcement
- **Resolution as Intrinsic Attribute:** Resolution is strictly governed by the `RESOLUTION` dropdown selector (2MP, 3MP, 4MP, 5MP, 8MP) on each camera card.
- **Exclusion from Feature Tags:** Technical resolution indicators (e.g. `5MP (3K) Ultra High Clarity`, `2MP Full HD`) are strictly prohibited from appearing as optional feature tags, chips, or checklist filters.
- **Resolution Education:** Clarity, zoom boundaries, and number plate recognition distances are presented in the dedicated Resolution Guide section of `TagGuideModal.tsx`.

### 8.6 Dynamic Inventory-Driven Feature Tag Filtering
- **Stock-Aware Feature Visibility:** Feature chips on camera cards (`getAvailableFeaturesForBucket`) and in modal checklists (`availableFeatureTags`) dynamically query active catalog inventory (`products`).
- **Automatic Out-of-Stock Hiding:** If active inventory for a specific technology/brand contains 0 cameras with a given capability, that feature tag is completely hidden:
  - `360° PTZ` is hidden on Standard HD and IP setups when 0 PTZ cameras exist in catalog.
  - `2-Way Talk` is hidden on IP setups when 0 two-way IP cameras exist in catalog.
  - Wi-Fi or 4G SIM connection options are hidden if no matching cameras exist in stock.
- **Auto-Sanitization on Selection Change:** When a customer switches technology or brand, any previously active feature tags that are unsupported in the new hardware domain are automatically pruned to prevent quote calculation errors.

### 8.7 Centered Non-Intrusive Modal Dialog UX
- **Zero Blocking Popups on Page Load:** Initial quotation catalog load (`ConfiguratorView.tsx`) must never auto-open blocking or checklist modals. Customers land directly on their quotation catalog.
- **On-Demand Access:** Feature Guide and Specification Checklist modals are opened exclusively on demand via explicit user click (`💡 Feature Guide` and `⚙️ Checklist`).
- **Centered Viewport Safety:** Modals are centered on screen (`items-center justify-center max-h-[85vh] rounded-2xl sm:rounded-3xl`) with dedicated internal scrolling and sticky header/footer actions, guaranteeing zero bottom-clipping across all screen sizes."""

    update_file(rules_path, old_rules_sec8, new_rules_sec8, "BUSINESS_RULES.md Section 8")

    # =========================================================================
    # 4. HANDOVER.md
    # =========================================================================
    handover_path = os.path.join(base_dir, "HANDOVER.md")
    old_handover_sec2_7 = """- **WCAG 2.1 AA Compliant Color Harmonization:** Unified brand blue active states (`bg-blue-600`), frosted badges within active tabs, containerized specification chips, muted non-distracting delete actions, and high contrast ratios across both Light Mode and Dark Mode."""

    new_handover_sec2_7_8 = """- **WCAG 2.1 AA Compliant Color Harmonization:** Unified brand blue active states (`bg-blue-600`), frosted badges within active tabs, containerized specification chips, muted non-distracting delete actions, and high contrast ratios across both Light Mode and Dark Mode.
- **Dynamic Inventory-Driven Feature Tags & Resolution Boundaries:** Feature chips dynamically query active catalog inventory (`products`). Tags lacking stocked hardware (e.g., PTZ on HD, 2-way audio on IP) are automatically hidden. Resolution is managed strictly via the `RESOLUTION` dropdown and excluded from feature tags.
- **Centered Non-Intrusive Modal Dialogs:** Modals do not auto-open on quote load. Dialogs are centered (`max-h-[85vh] items-center justify-center`) with scrollable bodies and fixed headers/footers to eliminate viewport clipping.

### 2.8 Dual-Collection Product & Addon Management
- **Unified Deletion & Update API (`/api/admin/products`):** Operates across both `products` and `addons` collections simultaneously in batch, ensuring accessories like Wi-Fi extenders and routers can be deleted or updated without leaving orphan documents.
- **Row-Level Direct Delete UX (`ProductInventory.tsx`):** Every table row provides an individual Trash icon (`Trash2`) with a confirmation dialog for single-click deletion.
- **Edit Modal Direct Delete:** The Edit Product modal footer includes an immediate "Delete Product" button.
- **Distributor Inventory Integration:** Tools (`scripts/sync-all-megacompu-catalog.js`) map 66 verified SKUs across CP Plus, Hikvision, Prama, A+ Products, Secureye, Trueview, and matching DVRs with genuine dealer wholesale pricing and exact distributor Item IDs."""

    update_file(handover_path, old_handover_sec2_7, new_handover_sec2_7_8, "HANDOVER.md Section 2.7 & 2.8")

    # =========================================================================
    # 5. docs/PRODUCTION_TRUTH.md
    # =========================================================================
    prod_truth_path = os.path.join(base_dir, "docs", "PRODUCTION_TRUTH.md")
    old_prod_truth_header = """> **Last Updated:** October 13, 2026"""
    new_prod_truth_header = """> **Last Updated:** November 4, 2026"""
    update_file(prod_truth_path, old_prod_truth_header, new_prod_truth_header, "PRODUCTION_TRUTH.md Date")

    old_prod_truth_rules = """12. **Per-Bucket Feature Isolation & UI Accessibility Invariant:**
    - `mixed_camera_requirements` preserves bucket-level `features` (`color`, `mic`, `2-way`, `ptz`).
    - The pricing engine (`pricing-engine.ts`) strictly processes bucket features independently, preventing feature leakage across unrelated camera buckets.
    - Outdoor cameras are permanently marked with standard IP67 Weatherproofing (`🌧️ IP67 Weatherproof Standard`); 4G cameras are permanently marked with built-in 4G SIM (`🛰️ 4G SIM Built-in`).
    - Color contrast across all customer-facing screens must satisfy WCAG 2.1 AA (minimum 4.5:1) in both Light Mode and Dark Mode, with unified brand blue active states and frosted semi-transparent tags inside colored containers."""

    new_prod_truth_rules = """12. **Per-Bucket Feature Isolation & UI Accessibility Invariant:**
    - `mixed_camera_requirements` preserves bucket-level `features` (`color`, `mic`, `2-way`, `ptz`).
    - The pricing engine (`pricing-engine.ts`) strictly processes bucket features independently, preventing feature leakage across unrelated camera buckets.
    - Outdoor cameras are permanently marked with standard IP67 Weatherproofing (`🌧️ IP67 Weatherproof Standard`); 4G cameras are permanently marked with built-in 4G SIM (`🛰️ 4G SIM Built-in`).
    - Color contrast across all customer-facing screens must satisfy WCAG 2.1 AA (minimum 4.5:1) in both Light Mode and Dark Mode, with unified brand blue active states and frosted semi-transparent tags inside colored containers.

13. **Dual-Collection Cascade Delete & Update Invariant:**
    - Hardware management (`/admin/products`) unifies `products` and `addons`. All backend mutations (`DELETE`, `PATCH` via `/api/admin/products`) must operate across both collections in parallel to prevent undeletable orphan records.
    - Table rows in `ProductInventory.tsx` must provide an individual Trash button under `ACTIONS` for direct single-click deletion with confirmation.

14. **Dynamic Inventory-Driven Feature Tag Invariant:**
    - Feature tags on camera cards (`getAvailableFeaturesForBucket`) and in modal checklists (`availableFeatureTags`) must only display capabilities backed by active, stocked products in that technology and brand.
    - Resolution is strictly governed by the `RESOLUTION` selector and prohibited from feature tag arrays.

15. **Non-Intrusive Centered Dialog Invariant:**
    - Landing on quotation catalogs must never trigger auto-opening blocking popups. Modals open strictly on customer click.
    - Dialogs must be centered with responsive `max-h-[85vh]` and internal scroll containers to prevent viewport clipping on mobile and tablet devices."""

    update_file(prod_truth_path, old_prod_truth_rules, new_prod_truth_rules, "PRODUCTION_TRUTH.md Rules")

    # =========================================================================
    # 6. docs/UX_ARCHITECTURE.md
    # =========================================================================
    ux_arch_path = os.path.join(base_dir, "docs", "UX_ARCHITECTURE.md")
    old_ux_debt = """## 4. Current UX Debt & Migration Path
- Phase 0.5 audit reveals that only ~21% of screens (specifically ~20 admin screens) use the standard `components/ui` library. The remaining ~80% across all personas need modernization.
- **Action items**: 
  - Remove remnant `confirm()` in `app/(admin)/admin/products/page.tsx` line 93.
  - Refactor legacy `/operations` and `/sales` screens that circumvent the standard layout."""

    new_ux_debt = """## 4. Current UX Debt & Migration Path
- Phase 0.5 audit reveals that only ~21% of screens (specifically ~20 admin screens) use the standard `components/ui` library. The remaining ~80% across all personas need modernization.
- **Completed Remediations:**
  - Removed remnant native `confirm()` in `app/(admin)/admin/products/page.tsx`. Replaced with in-app confirmation states and direct modal action buttons.
  - Added direct row-level Trash buttons (`Trash2`) in `ProductInventory.tsx` for single-click deletion with confirmation dialogs.
  - Eliminated blocking auto-popups on initial quote landing; dialogs are centered, responsive, and opened strictly on-demand."""

    update_file(ux_arch_path, old_ux_debt, new_ux_debt, "UX_ARCHITECTURE.md Section 4")

    old_ux_patterns = """- **Specialized Interaction Patterns**
- **Quotation Wizard (Catalog-First)**: Following OTP verification, users are presented with a full **Catalog Grid** of quotation variants, equipped with filters for Brand, Resolution, and Technology. Users can select a single quote to proceed to Add-ons, or use the `CompareTray` to select 2-3 quotes for a detailed Side-by-Side Comparison (`CompareCards`) before proceeding. The legacy Single Card variation has been deprecated in favor of this e-commerce style browsing experience."""

    # Note: line 29 in UX_ARCHITECTURE.md: "## 5. Specialized Interaction Patterns\n- **Quotation Wizard (Catalog-First)**:"
    old_ux_sec5 = """## 5. Specialized Interaction Patterns
- **Quotation Wizard (Catalog-First)**: Following OTP verification, users are presented with a full **Catalog Grid** of quotation variants, equipped with filters for Brand, Resolution, and Technology. Users can select a single quote to proceed to Add-ons, or use the `CompareTray` to select 2-3 quotes for a detailed Side-by-Side Comparison (`CompareCards`) before proceeding. The legacy Single Card variation has been deprecated in favor of this e-commerce style browsing experience."""

    new_ux_sec5 = """## 5. Specialized Interaction Patterns
- **Quotation Wizard (Catalog-First)**: Following OTP verification, users are presented with a full **Catalog Grid** of quotation variants, equipped with filters for Brand, Resolution, and Technology. Users can select a single quote to proceed to Add-ons, or use the `CompareTray` to select 2-3 quotes for a detailed Side-by-Side Comparison (`CompareCards`) before proceeding. The legacy Single Card variation has been deprecated in favor of this e-commerce style browsing experience.
- **Dynamic Inventory-Driven Feature Filtering**: Camera cards dynamically query active stock, displaying only feature tags (`24/7 Color`, `Audio Mic`, `2-Way Talk`, `360° PTZ`) that exist for the chosen brand and technology. Resolution is strictly configured via the `RESOLUTION` dropdown.
- **Non-Intrusive Centered Dialog Architecture**: Modal dialogs (`TagGuideModal`, `SpecificationChecklistModal`) are centered with responsive `max-h-[85vh]` and viewport safety. Zero blocking popups on quotation page load."""

    update_file(ux_arch_path, old_ux_sec5, new_ux_sec5, "UX_ARCHITECTURE.md Section 5")

    # =========================================================================
    # 7. .agents/rules/quotation-display-strategy.md
    # =========================================================================
    quote_strat_path = os.path.join(base_dir, ".agents", "rules", "quotation-display-strategy.md")
    old_quote_sec7 = """## 7. Inventory-Driven Feature Tags & Modal Safety (Layer 37)
- **Inventory Filtering Invariant:** Feature options on camera cards and modals must be dynamically computed against active inventory (`products`). Never display feature chips or checkboxes for capabilities that lack matching stock in the active technology (e.g. no PTZ in HD/IP, no 2-way in IP).
- **Separation of Resolution and Features:** 5MP / clarity belongs exclusively to the `RESOLUTION` selector. It must never appear as an add-on feature tag.
- **Zero Blocking Popups on Page Load:** Let the customer view their quote immediately upon landing. Checklist and Feature Guide modals are accessible on-demand."""

    new_quote_sec7 = """## 7. Inventory-Driven Feature Tags & Modal Safety (Layer 37)
- **Inventory Filtering Invariant:** Feature options on camera cards and modals must be dynamically computed against active inventory (`products`). Never display feature chips or checkboxes for capabilities that lack matching stock in the active technology (e.g. no PTZ in HD/IP, no 2-way in IP).
- **Separation of Resolution and Features:** 5MP / clarity belongs exclusively to the `RESOLUTION` selector. It must never appear as an add-on feature tag.
- **Zero Blocking Popups on Page Load:** Let the customer view their quote immediately upon landing. Checklist and Feature Guide modals are accessible on-demand.
- **Centered Responsive Dialogs:** All modal dialogs must use centered layouts (`items-center justify-center max-h-[85vh] rounded-2xl sm:rounded-3xl`) with dedicated internal scroll containers to prevent action button clipping on mobile and tablet screens."""

    update_file(quote_strat_path, old_quote_sec7, new_quote_sec7, "quotation-display-strategy.md Section 7")

    print("\nAll .md documentation files updated successfully!")

if __name__ == "__main__":
    main()
