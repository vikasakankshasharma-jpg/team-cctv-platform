# Role Journeys & Personas

The platform serves distinct personas with strict route boundaries, tailored capabilities, and role-isolated security.

---

## 1. The Customer (`/` & `/portal`)
- **Profile:** Homeowner, commercial shopkeeper, or enterprise buyer needing security cameras.
- **Entry Points:** Landing page (`/`), geo-pages (`/[city]`), or Service Area Pincode Gate.
- **Core Journey:**
  1. **Location & Funnel Choice:** Enters Pincode/Location via Mappls location gate. Selects **Guided Setup** (5-step wizard) or **Custom Build** (Pro Builder).
  2. **Early Lead Gate (Custom Build):** Verifies Name and Mobile Number via WhatsApp OTP before entering hardware customizer to prevent drop-off.
  3. **Quotation Review & Brand Unification:** Evaluates generated Bill of Materials; uses **"Match My Brand"** to dynamically unify components under CP Plus or Hikvision if desired.
  4. **Four Checkout Choices:**
     - *Option 1: Pay Full Upfront (Smart Pay):* 2% instant discount applied; generates an official **TAX INVOICE** (not Advance Receipt) with **PAID** watermark, `amountDue: 0`, and discount itemization.
     - *Option 2: 3-Step Milestone Booking:* ₹500 advance booking token (generates Advance Receipt; 90% balance on material delivery, 10% on installation completion).
     - *Option 3: EMI financing:* Low-cost EMI financing plans prominently featured.
     - *Option 4: Free Site Visit Booking:* Date/time slot picker for future dates.
  5. **Payment Confirmation:** Supported by server-side Fallback Verification API to guarantee immediate status update even if webhooks face delays.
  6. **Customer Portal (`/portal`):** Reviews past quotations, active installation tracking, warranty documents, and PDF downloads.
  7. **Field Handover Interaction:** Scans the dynamic UPI QR displayed directly on technician's smartphone screen using Google Pay, Paytm, or PhonePe; payment confirms in 2-3s with instant WhatsApp receipt.

---

## 2. The Delivery Field Agent (`/delivery/[quoteId]`)
- **Profile:** Micro-hub runner or internal delivery agent dropping off equipment at the customer premises.
- **Entry Point:** `/delivery/[quoteId]`
- **Core Journey:**
  1. **Smart Pay Detection:** If the customer paid full upfront with Smart Pay discount, the screen flags `✓ Smart Pay (Fully Paid)` with `Amount Due: ₹0`. The agent only enters the customer delivery OTP.
  2. **On-Screen Dynamic UPI QR:** If balance is due (90% milestone), the agent clicks **"Show On-Screen UPI QR"** to render a live dynamic QR (`DynamicOnScreenQRCodeModal`). The customer scans the phone screen; payment is verified within 2-3 seconds with audio chime.
  3. **Admin-Gated Cash Collection:** Cash collection is strictly locked unless Admin explicitly approves cash for that job (`cash_collection_approved: true`). Delivery agents can submit a 1-click cash approval request to the Admin desk.
  4. **OTP Verification:** Once paid, the agent enters the 4-digit WhatsApp OTP from the customer to mark materials delivered and trigger the installer start OTP.

---

## 3. The Installer / Field Technician (`/installer`)
- **Profile:** Certified local technician contracted to execute on-site installation, cabling, and handover.
- **Entry Point:** `/installer/dashboard`
- **Core Journey:**
  1. **Territory Dispatch:** Receives assigned job leads routed via Sub-Post Office Delivery Micro-Hub matching.
  2. **Job Card Execution (`/installer/jobs/[id]`):** Reviews equipment BOM, required camera positions, and site preparation conditions.
  3. **Site Survey Adjustments & Quotation Versioning:**
     - Inspects physical site conditions.
     - Toggles verified **Site Preparation Flags**: ladder (₹500), marble (₹400), metal (₹200), furnished (₹300), heavy drilling (₹600) with strictly zero margin markup.
     - Confirms cabling status: Full installation (includes 15m free pulling; excess ₹15/m) vs. Fitting-only (₹200 HD / ₹300 IP + ₹500 visit; <=2 cameras flat ₹500).
     - Any pre-installation survey adjustment automatically creates a **new Quotation Version** (`v2`, `v3`).
  4. **On-Site Extra Materials & Change Orders (GST Section 15 & 34 Invariant):**
     - When extra materials (cabling, conduit, junction boxes, brackets) or custom labor are discovered on site, the installer clicks **"+ Add Site Extra / Change Order"** (`InstallerChangeOrderModal`).
     - Preserves the original settled Tax Invoice (`INV-xxxx`).
     - Issues a **Supplementary Change Order (`CO-xxxx`)** and an official **Supplementary Tax Invoice (`INV-xxxx-S1`)** with deterministic 18% GST.
  5. **On-Screen Dynamic UPI QR Collection:**
     - Installer displays the live Razorpay/UPI QR directly on their phone screen.
     - Customer scans with GPay/Paytm/PhonePe; payment confirms in 2-3s with celebratory chime; receipt sent to customer WhatsApp.
  6. **Admin-Gated Physical Cash Rule:**
     - "Pay Cash to Installer" is locked by default. It is ONLY visible/active if Admin or staff approves cash collection (`cash_collection_approved: true`).
     - Installers can request cash authority in 1-click (`/api/installer/cash-approval/request`).
  7. **Handover & Verification:** Uploads before/after photos, scans hardware serial numbers, and inputs the customer 4-digit completion PIN.
  8. **Ledger & Payouts (`/installer/ledger`):** Tracks completed sites awaiting admin payout release.

