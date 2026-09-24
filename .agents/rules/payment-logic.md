---
name: payment-sequence-logic
description: Explicitly defines the business logic for the 3-stage payment sequence (Advance, Delivery, Final Installation).
trigger: always_on
---

# Business Logic: The 3-Stage Payment Sequence

Never confuse the payment stages for this project. The correct sequence of payments for CCTV installations is strictly defined as follows:

1. **Stage 1: Advance Booking Fee (₹500)**
   - **Context:** The initial upfront payment made by the customer to confirm the booking.
   - **Code mapping:** `payment_type === "booking"`, `stage === "booking"`
   - **Amount:** Flat ₹500 (Not 10%).

2. **Stage 2: Delivery Payment (90%)**
   - **Context:** Paid when the equipment is dispatched/delivered to the customer's site.
   - **Code mapping:** `payment_type === "delivery_90"`, `stage === "delivery_90"`
   - **Amount:** 90% of the remaining balance (i.e., `(Total - 500) * 0.90`).

3. **Stage 3: Final Installation Payment (10%)**
   - **Context:** The LAST pending amount. Paid *only after* the installation is completed on-site.
   - **Code mapping:** `payment_type === "installation_final"`, `stage === "installation_final"`
   - **Amount:** The final 10% of the remaining balance.

### IMPORTANT
*   **Do NOT refer to the Advance payment as "10%".** The Advance is ₹500.
*   **10% is ALWAYS the Final Post-Installation Payment.**
