/**
 * @file lib/commercial/invoice-reconciliation.ts
 * @description Phase 7.2 GST Tax Invoice Reconciliation & Immutability.
 * Enforces Reverse-GST Rule 2 invariant, atomic idempotency, and zero tax inflation.
 */

import { CommercialStateError } from "./state-machine";

export interface InvoiceReconciliationResult {
  taxableBase: number;
  gstAmount: number;
  grossTotal: number;
  drift: number;
  isValid: boolean;
}

/**
 * Gate 7.2.6 & 7.2.7: Reconciles Invoice GST values against the frozen quote snapshot.
 * Guarantees:
 * 1. Subtotal equals net_taxable_amount
 * 2. GST Amount equals gst_amount
 * 3. Total equals total_payable
 * 4. Taxable Base + GST === Gross Total (drift <= ₹0.10)
 * 5. Zero Double-Taxation: Tax is reverse-computed, not added on top of Gross.
 */
export function reconcileInvoiceWithQuote(quoteSnapshot: {
  total_payable?: number;
  net_taxable_amount?: number;
  gst_amount?: number;
  pricingSnapshot?: {
    total_payable?: number;
    net_taxable_amount?: number;
    gst_amount?: number;
  };
}): InvoiceReconciliationResult {
  const gross = Number(
    quoteSnapshot.pricingSnapshot?.total_payable ??
    quoteSnapshot.total_payable ??
    0
  );

  const taxable = Number(
    quoteSnapshot.pricingSnapshot?.net_taxable_amount ??
    quoteSnapshot.net_taxable_amount ??
    0
  );

  const gst = Number(
    quoteSnapshot.pricingSnapshot?.gst_amount ??
    quoteSnapshot.gst_amount ??
    0
  );

  if (gross <= 0 || taxable <= 0 || gst <= 0) {
    throw new CommercialStateError(
      "Quote snapshot has incomplete or non-positive financial values for invoicing",
      "INCOMPLETE_SNAPSHOT_FINANCIALS"
    );
  }

  // Reconciliation check
  const sum = Math.round((taxable + gst) * 100) / 100;
  const drift = Math.abs(gross - sum);

  if (drift > 0.10) {
    throw new CommercialStateError(
      `GST Invoice mathematical reconciliation failed! Taxable ₹${taxable} + GST ₹${gst} = ₹${sum}, but Gross is ₹${gross} (drift ₹${drift.toFixed(2)} exceeds ₹0.10)`,
      "GST_RECONCILIATION_DRIFT"
    );
  }

  // Zero Double-Taxation Check:
  // Taxable must be approximately gross / 1.18, NOT gross (which would mean adding 18% on top)
  const expectedTaxable = gross / 1.18;
  if (Math.abs(taxable - expectedTaxable) > 2.0) {
    throw new CommercialStateError(
      `Zero Double-Taxation violation: Taxable base ₹${taxable} diverges from reverse-taxable base ₹${expectedTaxable.toFixed(2)}`,
      "DOUBLE_TAXATION_DETECTED"
    );
  }

  return {
    taxableBase: taxable,
    gstAmount: gst,
    grossTotal: gross,
    drift,
    isValid: true,
  };
}
