/**
 * @file lib/commercial/commercial-contract.ts
 * @description Phase 7.2 Commercial Contracts & State Definitions.
 * Formulates the 5 immutable commercial contracts, payment milestones,
 * and state transitions decoupled from calculation engine.
 */

export type CommercialState =
  | "QUOTE_ISSUED"
  | "ORDER_CREATED"
  | "PAYMENT_PENDING"
  | "PAYMENT_CAPTURED"
  | "PAYMENT_FAILURE"
  | "INVOICE_ISSUED"
  | "INVENTORY_RESERVED"
  | "BACKORDERED"
  | "JOB_DISPATCHED"
  | "REFUNDED";

export type PaymentStage =
  | "booking"
  | "full"
  | "full_discount"
  | "delivery_90"
  | "installation_final";

export interface CommercialPaymentRecord {
  payment_id: string;
  order_id: string;
  amount: number; // in Rupees
  currency: "INR";
  stage: PaymentStage;
  method?: string;
  status: "captured" | "failed" | "refunded";
  captured_at: string;
  razorpay_fee?: number | null;
  razorpay_tax?: number | null;
}

export interface CommercialOrder {
  id: string;
  quote_id: string;
  lead_id?: string;
  stage: PaymentStage;
  amount_rupees: number;
  amount_paise: number;
  currency: "INR";
  status: "created" | "attempted" | "paid" | "expired";
  created_at: string;
  expires_at?: string;
}

export interface CommercialMilestones {
  grossTotal: number;
  bookingAmount: number; // Fixed ₹500
  remainder: number; // grossTotal - 500
  deliveryAmount: number; // 90% of remainder
  installationAmount: number; // 10% of remainder (remainder - deliveryAmount exact)
  fullDiscountGross: number; // grossTotal * 0.98
}

/**
 * Derives exact, closed-form milestone payment slabs from a frozen quote gross total.
 * Reconciles with exact mathematical precision:
 * bookingAmount + deliveryAmount + installationAmount === grossTotal
 */
export function calculateCommercialMilestones(grossTotal: number): CommercialMilestones {
  const gross = Math.round(grossTotal);
  const bookingAmount = Math.min(500, gross);
  const remainder = Math.max(0, gross - bookingAmount);
  const deliveryAmount = Math.round(remainder * 0.90);
  const installationAmount = remainder - deliveryAmount;
  const fullDiscountGross = Math.round(gross * 0.98);

  return Object.freeze({
    grossTotal: gross,
    bookingAmount,
    remainder,
    deliveryAmount,
    installationAmount,
    fullDiscountGross,
  });
}

/**
 * Server-derived expected payment amount in Rupees for a given stage,
 * taking into account previously captured payment history.
 * Never trusts client-specified amounts.
 */
export function deriveServerExpectedAmount(
  stage: PaymentStage,
  grossTotal: number,
  paymentHistory: readonly CommercialPaymentRecord[] = []
): { expectedRupees: number; expectedPaise: number } {
  const milestones = calculateCommercialMilestones(grossTotal);
  const successfulPayments = paymentHistory.filter((p) => p.status === "captured");
  const alreadyPaidRupees = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

  let expectedRupees = 0;

  switch (stage) {
    case "booking": {
      expectedRupees = milestones.bookingAmount;
      break;
    }
    case "full": {
      // 100% of gross total minus any already paid advance
      expectedRupees = Math.max(0, milestones.grossTotal - alreadyPaidRupees);
      break;
    }
    case "full_discount": {
      // Model A: 98% of gross total. If ₹500 booking was already paid, remainder = fullDiscountGross - 500
      expectedRupees = Math.max(0, milestones.fullDiscountGross - alreadyPaidRupees);
      break;
    }
    case "delivery_90": {
      expectedRupees = milestones.deliveryAmount;
      break;
    }
    case "installation_final": {
      expectedRupees = milestones.installationAmount;
      break;
    }
    default:
      throw new Error(`Unsupported payment stage: ${stage}`);
  }

  const expectedPaise = Math.round(expectedRupees * 100);
  return { expectedRupees, expectedPaise };
}
