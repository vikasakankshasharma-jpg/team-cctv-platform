# SCREEN INVENTORY & AUDIT REPORT

## Metrics Summary
- **Total Screens:** 94
- **By Route Group:**
  - `(admin)`: 55 screens
  - `(customer)`: 13 screens
  - `(installer)`: 6 screens
  - `(partner)`: 5 screens
  - `(salesperson)`: 4 screens
  - `root / other`: 11 screens
- **`components/ui` Usage:** ~21% (20/94) pages leverage standard shadcn/ui components (specifically ~20/68 admin pages, and 0% across customer, installer, and partner routes).
- **Native Dialogs (`alert`, `confirm`, `prompt`):**
  - `app/(admin)/admin/products/page.tsx` (Line 93): Uses `confirm("Are you sure you want to delete...")`

---

## Admin Navigation Sidebar Items
The primary Admin interface provides the following routing structure:
- **Overview:** Dashboard (`/admin`), Analytics (`/admin/analytics`)
- **Sales Operations:** Leads & CRM (`/admin/leads`), Expansion Hub (`/admin/expansion`), Site Visits (`/admin/bookings`), Campaigns (`/admin/campaigns`), Reports (`/admin/reports`), Salespersons (`/admin/salespersons`)
- **Product Catalog:** Catalog & Pricing (`/admin/catalog-manager`), Hardware Inventory (`/admin/products`), Vendor Import (`/admin/vendor-import`), Data Management (`/admin/products/bulk`), AI Spec Enrichment (`/admin/products/enrich`), Manual Spec Editor (`/admin/products/manual-enrich`), Compatibility (`/admin/compatibility`), Catalog Health (`/admin/products/health`), Live Pricing (`/admin/pricing`), Geo-Pricing Rules (`/admin/pricing/geo-rules`), Quotation Matrices (`/admin/pricing/matrices`), Rules & Add-ons (`/admin/rules`), Card Layouts (`/admin/card-layouts`)
- **Operations Network:** Dispatch Center (`/admin/dispatch`), City Hubs (`/admin/hubs`), Verified Installers (`/admin/installers`), Promoters (`/admin/promoters`), Ledger & Payouts (`/admin/commission`)
- **System:** Settings (`/admin/settings`), Audit Logs (`/admin/reports/logs`)

---

## Exhaustive Screen Inventory

### 1. `(admin)` Group - 55 Screens
**Primary Persona:** Operations/Admin, Finance