---

## 4. The Salesperson / Tele-Consultant (`/staff`)
- **Profile:** In-house sales representative handling inbound leads, quote adjustments, and phone inquiries.
- **Entry Point:** `/staff/dashboard`
- **Core Journey:**
  1. **Lead Queue:** Filters unbooked leads, dropped carts, and consultation requests.
  2. **Assisted Quote Builder:** Adjusts customer requirements or applies authorized discretionary commercial discounts.
  3. **Quotation Sharing:** Sends direct quote links via WhatsApp or email.
  4. **Site Visit Scheduling:** Coordinates site survey appointments for undecided leads.
  5. **Performance Tracking:** Monitors monthly won/lost ratios and commission ledger (`/staff/commissions`).

---

## 5. B2B Business Partners / Trade Affiliates (`/partner`)
- **Profile:** Electricians, shopkeepers, architects, interior designers, and IT consultants.
- **Onboarding:** By Admin invitation or approved business registration.
- **Entry Point:** `/partner/dashboard`
- **Core Journey:**
  1. **Partner QR Code:** Downloads branded QR code and digital flyers linked to their unique partner referral code.
  2. **Storefront & Client Sharing:** Displays QR code in physical shops or attaches referral code to client project proposals.
  3. **Commercial Economics:** Partner earns a **2% commission** on the total quote value; the customer receives an instant **3% discount**.
  4. **Lead Pipeline:** Tracks referred client stages (Quotation → Booked → Installed → Paid).

---

## 6. B2C Individual Referral Partners ("Refer & Earn")
- **Profile:** Everyday consumers, existing satisfied customers, and social media referrers.
- **Onboarding:** Open self-signup via mobile number (WhatsApp OTP verified).
- **Core Journey:**
  1. **Instant Code Generation:** Receives unique personal referral code upon mobile verification.
  2. **Dynamic Festive & Occasion EDMs:** Downloads festive graphics (Diwali, Holi, New Year, National Days, Home Security alerts) pre-embedded with their referral code and discount badge.
  3. **Social Sharing:** Posts EDMs to WhatsApp Status, Facebook, Instagram, and local community groups.
  4. **Commercial Economics:** Referrer earns **₹500 flat incentive** per completed installation; the referee receives an instant **₹500 discount**.
  5. **Status Tracking:** Tracks referred friends and earned rewards.

---

## 7. The Operations & System Admin (`/admin`)
- **Profile:** Business owner and executive ops director managing platforms, catalogs, margins, and finances.
- **Entry Point:** `/admin`
- **Core Journey:**
  1. **Global Control & Analytics:** Monitors real-time revenue, active bookings, conversion rates, and geographic demand heatmaps.
  2. **Catalog & Margin Engine (`/admin/catalog-manager`, `/admin/settings`):** Configures dynamic category margins (`margin_hdd`, `margin_cctv_camera`, etc.), adds/duplicates products, and manages inventory status.
  3. **Cash Collection Authority (`/admin/leads`):** Reviews and approves/rejects field cash collection requests (`/api/admin/leads/[leadId]/approve-cash`) to safeguard field cash transactions.
  4. **Geographic Coverage & Delivery Micro-Hubs Management (`/admin/coverage`):**
     - Manages State → District → Tehsil → PINCODE hierarchy.
     - Maps official Sub-Post Offices (`S.O.`) and Branch Offices (`B.O.`) to local communicating names.
     - Inspects active coverage with 2-letter shortcode badges (`[✓ NR]`, `[✓ LC]`), 850m halos, and cadastral PIN polygons.
  5. **Dispatch Management (`/admin/dispatch`):** Oversees technician territory assignments and escalated job issues.
  6. **Financial Dashboard & Payout Approval (`/admin/finance`):**
     - Reviews and authorizes payouts for Installers, B2B Partners, and B2C Referrers based on verified site completion with zero open punch-list items.
     - Tracks maturity days and overdue payout alerts.

---

## 8. Security Isolation Principle
- **Strict Role Boundaries:** Each portal is guarded by server-side session checks (`verifySession`).
- **Zero Administrative Escalation on Public Portal:** If an Admin, Salesperson, or Installer logs into the public Customer Portal (`/portal`), the application treats them strictly as a standard customer with zero administrative access.
