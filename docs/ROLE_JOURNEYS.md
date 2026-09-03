# Role Journeys & Personas

The platform serves six distinct personas, each with dedicated route groups and tailored user journeys.

## 1. The Customer (`(customer)`)
- **Profile**: A homeowner or small business owner looking for a CCTV installation.
- **Entry**: Lands on marketing pages (`/`) or geo-pages (`/[city]`).
- **Core Journey**: 
  1. Enters requirements into the Self-Serve Quotation Wizard (`/wizard`).
  2. Receives a dynamic, instantly calculated Quote (`/quote/[leadId]`).
  3. Optionally customizes cameras (Pro-Builder).
  4. Approves the quote and pays a 30% advance via Razorpay to lock the installation slot.
  5. Tracks the installation progress post-payment (`/track/[id]`).

## 2. The Salesperson (`(salesperson)`)
- **Profile**: An internal team member managing inbound queries and following up on dropped carts.
- **Entry**: `/salesperson/dashboard`
- **Core Journey**:
  1. Reviews active leads and requirement snapshots.
  2. Uses the manual Quote Builder (`/salesperson/create-quote`) to tailor a quote.
  3. Adjusts margins or applies discretionary discounts.
  4. Sends the quote link to the customer via WhatsApp/Email.
  5. Tracks commissions (`/salesperson/commissions`).

## 3. The Operations / Admin (`(admin)`)
- **Profile**: Business owner or high-level ops manager overseeing the entire ecosystem.
- **Entry**: `/admin`
- **Core Journey**:
  1. Monitors global analytics and CRM.
  2. Manages the centralized product catalog and configures global margin policies (`/admin/catalog-manager`, `/admin/settings`).
  3. Oversees field operations, assigning jobs to installers (`/admin/dispatch`, `/admin/jobs`).
  4. Resolves edge cases and issues refunds.

## 4. The Installer (`(installer)`)
- **Profile**: Field technician contracted to do the physical installation.
- **Entry**: `/installer/dashboard`
- **Core Journey**:
  1. Views assigned job pipeline.
  2. Opens active job on-site (`/installer/jobs/[id]`).
  3. Uploads photo proof of installation completion.
  4. Generates customer sign-off OTP to finalize the job.
  5. Tracks payout ledger for completed installations (`/installer/ledger`).

## 5. The Partner / Promoter (`(partner)`)
- **Profile**: Affiliate marketer, real-estate agent, or electronics shop referring customers for a cut.
- **Entry**: `/partner/dashboard`
- **Core Journey**:
  1. Generates affiliate tracking links or manually logs a lead.
  2. Tracks the conversion status of referred leads.
  3. Views affiliate commissions and payouts.

## 6. Finance
- **Profile**: Auditor or bookkeeper tracking cash flow.
- **Entry**: Primarily utilizes the Admin dashboard (`/admin/finance`).
- **Core Journey**:
  1. Audits Razorpay webhook successes vs invoice generation.
  2. Tracks inventory purchase orders vs outward stock movement (`/admin/inventory/ledger`).
  3. Handles installer payouts and partner commission disbursements.
