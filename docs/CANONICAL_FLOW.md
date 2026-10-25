# Canonical Flow & System Wiring

## The Master Commercial & Operational Pipeline
The backbone of the TEAM CCTV Platform is an end-to-end state machine ensuring commercial integrity, mathematical parity, territory-accurate dispatch, and transparent multi-channel payouts.

```mermaid
flowchart TD
    A["Customer Lands on Site"] --> B["Pincode & Service Area Gate"]
    B --> C1["Guided Setup (5-Step Wizard)"]
    B --> C2["Custom Build (Pro Builder)"]
    C2 --> C2_OTP["Step 1: WhatsApp OTP Lead Capture"]
    C2_OTP --> C2_BUILD["Pro Builder Component Customizer"]
    C1 --> C1_WIFI{"Wireless or Wi-Fi Cameras Selected?"}
    C2_BUILD --> C1_WIFI
    C1_WIFI -- Yes --> W1{"Wi-Fi Broadband Available on Site?"}
    W1 -- No --> W2["Auto-Inject 4G/5G SIM Wi-Fi Router"]
    W1 -- Yes --> D["Dynamic Packages Generated"]
    W2 --> D
    C1_WIFI -- No --> D
    D --> E["Server Pricing Engine Re-Calculation (/api/quote/save)"]
    E --> F["Quotation Review Screen"]
    F --> G["Match My Brand Dynamic Brand Unification"]
    F --> H{"Checkout Pathway Selection"}
    H --> H1["1. Pay Full (2% Instant Discount)"]
    H --> H2["2. 3-Step Milestone (₹500 Booking Token)"]
    H --> H3["3. EMI Financing Option"]
    H --> H4["4. Free Site Survey Booking (Calendar)"]
    H1 --> I["Razorpay / Cashfree Gateway"]
    H2 --> I
    I --> J["Webhook + Fallback Verification API"]
    J --> K["Quote Status: BOOKED / PAID"]
    K --> L["Mappls Sub-Post Office Delivery Hub Lead Dispatch"]
    L --> M["Installer Site Visit & Job Card Execution"]
    M --> N{"Site Survey Adjustments Needed?"}
    N -- Yes --> O["Generate New Quotation Version (v2/v3)"]
    N -- No --> P["Job Completed & Handover Proof Uploaded"]
    O --> P
    P --> Q["Financial Dashboard: Payouts for Installer & Referrers"]
```

---

### 1. Location Gate & Address Capture (Mappls Engine)
- **UI Trigger:** `ServiceAreaModal` / Homepage PINCODE input.
- **Provider:** Mappls (MapmyIndia) resolves Indian postal codes, district boundaries, and tehsils (with Google Maps / OSM fallback).
- **Map Pin-Drop:** Allows customer to pin-point exact installation location, auto-populating address fields.

### 2. Dual Funnel Requirement Capture & Early Lead Gate
- **Guided Setup (`/wizard`):** 5-step wizard capturing property type, indoor/outdoor camera counts, storage needs, and cabling status.
- **Custom Build (`/builder` - Pro Builder):**
  - **Early Lead Capture:** Customer Name and Mobile Number (WhatsApp OTP verified) are captured **at Step 1** before entering hardware selection, preventing lead leakage on technical configurations.
  - **Mobile Slide-Over Cart:** Responsive drawer (`showMobileCart`) enables complete BOM review on smartphones.
  - **Single-Option Filter Auto-Collapse:** Hides empty or single-option filters to eliminate visual clutter.

### 2.1 Wi-Fi Connectivity Check & Standalone Router Injection (Option B)
- **Wi-Fi Readiness Check:** When choosing Wireless technology or adding supplemental Wi-Fi cameras in a wired setup, the wizard asks: *"Do you have a working Wi-Fi connection at the installation site?"*
- **Automatic 4G/5G Router Injection:** If **No**, the engine injects a 4G/5G SIM Wi-Fi router into the quotation BOM. If **Yes**, no router is added.
- **MicroSD Card Multiplication & Safety Caps:** Pure wireless quotes allocate 1 MicroSD card per camera (`qty = camera_count`). Hybrid quotes allocate 1 MicroSD card per Wi-Fi camera. Sized via H.265 baseline bitrates (0.40 smart motion multiplier) and capped strictly by `camera.max_sd_capacity_gb || 128`.

### 3. Server-Side Pricing Engine Execution (`/api/quote/save`)
- **Zero-Trust Client Pricing:** Client calculations are strictly discarded. All line items, margins, taxes, and labor rates are recomputed server-side in `lib/pricing-engine.ts`.
- **100% Mathematical Parity:** Guided Setup and Pro Builder configurations yield identical totals for identical Bills of Materials.
- **Component Rules:**
  - Recorder (DVR/NVR) Resolution Sizing & Cost Optimization: $\text{recMaxMP} \ge \max(\text{Camera MP})$. If a 5MP recorder is cheaper than a 2MP recorder, the system picks the cheaper 5MP recorder. 2MP recorders are strictly disqualified for 4MP, 5MP, and 8MP cameras. Mixed setups size to the highest resolution camera.
  - Competitive SMPS Selection: Lower price takes precedence even with higher channels.
  - Multi-PoE Gigabit Uplink Switch: Automatically attached when camera count exceeds single switch capacity.
  - Cable Bundling: Bundles (305m/100m) + per-meter balance evaluated against pure per-meter rates.
  - Connectors (`camera_count * 2` + 2 RJ45 for IP uplink) & Junction Boxes (`1:1`).
  - Labor: Zero margin markup. Full install (₹500 IP / ₹400 HD + 15m free cable pulling; excess ₹15/m); Fitting-only (₹200 HD / ₹300 IP + ₹500 visit charge); Wireless Pro Fitting (₹349/camera vs ₹0 DIY delivery).

