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
     - *Option 1:* Pay Full Upfront (2% instant discount).
     - *Option 2:* 3-Step Milestone Booking (₹500 advance booking token).
     - *Option 3:* EMI financing selection.
     - *Option 4:* Free Site Visit Booking (date/time slot picker for future dates).
  5. **Payment Confirmation:** Supported by server-side Fallback Verification API to guarantee immediate status update even if webhooks face delays.
  6. **Customer Portal (`/portal`):** Reviews past quotations, active installation tracking, warranty documents, and PDF downloads.

---

## 2. The Installer / Field Technician (`/installer`)
- **Profile:** Certified local technician contracted to execute on-site installation and cabling.
- **Entry Point:** `/installer/dashboard`
- **Core Journey:**
  1. **Territory Dispatch:** Receives assigned job leads routed via Sub-Post Office Delivery Micro-Hub matching.
  2. **Job Card Execution (`/installer/jobs/[id]`):** Reviews equipment BOM, required camera positions, and site preparation conditions.
  3. **Site Survey Adjustments & Quotation Versioning:**
     - Inspects physical site conditions.
     - Toggles verified **Site Preparation Flags**: ladder (₹500), marble (₹400), metal (₹200), furnished (₹300), heavy drilling (₹600) with strictly zero margin markup.
     - Confirms cabling status: Full installation (includes 15m free pulling; excess ₹15/m) vs. Fitting-only (₹200 HD / ₹300 IP + ₹500 visit; <=2 cameras flat ₹500).
     - Any post-survey adjustment automatically creates a **new Quotation Version** (`v2`, `v3`) tied to the customer lead.
  4. **Handover & Verification:** Uploads photo evidence of mounted cameras, DVR/NVR setup, and cabling routes. Initiates customer OTP sign-off.
  5. **Ledger & Payouts (`/installer/ledger`):** Tracks completed sites awaiting admin payout release.

---

## 3. The Salesperson / Tele-Consultant (`/staff`)
- **Profile:** In-house sales representative handling inbound leads, quote adjustments, and phone inquiries.
- **Entry Point:** `/staff/dashboard`
- **Core Journey:**
  1. **Lead Queue:** Filters unbooked leads, dropped carts, and consultation requests.
  2. **Assisted Quote Builder:** Adjusts customer requirements or applies authorized discretionary commercial discounts.
  3. **Quotation Sharing:** Sends direct quote links via WhatsApp or email.
  4. **Site Visit Scheduling:** Coordinates site survey appointments for undecided leads.
  5. **Performance Tracking:** Monitors monthly won/lost ratios and commission ledger (`/staff/commissions`).

---

## 4. B2B Business Partners / Trade Affiliates (`/partner`)
- **Profile:** Electricians, shopkeepers, architects, interior designers, and IT consultants.
- **Onboarding:** By Admin invitation or approved business registration.
- **Entry Point:** `/partner/dashboard`
- **Core Journey:**
  1. **Partner QR Code:** Downloads branded QR code and digital flyers linked to their unique partner referral code.
  2. **Storefront & Client Sharing:** Displays QR code in physical shops or attaches referral code to client project proposals.
  3. **Commercial Economics:** Partner earns a **2% commission** on the total quote value; the customer receives an instant **3% discount**.
  4. **Lead Pipeline:** Tracks referred client stages (Quotation → Booked → Installed → Paid).

---

## 5. B2C Individual Referral Partners ("Refer & Earn")
- **Profile:** Everyday consumers, existing satisfied customers, and social media referrers.
- **Onboarding:** Open self-signup via mobile number (WhatsApp OTP verified).
- **Core Journey:**
  1. **Instant Code Generation:** Receives unique personal referral code upon mobile verification.
  2. **Dynamic Festive & Occasion EDMs:** Downloads festive graphics (Diwali, Holi, New Year, National Days, Home Security alerts) pre-embedded with their referral code and discount badge.
  3. **Social Sharing:** Posts EDMs to WhatsApp Status, Facebook, Instagram, and local community groups.
  4. **Commercial Economics:** Referrer earns **₹500 flat incentive** per completed installation; the referee receives an instant **₹500 discount**.
  5. **Status Tracking:** Tracks referred friends and earned rewards.

---

## 6. The Operations & System Admin (`/admin`)
- **Profile:** Business owner and executive ops director managing platforms, catalogs, margins, and finances.
- **Entry Point:** `/admin`
- **Core Journey:**
  1. **Global Control & Analytics:** Monitors real-time revenue, active bookings, conversion rates, and geographic demand heatmaps.
  2. **Catalog & Margin Engine (`/admin/catalog-manager`, `/admin/settings`):** Configures dynamic category margins (`margin_hdd`, `margin_cctv_camera`, etc.), adds/duplicates products, and manages inventory status.
  3. **Geographic Coverage & Delivery Micro-Hubs Management (`/admin/coverage`):**
     - Manages State → District → Tehsil → PINCODE hierarchy.
     - Maps official Sub-Post Offices (`S.O.`) and Branch Offices (`B.O.`) to local communicating names.
     - Inspects active coverage with 2-letter shortcode badges (`[✓ NR]`, `[✓ LC]`), 850m halos, and cadastral PIN polygons.
  4. **Dispatch Management (`/admin/dispatch`):** Oversees technician territory assignments and escalated job issues.
  5. **Financial Dashboard & Payout Approval (`/admin/finance`):**
     - Reviews and authorizes payouts for Installers, B2B Partners, and B2C Referrers based on verified site completion with zero open punch-list items.
     - Tracks maturity days and overdue payout alerts.

---

## 7. Security Isolation Principle
- **Strict Role Boundaries:** Each portal is guarded by server-side session checks (`verifySession`).
- **Zero Administrative Escalation on Public Portal:** If an Admin, Salesperson, or Installer logs into the public Customer Portal (`/portal`), the application treats them strictly as a standard customer with zero administrative access.
