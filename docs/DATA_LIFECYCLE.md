# Data Lifecycle & Firestore Entities

## All Discovered Collections

- `addon_rules`
- `addons`
- `admins`
- `ai_brain`
- `amc_contracts`
- `amc_plans`
- `analytics_rejections`
- `app_config`
- `audit_logs`
- `catalog`
- `change_orders`
- `city_impressions`
- `commission_records`
- `comparison_card_layouts`
- `coverage_zones`
- `customer_warranty_items`
- `customers`
- `data_migration_review`
- `deals`
- `demand_impressions`
- `feature_tags`
- `followup_campaigns`
- `followup_tasks`
- `franchise_dealers`
- `geo_pricing_rules`
- `hubs`
- `industrial_leads`
- `installer_applications`
- `installers`
- `interest_leads`
- `inventory`
- `inventory_exceptions`
- `inventory_ledger`
- `invoices`
- `jobs`
- `leads`
- `ledger_transactions`
- `otp_verifications`
- `otps`
- `payment_transactions`
- `payout_requests`
- `price_change_log`
- `pricing_audit_logs`
- `product_groups`
- `products`
- `profitability_snapshots`
- `promoters`
- `purchase_orders`
- `quoteDeliveries`
- `quote_events`
- `quote_sessions`
- `quotes`
- `rate_limits`
- `receipts`
- `recommendation_rules`
- `rma_tickets`
- `salespeople`
- `salespersons`
- `serial_assets`
- `service_areas`
- `service_tickets`
- `settings`
- `site_visit_bookings`
- `specification_knowledge`
- `staged_products`
- `stock_ledger`
- `temp_otps`
- `transactions`
- `vendor_categories`
- `vendors`
- `warranty_certificates`
- `wizard_steps`

## Core Object Lifecycles

### 1. Lead / Customer Requirement
- **Creation**: Generated via `/wizard`, `/pro-builder`, or `/onboarding`.
- **States**: `NEW` -> `QUOTE_SENT` -> `NEGOTIATING` -> `WON` / `LOST`.
- **Collection**: `leads`, `requirements`

### 2. Quote & Invoicing Modalities
- **Creation**: Server-generated in `lib/pricing-engine.ts`.
- **States**: `DRAFT` -> `PENDING_CUSTOMER_APPROVAL` -> `BOOKED` (Advance Paid) / `PAID` (Smart Pay Full Discount).
- **Smart Pay (100% Upfront)**: Generates full **TAX INVOICE** (`INV-xxxx`) with `PAID` watermark, `amount_due = 0`, and 2% discount itemization.
- **Milestone (₹500 Booking)**: Generates **Advance Receipt** with remaining balance due at delivery (90%) and install (10%).
- **Immutability**: Once settled, original tax invoices cannot be overwritten; revisions spawn `v2/v3` quotes, and on-site extra work spawns Supplementary Invoices.

### 3. Payment & Field Collection Modalities
- **Creation**: Created via Razorpay webhook or Fallback Verification API.
- **On-Screen Dynamic UPI QR**: Instant dynamic QR rendered on technician smartphone screens (`DynamicOnScreenQRCodeModal`). Polled every 2.5s with instant 3s verification and audio confirmation chime.
- **Cash Authority Gate**: Gated by `cash_collection_approved: boolean` on lead/quote. Technicians submit `/api/installer/cash-approval/request`; Admins approve via `/api/admin/leads/[leadId]/approve-cash`.
- **States**: `PENDING` -> `ADVANCE_PAID` -> `DELIVERY_PAID` -> `PAID` -> `FAILED` / `REFUNDED`.

### 4. Job / Installation & On-Site Change Orders
- **Creation**: Triggered when Quote transitions to `BOOKED` or `PAID`.
- **States**: `UNASSIGNED` -> `ASSIGNED` -> `IN_PROGRESS` -> `COMPLETED` -> `VERIFIED`.
- **Change Orders (`change_orders` collection)**:
  - Triggered by installer via `InstallerChangeOrderModal` for on-site extra cabling, conduit, junction boxes, or labor.
  - States: `pending_customer_approval` -> `approved` -> `paid`.
  - Spawns an official **Supplementary Tax Invoice** (`INV-xxxx-S1`) preserving base invoice GST compliance.

### 5. Invoice & Supplementary Tax Invoices
- **Creation**: Base invoices generated on quote acceptance (`/api/invoice/generate`); supplementary invoices generated on change order creation (`/api/invoice/change-order`).
- **Types**: Base Tax Invoice (`INV-yyyy-xxxxx`), Advance Receipt (`REC-yyyy-xxxxx`), Supplementary Tax Invoice (`INV-yyyy-xxxxx-S1`).
- **States**: `DRAFT` -> `ISSUED` -> `PAID`.
