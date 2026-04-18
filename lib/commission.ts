/**
 * @file lib/commission.ts
 * @description Core business logic for referral commission calculations.
 * 
 * RULES FROM SPEC:
 * 1. Commission is calculated ONLY on net_taxable_amount (ex-tax), NEVER on GST or gross total.
 * 2. Commission slabs match where net_taxable_amount >= slab.from AND (slab.to is null OR net_taxable_amount < slab.to).
 * 3. Slab valid shapes:
 *    - type="flat"    → commission = slab.value
 *    - type="percent" → commission = net_taxable_amount * (slab.value / 100)
 */

import type { CommissionSlab } from "@/types";

/**
 * Validates that an array of slabs has no gaps and no overlaps.
 * Called before saving slabs to a promoter or global rule.
 * 
 * @param slabs - Array of commission slabs
 * @returns null if valid, or a string describing the error
 */
export function validateSlabs(slabs: CommissionSlab[]): string | null {
  if (slabs.length === 0) return "At least one slab is required.";

  // Sort slabs by "from" ascending
  const sorted = [...slabs].sort((a, b) => a.from - b.from);

  if (sorted[0].from !== 0) {
    return "The first slab must start from 0.";
  }

  for (let i = 0; i < sorted.length; i++) {
    const slab = sorted[i];
    const isLast = i === sorted.length - 1;

    if (isLast) {
      if (slab.to !== null) {
        return "The last slab must have no upper limit (to = null).";
      }
    } else {
      if (slab.to === null) {
        return "Only the last slab can have no upper limit.";
      }
      
      const nextSlab = sorted[i + 1];
      if (slab.to !== nextSlab.from) {
        return `Gap or overlap detected between slab ${i + 1} and ${i + 2}. Slab ends at ${slab.to}, next starts at ${nextSlab.from}.`;
      }
    }
  }

  return null;
}

/**
 * Calculates the commission amount based on the provided slabs and the net taxable amount.
 * 
 * @param netTaxableAmount - The ex-tax amount (gross minus discount, before GST)
 * @param slabs - The array of validated commission slabs
 * @returns The calculated commission amount (number with 2 decimal precision)
 */
export function calculateCommission(
  netTaxableAmount: number,
  slabs: CommissionSlab[]
): number {
  if (!slabs || slabs.length === 0) return 0;
  if (netTaxableAmount <= 0) return 0;

  // Find the matching slab
  const matchingSlab = slabs.find((slab) => {
    const isAboveOrEqual = netTaxableAmount >= slab.from;
    const isBelowLimit = slab.to === null || netTaxableAmount < slab.to;
    return isAboveOrEqual && isBelowLimit;
  });

  if (!matchingSlab) {
    // This should theoretically never happen if slabs are validated correctly
    // as the last slab implicitly covers Infinity.
    return 0;
  }

  let commission = 0;

  if (matchingSlab.type === "flat") {
    commission = matchingSlab.value;
  } else if (matchingSlab.type === "percent") {
    commission = netTaxableAmount * (matchingSlab.value / 100);
  }

  // Ensure 2 decimal precision
  return Math.round(commission * 100) / 100;
}