| Route Path | File Path | Tag | Notes |
|---|---|---|---|
| `/admin` | `(admin)/admin/page.tsx` | KEEP | Primary Admin Dashboard |
| `/admin/analytics` | `(admin)/admin/analytics/page.tsx` | KEEP | Global analytics |
| `/admin/leads` | `(admin)/admin/leads/page.tsx` | KEEP | CRM Lead tracking |
| `/admin/leads/[leadId]` | `(admin)/admin/leads/[leadId]/page.tsx` | KEEP | Lead details |
| `/admin/leads/[leadId]/deal` | `(admin)/admin/leads/[leadId]/deal/page.tsx` | MERGE | Merge into lead details tabs |
| `/admin/leads/[leadId]/quote-builder` | `(admin)/admin/leads/[leadId]/quote-builder/page.tsx` | KEEP | Quote creation flow |
| `/admin/expansion` | `(admin)/admin/expansion/page.tsx` | KEEP | Franchise/Expansion tracking |
| `/admin/bookings` | `(admin)/admin/bookings/page.tsx` | KEEP | Site visits scheduling |
| `/admin/campaigns` | `(admin)/admin/campaigns/page.tsx` | KEEP | Marketing campaigns |
| `/admin/reports` | `(admin)/admin/reports/page.tsx` | KEEP | Report hub |
| `/admin/reports/logs` | `(admin)/admin/reports/logs/page.tsx` | KEEP | Audit logs |
| `/admin/salespersons` | `(admin)/admin/salespersons/page.tsx` | KEEP | Manage sales team |
| `/admin/catalog-manager` | `(admin)/admin/catalog-manager/page.tsx` | KEEP | Unified catalog config |
| `/admin/catalog` | `(admin)/admin/catalog/page.tsx` | REMOVE | Deprecated by catalog-manager |
| `/admin/products` | `(admin)/admin/products/page.tsx` | KEEP | Hardware inventory |
| `/admin/products/bulk` | `(admin)/admin/products/bulk/page.tsx` | KEEP | Bulk operations |
| `/admin/products/enrich` | `(admin)/admin/products/enrich/page.tsx` | KEEP | AI enrichment |
| `/admin/products/manual-enrich` | `(admin)/admin/products/manual-enrich/page.tsx` | MERGE | Merge into product details edit |
| `/admin/products/health` | `(admin)/admin/products/health/page.tsx` | KEEP | Catalog data health |
| `/admin/vendor-import` | `(admin)/admin/vendor-import/page.tsx` | KEEP | 3rd-party integrations |
| `/admin/compatibility` | `(admin)/admin/compatibility/page.tsx` | KEEP | Hardware matching logic |
| `/admin/pricing` | `(admin)/admin/pricing/page.tsx` | KEEP | Pricing waterfall control |
| `/admin/pricing/geo-rules` | `(admin)/admin/pricing/geo-rules/page.tsx` | KEEP | Geolocation rules |
| `/admin/pricing/matrices` | `(admin)/admin/pricing/matrices/page.tsx` | KEEP | Quote tier matrices |
| `/admin/pricing/logs` | `(admin)/admin/pricing/logs/page.tsx` | MERGE | Merge into global audit logs |
| `/admin/rules` | `(admin)/admin/rules/page.tsx` | KEEP | Rule engine |
| `/admin/card-layouts` | `(admin)/admin/card-layouts/page.tsx` | KEEP | UI card configurations |
| `/admin/dispatch` | `(admin)/admin/dispatch/page.tsx` | KEEP | Order dispatch |
| `/admin/hubs` | `(admin)/admin/hubs/page.tsx` | KEEP | Warehouse hubs |
| `/admin/installers` | `(admin)/admin/installers/page.tsx` | KEEP | Network of installers |
| `/admin/promoters` | `(admin)/admin/promoters/page.tsx` | KEEP | Partner promoters |
| `/admin/commission` | `(admin)/admin/commission/page.tsx` | KEEP | Earnings & Payouts |
| `/admin/settings` | `(admin)/admin/settings/page.tsx` | KEEP | Global settings |
| `/admin/addons` | `(admin)/admin/addons/page.tsx` | MERGE | Move to rules/catalog |
| `/admin/finance` | `(admin)/admin/finance/page.tsx` | KEEP | Financial ledger |
| `/admin/inventory` | `(admin)/admin/inventory/page.tsx` | MERGE | Redundant with products |
| `/admin/inventory/exceptions` | `(admin)/admin/inventory/exceptions/page.tsx` | MERGE | Fold into inventory/products |
| `/admin/inventory/ledger` | `(admin)/admin/inventory/ledger/page.tsx` | KEEP | Stock movements |
| `/admin/inventory/purchase` | `(admin)/admin/inventory/purchase/page.tsx` | KEEP | PO management |
| `/admin/operations` | `(admin)/admin/operations/page.tsx` | KEEP | General ops dashboard |
| `/admin/operations/jobs/[jobId]` | `(admin)/admin/operations/jobs/[jobId]/page.tsx` | KEEP | Job workflow |
| `/admin/wizard` | `(admin)/admin/wizard/page.tsx` | MERGE | If test env, move to root. Else remove. |
| `/admin/payouts` | `(admin)/admin/payouts/page.tsx` | MERGE | Fold into commission ledger |
| `/admin/price-match` | `(admin)/admin/price-match/page.tsx` | KEEP | Price matching ops |
| `/admin/sales` | `(admin)/admin/sales/page.tsx` | MERGE | Fold into leads/dashboard |
| `/admin/spec-optimizer` | `(admin)/admin/spec-optimizer/page.tsx` | MERGE | Fold into products enrich |
| `/admin/login` | `(admin)/admin/login/page.tsx` | KEEP | Admin auth |
| `/ai-dashboard` | `(admin)/ai-dashboard/page.tsx` | MOVE | Move to `/admin/ai-dashboard` |
| `/expansion` | `(admin)/expansion/page.tsx` | MOVE | Move to `/admin/expansion` |
| `/reports/*` | `(admin)/reports/(various)/page.tsx` (6 files) | MOVE | Move entirely under `/admin/reports/...` |

### 2. `(customer)` Group - 13 Screens
**Primary Persona:** Customer