### 4. Quote Review & "Match My Brand" Upsell
- **UI Element:** `InstantQuotationReview` (`/quote/[leadId]/review/[quoteId]`).
- **Brand Unification:** Defaults to "Mixed (Best Price)". Customer can click **"Match My Brand"** to dynamically unify all components under a single brand (e.g. CP Plus, Hikvision) if active stock exists.
- **Quotation Disclaimer:** Displays standard notice: *"Final quotation may differ based on actual site survey and requirements at installation time."*

### 5. Four Checkout Pathways & Payment Resilience
1. **Option 1: Pay Full Upfront (Smart Pay):**
   - Applies an instant 2% discount on the total quote.
   - Generates an official **TAX INVOICE** (not Advance Receipt) with **PAID** watermark, `amountDue: 0`, and an itemized line: `Smart Pay Discount (2%): -₹...`.
   - Sets lead/quote status directly to `PAID` / `ORDER CONFIRMED (FULLY PAID)`.
2. **Option 2: 3-Step Milestone Booking:** Charges a ₹500 advance token to lock installation slot (generates Advance Receipt; 90% balance due on material delivery, 10% on installation completion).
3. **Option 3: EMI Financing:** Low-cost EMI financing plans prominently featured.
4. **Option 4: Free Site Survey Booking:** Embedded calendar date/time picker (restricted to future dates) for on-site consultation.
- **Payment Verification:** Razorpay/Cashfree webhook + client-side **Fallback Verification API** attached to payment success screen guarantees immediate status transition to `BOOKED` / `PAID`.

---

### 5.1 Material Delivery Handover & 90% Collection (`/delivery/[quoteId]`)
- **Zero Due for Smart Pay:** If the customer paid in full upfront with Smart Pay discount, the delivery screen automatically detects `amountDue = 0` and displays a `✓ Smart Pay (Fully Paid)` badge. The delivery agent only collects the 4-digit customer delivery OTP.
- **On-Screen Dynamic UPI QR:** For milestone quotes with balance due, the delivery agent renders an instant dynamic Razorpay/UPI QR directly on their mobile screen (`DynamicOnScreenQRCodeModal`). The customer scans with Google Pay, PhonePe, or Paytm; payment confirms in 2-3 seconds with an audio chime, and the receipt is auto-dispatched to WhatsApp.
- **Strict Admin-Gated Cash Collection:** The physical cash collection checkbox is strictly disabled and locked unless an Admin has approved cash collection for that job (`cash_collection_approved: true`). Delivery agents can submit a 1-click cash approval request to the Admin desk.

---

### 6. Geolocation Dispatch & Sub-Post Office Delivery Micro-Hub Routing
- **Territory Matching:** Matches customer address tokens against authentic Sub-Post Office Delivery Micro-Hubs (with local communicating names), operating radius, and cadastral polygon boundaries.
- **Visual Status:** Displays active technician coverage with green pill shortcodes (`[✓ NR]`, `[✓ LC]`) and 850m halos, unassigned areas in red dashed halos.
- **Installer Assignment:** Automatically dispatches lead to authorized local installer.

### 7. Installer Job Execution, On-Site Change Orders & Field Handover
- **Job Card (`/installer/jobs/[id]`):** Details equipment BOM, site condition checklist, and required handover photos.
- **Site Prep Surcharges:** Installer can apply verified flags: ladder (₹500), marble (₹400), metal (₹200), furnished (₹300), heavy drilling (₹600) with ₹0 markup.
- **On-Site Extra Materials & Change Orders (GST Section 15 & 34 Invariant):**
  - If additional materials (Cat6 cabling, conduit, junction boxes, wall brackets) or labor are required on-site, the installer uses `+ Add Site Extra / Change Order` (`InstallerChangeOrderModal`).
  - The finalized base Tax Invoice is preserved intact to maintain GST compliance.
  - The system creates a **Supplementary Change Order (`CO-xxxx`)** and issues an official **Supplementary Tax Invoice (`INV-xxxx-S1`)** with deterministic 18% GST.
- **On-Screen Dynamic UPI QR Collection:**
  - The installer renders an on-screen dynamic UPI QR code on their smartphone screen (`DynamicOnScreenQRCodeModal`).
  - Customer scans using GPay, PhonePe, or Paytm; verifies in 2-3s with audio confirmation; Tax Invoice receipt auto-delivered to WhatsApp.
- **Admin-Gated Cash Collection:**
  - "Pay Cash to Installer" is strictly disabled unless an Admin or admin staff approves cash collection for that job (`cash_collection_approved: true`).
  - Installers can send a 1-click cash approval request to the Admin desk (`/api/installer/cash-approval/request`).
- **Quotation Versioning:** Pre-installation survey adjustments spawn new quotation versions (`v2`, `v3`), preserving historical customer approval records.

### 8. Financial Dashboard & Payout Governance
- **Trigger:** Job marked `COMPLETED` with zero open punch-list items.
- **Payouts:** Admin approves payouts for:
  - Installers: Based on job completion and verified labor.
  - B2B Partners: 2% commission based on partner QR/referral code.
  - B2C Individual Referrers: ₹500 flat incentive per completed referral.
