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

### 2. Quote
- **Creation**: Server-generated in `lib/pricing-engine.ts`.
- **States**: `DRAFT` -> `PENDING_CUSTOMER_APPROVAL` -> `APPROVED` / `EXPIRED`.
- **Immutability**: Revisions create a new `parentQuoteId_vN`.

### 3. Payment
- **Creation**: Created via Razorpay webhook.
- **States**: `PENDING` -> `ADVANCE_PAID` -> `PAID` -> `FAILED` / `REFUNDED`.

### 4. Job / Installation
- **Creation**: Triggered when Quote transitions to `APPROVED` (Advance Paid).
- **States**: `UNASSIGNED` -> `ASSIGNED` -> `IN_PROGRESS` -> `COMPLETED` -> `VERIFIED`.

### 5. Invoice
- **Creation**: Generated post-payment or post-job.
- **States**: `DRAFT` -> `ISSUED` -> `PAID`.