| Route Path | File Path | Tag | Notes |
|---|---|---|---|
| `/` | `(customer)/page.tsx` | KEEP | Marketing landing page |
| `/[city]` | `(customer)/[city]/page.tsx` | KEEP | Geo-targeted landing pages |
| `/wizard` | `(customer)/wizard/page.tsx` | KEEP | Core B2C self-serve quotation builder |
| `/pro-builder` | `(customer)/pro-builder/page.tsx` | KEEP | Advanced e-com builder |
| `/build` | `(customer)/build/page.tsx` | MERGE | Unify with pro-builder |
| `/onboarding` | `(customer)/onboarding/page.tsx` | KEEP | Customer lead gen |
| `/quote/[leadId]` | `(customer)/quote/[leadId]/page.tsx` | KEEP | Quote presentation |
| `/quote/[leadId]/review/[quoteId]` | `(customer)/quote/[leadId]/review/[quoteId]/page.tsx` | KEEP | Quote approval/payment |
| `/track/[id]` | `(customer)/track/[id]/page.tsx` | KEEP | Job/Installation tracking |
| `/payment-success` | `(customer)/payment-success/page.tsx` | KEEP | Checkout callback |
| `/for-installers` | `(customer)/for-installers/page.tsx` | MOVE | Move out of customer group, marketing for partners |
| `/privacy-policy` | `(customer)/privacy-policy/page.tsx` | KEEP | Legal |
| `/terms-of-service` | `(customer)/terms-of-service/page.tsx` | KEEP | Legal |

### 3. `(installer)` Group - 6 Screens
**Primary Persona:** Installer

| Route Path | File Path | Tag | Notes |
|---|---|---|---|
| `/installer/dashboard` | `(installer)/installer/dashboard/page.tsx` | KEEP | Installer home |
| `/installer/jobs` | `(installer)/installer/jobs/page.tsx` | KEEP | Assigned job pipeline |
| `/installer/jobs/[id]` | `(installer)/installer/jobs/[id]/page.tsx` | KEEP | Job execution & proof |
| `/installer/ledger` | `(installer)/installer/ledger/page.tsx` | KEEP | Installer earnings |
| `/installer/login` | `(installer)/installer/login/page.tsx` | KEEP | Installer auth |
| `/installer/profile` | `(installer)/installer/profile/page.tsx` | KEEP | Settings/KYC |

### 4. `(partner)` Group - 5 Screens
**Primary Persona:** Partner/Promoter

| Route Path | File Path | Tag | Notes |
|---|---|---|---|
| `/partner/dashboard` | `(partner)/partner/dashboard/page.tsx` | KEEP | Partner home |
| `/partner/leads` | `(partner)/partner/leads/page.tsx` | KEEP | Referred lead tracking |
| `/partner/commissions` | `(partner)/partner/commissions/page.tsx` | KEEP | Affiliate ledger |
| `/partner/login` | `(partner)/partner/login/page.tsx` | KEEP | Partner auth |
| `/partner/profile` | `(partner)/partner/profile/page.tsx` | KEEP | Settings/KYC |

### 5. `(salesperson)` Group - 4 Screens
**Primary Persona:** Salesperson

| Route Path | File Path | Tag | Notes |
|---|---|---|---|
| `/salesperson/dashboard` | `(salesperson)/salesperson/dashboard/page.tsx` | KEEP | Sales portal |
| `/salesperson/leads` | `(salesperson)/salesperson/leads/page.tsx` | KEEP | Assigned leads |
| `/salesperson/create-quote` | `(salesperson)/salesperson/create-quote/page.tsx` | KEEP | Manual quote generator |
| `/salesperson/commissions` | `(salesperson)/salesperson/commissions/page.tsx` | KEEP | Staff commissions |

### 6. `root / other` Group - 11 Screens
**Primary Persona:** Mixed / Legacy

| Route Path | File Path | Tag | Notes |
|---|---|---|---|
| `/login` | `login/page.tsx` | REMOVE | Deprecated root login. Use persona-specific logins. |
| `/test-login` | `test-login/page.tsx` | REMOVE | Development artifact |
| `/__e2e/login` | `__e2e/login/page.tsx` | KEEP | E2E test harness |
| `/offline` | `offline/page.tsx` | KEEP | PWA fallback |
| `/unauthorized` | `unauthorized/page.tsx` | KEEP | Auth failure redirect |
| `/onboarding/partner` | `onboarding/partner/page.tsx` | MOVE | Move to `(partner)` group |
| `/operations` | `operations/page.tsx` | REMOVE | Legacy/duplicate of admin/operations |
| `/operations/jobs/[id]` | `operations/jobs/[id]/page.tsx` | REMOVE | Legacy/duplicate |
| `/sales` | `sales/page.tsx` | REMOVE | Legacy/duplicate |
| `/sales/lead/[id]` | `sales/lead/[id]/page.tsx` | REMOVE | Legacy/duplicate |
| `/sys-admin/pricing` | `sys-admin/pricing/page.tsx` | REMOVE | Duplicate of admin/pricing |
