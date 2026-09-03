# Canonical Flow & System Wiring

## The Primary B2C Commercial Engine
The backbone of the application is the customer checkout pipeline. It follows a strict sequence of state transitions to guarantee commercial integrity.

### 1. Lead Generation -> Requirement Capture
- **UI Element**: `WizardClientV2` (`/wizard`) or `ProBuilderClient` (`/pro-builder`).
- **Data Action**: Captures physical constraints (camera count, days of recording, property type).
- **Backend Flow**: Calls `generateQuote(requirement)`.
- **Engine**: Local state computation.

### 2. Pricing Engine Execution & Quote Save
- **Trigger**: Customer clicks "Save & See Quote".
- **API Target**: `/api/quote/save`
- **Security Constraint**: Validates input, ignores client-side pricing. Calls canonical `lib/pricing-engine.ts` on the server to re-calculate exact totals using live catalog margins.
- **Data Object**: Creates `Lead` and `Quote` document (State: `DRAFT`).
- **Outcome**: Returns `quoteId`. UI redirects to `/quote/[leadId]`.

### 3. Quote Review & Customization
- **UI Element**: `QuoteReviewClient` (`/quote/[leadId]/review/[quoteId]`).
- **Flow**: Displays server-calculated totals. If the user swaps a camera (Add-ons), a new immutable quote revision is created (`parentQuoteId_v2`).
- **State Constraint**: Quotes expire in 7 days.

### 4. Advance Payment (Razorpay)
- **API Target**: `/api/payment/razorpay` (Order Creation).
- **Webhook**: `/api/webhooks/razorpay`
- **Security Check**: Webhook verifies HMAC SHA-256 signature and asserts that the `razorpay_order_amount` exactly matches the Quote's `total_payable` (or 30% advance split).
- **State Transition**: Quote shifts to `APPROVED`. Payment object created (`ADVANCE_PAID`).

### 5. Job Creation & Fulfillment
- **Trigger**: Webhook success event internally flags for dispatch.
- **Admin Action**: Dispatch assigns an Installer (`/admin/dispatch`).
- **Installer Action**: Installer completes the work on-site, uploads proof (`/installer/jobs/[id]`).

### 6. Invoice Generation & Final Payment
- **Trigger**: Job marked `COMPLETED`.
- **API Target**: Invoice generation cron/job hook.
- **Customer Action**: Pays remaining 70% balance.
- **State Transition**: Invoice `ISSUED` -> `PAID`. Job `VERIFIED`.

## Strict Architectural Rules
1. **Never trust client prices**: The client UI is purely a presentation layer. `/api/quote/save` MUST pull live hardware costs from Firestore and pass them to the `PricingEngine`.
2. **Fail-Closed Webhooks**: The Razorpay webhook drops the request immediately if environment secrets are missing, signatures mismatch, or amounts deviate by more than 1 INR.
3. **Immutability**: Quotes are never overwritten. A change in configuration yields a new `v_n` quote tied to the same lead.
