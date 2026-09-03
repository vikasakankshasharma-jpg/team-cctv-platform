# API & Screen Map (Wiring Map)

This document tracks all API routes, their HTTP methods, the Firestore collections they touch, and the UI components that call them.

| Route Path | Methods | Collections Touched | Callers |
|---|---|---|---|
| `/api/admin/amc-plans` | GET, POST | amc_plans | *Orphan Route?* |
| `/api/admin/amc-plans/[id]` | GET, PATCH | amc_plans | *Orphan Route?* |
| `/api/admin/analytics` | GET | quoteDeliveries, quotes | AnalyticsClient.tsx |
| `/api/admin/analytics/territory` | GET | leads | *Orphan Route?* |
| `/api/admin/audit` | GET | audit_logs | page.tsx<br>e2e-admin-ui.spec.ts |
| `/api/admin/card-layouts` | GET, POST | comparison_card_layouts | CardLayoutClient.tsx |
| `/api/admin/card-layouts/[id]` | PUT, DELETE | comparison_card_layouts | *Orphan Route?* |
| `/api/admin/catalog-repair` | POST | products | CatalogRepairButton.tsx |
| `/api/admin/catalog-repair/fix-technologies` | POST | products | *Orphan Route?* |
| `/api/admin/coverage-zones` | GET, POST | coverage_zones | SalespersonsClient.tsx<br>ExpansionClient.tsx |
| `/api/admin/coverage-zones/[id]` | PUT, DELETE | coverage_zones | *Orphan Route?* |
| `/api/admin/dispatch/jobs` | GET | jobs | *Orphan Route?* |
| `/api/admin/dispatch/jobs/[jobId]` | PATCH | jobs | *Orphan Route?* |
| `/api/admin/enrich-products` | POST, PATCH | products | ProductEnrichmentClient.tsx |
| `/api/admin/features` | GET, POST, PATCH | feature_tags | page.tsx |
| `/api/admin/geo-rules` | GET, POST | geo_pricing_rules | *Orphan Route?* |
| `/api/admin/hubs` | GET, POST | hubs | *Orphan Route?* |
| `/api/admin/installers` | GET, POST | installers | *Orphan Route?* |
| `/api/admin/installers/verify-bank` | POST | - | InstallersClient.tsx |
| `/api/admin/payouts/approve` | POST | payout_requests, ledger_transactions | PayoutsClient.tsx |
| `/api/admin/payouts/manual` | POST | transactions | InstallersClient.tsx |
| `/api/admin/price-match` | GET | - | PriceMatchHubClient.tsx |
| `/api/admin/price-match/[requestId]` | POST | leads | *Orphan Route?* |
| `/api/admin/pricing/config` | GET, POST | app_config, audit_logs | page.tsx<br>e2e-admin-pricing.spec.ts<br>e2e-admin-ui.spec.ts |
| `/api/admin/pricing/products` | GET | products | page.tsx<br>e2e-admin-pricing.spec.ts<br>e2e-admin-ui.spec.ts<br>e2e-production-readiness.spec.ts |
| `/api/admin/pricing/products/[id]` | POST | audit_logs, products | *Orphan Route?* |
| `/api/admin/product-groups` | GET, POST, PATCH | product_groups, products | CategoryGroupSelector.tsx |
| `/api/admin/products` | GET, POST, DELETE, PATCH | addons, products | CatalogManagerClient.tsx<br>page.tsx<br>BulkImportExport.tsx |
| `/api/admin/products/export` | GET | products | BulkImportExport.tsx |
| `/api/admin/products/export-template` | GET | - | BulkImportExport.tsx |
| `/api/admin/products/import` | POST | products | BulkImportExport.tsx |
| `/api/admin/quotes/custom` | POST | leads | QuotationBuilderClient.tsx<br>e2e-quote-security.spec.ts |
| `/api/admin/recommendation-rules` | GET, POST | recommendation_rules | RulesClient.tsx |
| `/api/admin/recommendation-rules/[id]` | PUT, DELETE | recommendation_rules | *Orphan Route?* |
| `/api/admin/salespersons` | GET, POST | salespeople | SalespersonsClient.tsx |
| `/api/admin/salespersons/[id]` | PUT, DELETE | salespeople | *Orphan Route?* |
| `/api/admin/search` | GET | franchise_dealers, leads | OmniSearch.tsx |
| `/api/admin/settings` | GET, PATCH | settings | MatricesClient.tsx<br>ManualQuoteBuilderClient.tsx |
| `/api/admin/warranty-matrix` | GET | products | *Orphan Route?* |
| `/api/ai/night-school` | POST | ai_brain | *Orphan Route?* |
| `/api/analytics/executive/live` | GET | jobs, amc_contracts, inventory, service_tickets | page.tsx |
| `/api/analytics/finance` | GET | invoices, receipts | page.tsx |
| `/api/analytics/funnel` | GET | quote_sessions | page.tsx<br>analytics.spec.ts<br>phase-3b2.spec.ts |
| `/api/analytics/inventory` | GET | serial_assets, stock_ledger, inventory | page.tsx |
| `/api/analytics/overview` | GET | quotes | *Orphan Route?* |
| `/api/analytics/products` | GET | quotes | page.tsx<br>analytics.spec.ts |
| `/api/analytics/profitability` | GET | deals | page.tsx |
| `/api/analytics/rejections` | GET | analytics_rejections | page.tsx<br>analytics.spec.ts<br>phase-3b2.spec.ts |
| `/api/analytics/sales` | GET | quotes, deals, leads | page.tsx |
| `/api/analytics/service` | GET | jobs, amc_contracts, service_tickets | page.tsx |
| `/api/analytics/track` | POST | quote_events, quote_sessions | BuilderClient.tsx<br>WizardClientV2.tsx<br>analytics.spec.ts<br>phase-3b2.spec.ts |
| `/api/auth/otp/email` | POST | admins | LoginForm.tsx |
| `/api/auth/otp/mobile` | POST | admins, salespeople | LoginForm.tsx<br>e2e-customer-auth-isolation.spec.ts |
| `/api/auth/otp/verify` | POST | salespeople | LoginForm.tsx<br>e2e-customer-auth-isolation.spec.ts |
| `/api/auth/session` | POST, DELETE | - | LoginForm.tsx<br>page.tsx<br>page.tsx<br>Sidebar.tsx<br>ChatInterface.tsx<br>Sidebar.tsx |
| `/api/bookings` | POST | leads | ConfiguratorView.tsx |
| `/api/build/calculate` | POST | analytics_rejections, products | BuilderClient.tsx<br>e2e-builder-flow.spec.ts<br>phase-3b2.spec.ts<br>release-gates.spec.ts |
| `/api/build/products` | GET | products | BuilderClient.tsx<br>phase-3b2.spec.ts<br>release-gates.spec.ts |
| `/api/catalog` | GET | addons, products | CatalogManager.tsx<br>ProBuilderClient.tsx |
| `/api/catalog/pricing-rules` | GET, PATCH | settings, products | page.tsx |
| `/api/catalog/products/[productId]` | PATCH | products | *Orphan Route?* |
| `/api/chat` | POST | - | ChatInterface.tsx<br>ai-chat.spec.ts |
| `/api/chat/feedback` | POST | - | ChatInterface.tsx<br>ai-chat.spec.ts |
| `/api/crm/deals` | POST | quotes, customers, deals | page.tsx<br>e2e-sales-crm.spec.ts<br>master-e2e.spec.ts<br>phase-7-operations.spec.ts |
| `/api/crm/leads/[id]` | GET | quotes, invoices, jobs, followup_tasks, leads | *Orphan Route?* |
| `/api/crm/quotes` | GET | quotes | page.tsx<br>page.tsx<br>page.tsx<br>FollowUpManager.tsx<br>LeadIntelligencePanel.tsx<br>phase-4-sales.spec.ts |
| `/api/crm/quotes/[quoteId]` | GET, PATCH | quotes | *Orphan Route?* |
| `/api/crm/quotes/[quoteId]/followup` | POST | quotes | *Orphan Route?* |
| `/api/crm/tasks` | GET | followup_tasks, leads | page.tsx<br>page.tsx<br>e2e-sales-crm-api.spec.ts |
| `/api/crm/tasks/generate` | POST | followup_tasks, audit_logs | e2e-crm-followup.spec.ts |
| `/api/crm/tasks/[id]/action` | POST | followup_tasks, audit_logs | *Orphan Route?* |
| `/api/cron/followups` | POST | followup_tasks, audit_logs | e2e-crm-followup.spec.ts |
| `/api/cron/profitability-snapshot` | POST | deals | *Orphan Route?* |
| `/api/cron/sla-escalation` | GET | - | *Orphan Route?* |
| `/api/customer/leads` | GET | leads | e2e-customer-auth-isolation.spec.ts |
| `/api/customer/[customerId]/assets` | GET | serial_assets | *Orphan Route?* |
| `/api/customer/[customerId]/dashboard` | GET | serial_assets, customers, rma_tickets, service_tickets | *Orphan Route?* |
| `/api/finance/invoices` | GET, POST | invoices, deals, service_tickets | page.tsx<br>e2e-revenue-lifecycle.spec.ts<br>phase-10-service-dashboard.spec.ts<br>phase-9-finance.spec.ts |
| `/api/finance/receipts` | POST | invoices, receipts, deals | e2e-revenue-lifecycle.spec.ts<br>phase-9-finance.spec.ts |
| `/api/impressions` | POST | demand_impressions | PincodeWidget.tsx<br>e2e-expansion-hub.spec.ts |
| `/api/installer/auth/otp/email` | POST | - | InstallerLoginClient.tsx |
| `/api/installer/auth/otp/mobile` | POST | - | InstallerLoginClient.tsx |
| `/api/installer/auth/otp/verify` | POST | - | InstallerLoginClient.tsx |
| `/api/installer/auth/session` | POST, DELETE | - | InstallerLoginClient.tsx<br>InstallerSidebar.tsx |
| `/api/installer/me` | GET, PATCH | - | InstallerProfileClient.tsx |
| `/api/installers/apply` | POST | installer_applications | page.tsx |
| `/api/interest-leads` | POST | interest_leads | PhoneCaptureModal.tsx |
| `/api/inventory` | GET | catalog, inventory | page.tsx<br>page.tsx<br>phase-10-serial.spec.ts<br>phase-8-inventory.spec.ts |
| `/api/inventory/exceptions` | GET | inventory_exceptions | page.tsx |
| `/api/inventory/ledger` | GET | stock_ledger | page.tsx<br>phase-8-inventory.spec.ts |
| `/api/inventory/purchase` | GET, POST | purchase_orders | page.tsx<br>master-e2e.spec.ts<br>phase-10-serial.spec.ts<br>phase-8-inventory.spec.ts |
| `/api/inventory/purchase/[poId]/receive` | POST | serial_assets, stock_ledger, purchase_orders, inventory | *Orphan Route?* |
| `/api/inventory/reconcile` | GET | stock_ledger, inventory | master-e2e.spec.ts |
| `/api/inventory/serials` | GET | serial_assets, jobs | *Orphan Route?* |
| `/api/invoice/change-order` | POST | jobs, change_orders, invoices, audit_logs | e2e-financial-contracts.spec.ts |
| `/api/invoice/generate` | POST | quotes, invoices | e2e-financial-contracts.spec.ts |
| `/api/invoice/[quoteId]/download` | GET | quotes | *Orphan Route?* |
| `/api/invoice/[quoteId]/status` | GET | quotes | *Orphan Route?* |
| `/api/leads/industrial` | POST | industrial_leads | e2e-b2b-industrial.spec.ts |
| `/api/leads/[id]` | PATCH | salespersons, leads | *Orphan Route?* |
| `/api/leads/[id]/price-match` | GET, POST | leads | *Orphan Route?* |
| `/api/leads/[id]/price-match/[requestId]` | PATCH | leads | *Orphan Route?* |
| `/api/onboarding/partner` | POST | promoters | PartnerOnboardingClient.tsx |
| `/api/operations/jobs` | GET | jobs | page.tsx<br>page.tsx<br>page.tsx<br>page.tsx<br>e2e-amc-lifecycle.spec.ts<br>e2e-operations-api.spec.ts<br>e2e-operations-ui.spec.ts<br>e2e-production-readiness.spec.ts<br>e2e-revenue-lifecycle.spec.ts<br>phase-10-serial.spec.ts<br>phase-10-service.spec.ts<br>phase-7-operations-restored.spec.ts<br>phase-7-operations.spec.ts<br>unit-inventory-boundary.spec.ts |
| `/api/operations/jobs/[jobId]` | GET | jobs, quotes, change_orders | *Orphan Route?* |
| `/api/operations/jobs/[jobId]/transition` | POST | jobs, audit_logs | *Orphan Route?* |
| `/api/operations/jobs/[jobId]/warranty` | POST | jobs, warranty_certificates, serial_assets | *Orphan Route?* |
| `/api/operations/rma` | POST | serial_assets, inventory, stock_ledger, rma_tickets | phase-10-serial.spec.ts |
| `/api/operations/tickets` | GET, POST | service_tickets | e2e-amc-lifecycle.spec.ts<br>phase-10-service.spec.ts |
| `/api/operations/tickets/[ticketId]` | GET, PATCH | jobs, service_tickets | *Orphan Route?* |
| `/api/partner/auth/otp/email` | POST | - | PartnerLoginClient.tsx |
| `/api/partner/auth/otp/mobile` | POST | - | PartnerLoginClient.tsx |
| `/api/partner/auth/otp/verify` | POST | - | PartnerLoginClient.tsx |
| `/api/partner/auth/session` | POST, DELETE | - | page.tsx<br>PartnerLoginClient.tsx<br>PartnerSidebar.tsx |
| `/api/partner/commissions` | GET | - | *Orphan Route?* |
| `/api/partner/leads` | GET | - | *Orphan Route?* |
| `/api/partner/me` | GET, PATCH | - | PartnerProfileClient.tsx |
| `/api/payment/razorpay` | POST | quotes | QuoteReviewClient.tsx<br>e2e-commercial-hardening.spec.ts |
| `/api/pincode/[pin]` | GET | service_areas, city_impressions | *Orphan Route?* |
| `/api/products` | GET | - | ManualQuoteBuilderClient.tsx |
| `/api/quote/generate` | POST | settings | WizardClientV2.tsx<br>e2e-b2b-industrial.spec.ts<br>e2e-commercial-hardening.spec.ts<br>e2e-quote-flow.spec.ts<br>e2e-quote-security.spec.ts<br>phase-3b2.spec.ts<br>release-gates.spec.ts |
| `/api/quote/save` | POST | settings, addons, products, quotes, leads | BuilderClient.tsx<br>ProBuilderClient.tsx<br>WizardClientV2.tsx<br>e2e-commercial-hardening.spec.ts<br>e2e-pricing-lifecycle.spec.ts<br>e2e-quote-flow.spec.ts<br>e2e-sales-crm.spec.ts<br>phase-3b2.spec.ts<br>release-gates.spec.ts |
| `/api/quote/[quoteId]/download` | GET | quotes | *Orphan Route?* |
| `/api/quote/[quoteId]/pdf` | GET | quotes | *Orphan Route?* |
| `/api/quote/[quoteId]/whatsapp` | POST | quoteDeliveries, quotes | *Orphan Route?* |
| `/api/quotes` | POST | geo_pricing_rules, settings, addons, products, leads | ConfiguratorView.tsx |
| `/api/quotes/manual` | POST | quotes, customers, leads | ManualQuoteBuilderClient.tsx<br>phase-4-sales.spec.ts |
| `/api/send-otp` | POST | - | PhoneCaptureModal.tsx<br>e2e-partner-auth.spec.ts<br>e2e-rate-limiting.spec.ts |
| `/api/settings` | GET | - | *Orphan Route?* |
| `/api/submissions` | POST | leads, service_areas, installers, salespersons | ManualQuoteBuilderClient.tsx<br>e2e-sales-crm.spec.ts |
| `/api/submissions/industrial` | POST | industrial_leads | LeadGate.tsx |
| `/api/submissions/[id]` | PATCH | salespersons, leads | *Orphan Route?* |
| `/api/submissions/[id]/price-match` | GET, POST | leads | *Orphan Route?* |
| `/api/submissions/[id]/price-match/[requestId]` | PATCH | leads | *Orphan Route?* |
| `/api/test-login` | POST | - | page.tsx |
| `/api/v1/leads/[leadId]/quotes/[quoteId]/pdf` | GET | leads | *Orphan Route?* |
| `/api/v1/leads/[leadId]/waitlist-confirm` | POST | leads | *Orphan Route?* |
| `/api/verify-otp` | POST | - | e2e-partner-auth.spec.ts |
| `/api/webhooks/payment` | POST | change_orders, audit_logs, invoices, jobs, payment_transactions | e2e-financial-contracts.spec.ts<br>e2e-production-readiness.spec.ts |
| `/api/webhooks/razorpay` | POST | jobs, quotes, invoices, leads | e2e-commercial-hardening.spec.ts |
| `/api/wizard` | GET | - | *Orphan Route?* |
