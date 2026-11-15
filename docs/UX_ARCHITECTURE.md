# UX & UI Architecture

## 1. Design System Consistency
The `team-cctv-platform` relies on a unified design system powered by **shadcn/ui** (located in `components/ui/`) and **Tailwind CSS**.

### Guidelines for UI Architecture:
1. **No Native Dialogs**: The use of `window.alert()`, `window.confirm()`, and `window.prompt()` is strictly prohibited as they block the main thread and provide a degraded user experience. 
   - *Alternative:* Always use the `Dialog` or `AlertDialog` components from `components/ui`.
2. **Component Reuse**: Do not build custom UI primitives (like buttons, inputs, dropdowns) if a shadcn/ui equivalent exists. 
3. **Theme Variables**: Use semantic CSS variables for colors (e.g., `bg-primary`, `text-muted-foreground`) rather than hardcoded Tailwind colors (like `bg-blue-600`), ensuring seamless light/dark mode support.
4. **Responsive Layouts**: All screens must be mobile-responsive by default. Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` patterns. 

## 2. Global Navigation Strategy
- **Role-based Segregation**: Navigation is deeply segregated by Next.js route groups `(admin)`, `(customer)`, `(installer)`, `(partner)`, and `(salesperson)`.
- **Top Nav**: Global context switching (Customer login, cart/quote access).
- **Sidebar**: Detailed hierarchical navigation for staff roles (Admin, Salesperson, Installer).

## 3. Data Mutation Patterns (Server Actions & API)
- **Loading States**: Every button triggering an asynchronous action MUST implement an `isLoading` prop to prevent double-clicks (e.g., `disabled={loading}`).
- **Toast Notifications**: Use `useToast()` from the UI library for success/error feedback instead of custom banners or alerts.
- **Fail-closed**: All forms should fail gracefully and display inline validation errors (using `react-hook-form` and `zod` where possible).

## 4. Current UX Debt & Migration Path
- Phase 0.5 audit reveals that only ~21% of screens (specifically ~20 admin screens) use the standard `components/ui` library. The remaining ~80% across all personas need modernization.
- **Completed Remediations:**
  - Removed remnant native `confirm()` in `app/(admin)/admin/products/page.tsx`. Replaced with in-app confirmation states and direct modal action buttons.
  - Added direct row-level Trash buttons (`Trash2`) in `ProductInventory.tsx` for single-click deletion with confirmation dialogs.
  - Eliminated blocking auto-popups on initial quote landing; dialogs are centered, responsive, and opened strictly on-demand.

## 5. Specialized Interaction Patterns
- **Quotation Wizard (Catalog-First)**: Following OTP verification, users are presented with a full **Catalog Grid** of quotation variants, equipped with filters for Brand, Resolution, and Technology. Users can select a single quote to proceed to Add-ons, or use the `CompareTray` to select 2-3 quotes for a detailed Side-by-Side Comparison (`CompareCards`) before proceeding. The legacy Single Card variation has been deprecated in favor of this e-commerce style browsing experience.
- **Dynamic Inventory-Driven Feature Filtering**: Camera cards dynamically query active stock, displaying only feature tags (`24/7 Color`, `Audio Mic`, `2-Way Talk`, `360° PTZ`) that exist for the chosen brand and technology. Resolution is strictly configured via the `RESOLUTION` dropdown.
- **Non-Intrusive Centered Dialog Architecture**: Modal dialogs (`TagGuideModal`, `SpecificationChecklistModal`) are centered with responsive `max-h-[85vh]` and viewport safety. Zero blocking popups on quotation page load.
- **Authentication & Error Resilience**: Unified server-side WhatsApp & SMS OTP delivery via MSG91 (`Msg91WhatsAppProvider.sendOtpTemplate` with `cleanEnvVar()`/`cleanPhoneEnvVar()` sanitization in `lib/env-utils.ts`), Firebase Auth session upgrade, cross-device `WhatsAppOtpNotice` app launcher (`whatsapp://send?phone=...` native anchor + mobile/desktop fallback), and `extractErrorMessage()` (`lib/utils.ts`) preventing `[object Object]` UI errors.
- **Universal Full Map View & High-Density Territory Workspaces**: For complex spatial tasks (coverage zone creation, postal boundary inspection, and sales beat distribution), maps provide a synchronized **Full Map View** toggle. This expands constrained dialogs or 380px embedded previews into a panoramic, edge-to-edge workspace (`fixed inset-0 z-[9999]`) with Google Maps road/satellite layer controls, micro-hub halo decluttering (`Halos: ON/OFF`), and 1-click `⚡ Auto-Trace Territory` convex hull generation. Escape key listeners and prominent exit buttons guarantee intuitive navigation back to standard dashboard layouts.

## 6. Mobile-First Interactive Guided Tour Architecture (`components/tour/`)
- **Journey-Wise Step Micro-Tours:** Guidance is triggered contextually per wizard step (`activeStep={step}`) or per page route via `InteractivePageTour.tsx` rather than a blocking upfront walkthrough.
- **Hardware Impact Focus:** Explains the real-world impact of button choices (weatherproof bullets vs indoor domes, HD vs IP, storage duration) on hardware, cabling, and 100% GST-paid pricing.
- **User Agency:** Features explicit `[ Next / Try It ]`, `[ Skip ]` (current step only: `team_tour_page_skip:<pageId>`), and `[ Don't show guides automatically again ]` (`localStorage.setItem('team_tour_skip_all', 'true')`).
- **Header Persistent Trigger:** The `[ 💡 Guide ]` pill is mounted in top headers via `renderTrigger` to eliminate any visual clash with floating WhatsApp widgets or bottom CTA bars.
- **Mobile Viewport Inversion:** Dynamically docks cards above or below the highlighted target based on screen position (`center < viewportHeight / 2 ? 'bottom' : 'top'`), with body scroll locking and iOS safe-area handling (`env(safe-area-inset-bottom)`).
- **Operational & Staff Coverage:** Extends guided tour coverage across all personas:
  - Customer Builder (`cctv-wizard`, `quote-catalog`, `quote-review`)
  - Customer Service & Operations (`track-booking`, `customer-dashboard`)
  - Admin Deal Closer (`admin-deal-tour`: selling price vs taxable base & GST, margin status, profit waterfall, and approval links)
  - Installer On-Site Mobile Card (`installer-job-tour`: job status, barcode device scanning, installation before/after proof photos, secret completion PIN verification)
  - Partner / Promoter Portal (`partner-leads-tour`: pipeline tracking; `partner-commissions-tour`: 194H TDS deduction and net bank payouts)
- **Decoupled Telemetry Layer (`lib/analytics/tour-analytics.ts`):** Emits allow-listed events (`tour_started`, `tour_step_viewed`, `tour_completed`, `tour_skipped`, `tour_skip_all`) via synchronous custom DOM events and lazy-loaded Firebase Analytics. Enforces zero PII leakage (no customer names, phones, emails, order/quote IDs, or secret PINs).
- **Compositor-Friendly Mobile Motion:** Utilizes GPU-accelerated CSS keyframes (`animate-tour-pulse`, `animate-tour-card-enter` with `translate3d`), static `supports-[backdrop-filter]:backdrop-blur-[1px]`, ring-only scaling, and `@media (prefers-reduced-motion: reduce)` safety.
- **Certified Isolation:** Read-only UI overlay; never mutates pricing, GST, or BOM data structures.


