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
- **Action items**: 
  - Remove remnant `confirm()` in `app/(admin)/admin/products/page.tsx` line 93.
  - Refactor legacy `/operations` and `/sales` screens that circumvent the standard layout.

## 5. Specialized Interaction Patterns
- **Quotation Wizard (Catalog-First)**: Following OTP verification, users are presented with a full **Catalog Grid** of quotation variants, equipped with filters for Brand, Resolution, and Technology. Users can select a single quote to proceed to Add-ons, or use the `CompareTray` to select 2-3 quotes for a detailed Side-by-Side Comparison (`CompareCards`) before proceeding. The legacy Single Card variation has been deprecated in favor of this e-commerce style browsing experience.
- **Authentication**: Strict reliance on Firebase Phone Auth invisible reCAPTCHA. Custom backend SMS APIs are deprecated to unify trust boundaries.
- **Universal Full Map View & High-Density Territory Workspaces**: For complex spatial tasks (coverage zone creation, postal boundary inspection, and sales beat distribution), maps provide a synchronized **Full Map View** toggle. This expands constrained dialogs or 380px embedded previews into a panoramic, edge-to-edge workspace (`fixed inset-0 z-[9999]`) with Google Maps road/satellite layer controls, micro-hub halo decluttering (`Halos: ON/OFF`), and 1-click `⚡ Auto-Trace Territory` convex hull generation. Escape key listeners and prominent exit buttons guarantee intuitive navigation back to standard dashboard layouts.
