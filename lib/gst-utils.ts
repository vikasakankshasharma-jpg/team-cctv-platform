/**
 * @file lib/gst-utils.ts
 * @description Canonical reverse-GST utility for TEAM CCTV Platform.
 * All catalog hardware, cabling, labor, and addon prices are 18% GST-inclusive.
 */

export interface ReverseGstResult {
  grossAmount: number;
  taxableAmount: number;
  gstAmount: number;
  gstRate: number;
}

/**
 * Rounds monetary values to 2 decimal places (paise precision).
 */
export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

/**
 * Normalizes GST rate whether provided as percentage (e.g. 18) or decimal (e.g. 0.18).
 */
export function normalizeGstPercent(rawRate?: number | null, fallbackPercent = 18): number {
  if (rawRate === undefined || rawRate === null || !Number.isFinite(rawRate) || rawRate < 0) {
    return fallbackPercent;
  }
  if (rawRate > 0 && rawRate < 1) {
    return Math.round(rawRate * 10000) / 100;
  }
  return rawRate;
}

/**
 * Computes reverse GST from a GST-inclusive customer gross amount.
 * Guarantees exact reconciliation: taxableAmount + gstAmount === grossAmount.
 */
export function reverseInclusiveGst(grossAmount: number, rawGstRate: number = 18): ReverseGstResult {
  const gstRate = normalizeGstPercent(rawGstRate, 18);
  const gross = Math.max(0, roundCurrency(grossAmount));
  if (gross <= 0 || gstRate <= 0) {
    return {
      grossAmount: gross,
      taxableAmount: gross,
      gstAmount: 0,
      gstRate,
    };
  }
  const taxable = roundCurrency(gross / (1 + gstRate / 100));
  const gst = roundCurrency(gross - taxable);
  return {
    grossAmount: gross,
    taxableAmount: taxable,
    gstAmount: gst,
    gstRate,
  };
}
