export interface TaxOracleResult {
  gross: number;
  taxable: number;
  gst: number;
  rate: number;
  reconciled: boolean;
  reconciliation_delta: number;
}

export const GST_RATE = 0.18;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateReverseInclusiveTax(gross: number, rate = GST_RATE): TaxOracleResult {
  if (!Number.isFinite(gross) || gross < 0) throw new Error("gross must be a finite non-negative number");
  if (!Number.isFinite(rate) || rate < 0) throw new Error("rate must be a finite non-negative number");
  const taxable = round2(gross / (1 + rate));
  const gst = round2(gross - taxable);
  const reconciliationDelta = round2(taxable + gst - gross);
  return { gross: round2(gross), taxable, gst, rate, reconciled: Math.abs(reconciliationDelta) === 0, reconciliation_delta: reconciliationDelta };
}

export function assertReverseInclusiveTaxInvariant(gross: number, rate = GST_RATE): TaxOracleResult {
  const result = calculateReverseInclusiveTax(gross, rate);
  if (!result.reconciled) throw new Error(`GST_RECONCILIATION_FAILED: delta=${result.reconciliation_delta}`);
  return result;
}
