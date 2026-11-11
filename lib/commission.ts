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

/**
 * Unified Promoter / Referral commission calculator (used on Lead WON & Profit Breakup).
 * Precedence:
 * 1. Explicit promoter_incentive_type ("flat" | "percent")
 * 2. Tiered / B2C commission_slabs (e.g. ₹500 B2C reward or 2% B2B partner onboarding slab)
 * 3. Legacy flat partner_type / discount_value
 * 4. Global fallback promoter_commission_percent (default 2%)
 */
export function resolvePromoterCommission(
  netTaxableAmount: number,
  promoter?: {
    promoter_incentive_type?: "percent" | "flat" | string;
    promoter_incentive_value?: number;
    commission_slabs?: CommissionSlab[];
    partner_type?: string;
    discount_type?: string;
    discount_value?: number;
    tier?: string;
  } | null,
  defaultCommissionPercent: number = 2
): { amount: number; label: string } {
  if (netTaxableAmount <= 0) return { amount: 0, label: "No taxable amount" };

  if (!promoter) {
    const pct = Number(defaultCommissionPercent || 0);
    return {
      amount: pct > 0 ? Math.round(netTaxableAmount * (pct / 100) * 100) / 100 : 0,
      label: pct > 0 ? `Referral Commission (${pct}%)` : "None",
    };
  }

  if (promoter.promoter_incentive_type === "flat" && Number(promoter.promoter_incentive_value) > 0) {
    const val = Number(promoter.promoter_incentive_value);
    return { amount: val, label: `Promoter Flat Commission (₹${val})` };
  }

  if (promoter.promoter_incentive_type === "percent" && Number(promoter.promoter_incentive_value) > 0) {
    const pct = Number(promoter.promoter_incentive_value);
    return {
      amount: Math.round(netTaxableAmount * (pct / 100) * 100) / 100,
      label: `Promoter Commission (${pct}%)`,
    };
  }

  if (Array.isArray(promoter.commission_slabs) && promoter.commission_slabs.length > 0) {
    const slabAmt = calculateCommission(netTaxableAmount, promoter.commission_slabs);
    if (slabAmt > 0) {
      return {
        amount: slabAmt,
        label: promoter.tier === "b2c" ? "B2C Refer & Earn Reward" : "Partner Slab Commission",
      };
    }
  }

  if (promoter.partner_type === "flat" && promoter.discount_value) {
    const val = Number(promoter.discount_value) || 0;
    return { amount: val, label: `Flat Partner Commission (₹${val})` };
  }

  if (promoter.discount_type === "percent" && promoter.discount_value && promoter.tier !== "b2c") {
    const pct = Number(promoter.discount_value) || 0;
    return {
      amount: Math.round(netTaxableAmount * (pct / 100) * 100) / 100,
      label: `Partner Commission (${pct}%)`,
    };
  }

  const fallbackPct = Number(defaultCommissionPercent ?? 2);
  return {
    amount: Math.round(netTaxableAmount * (fallbackPct / 100) * 100) / 100,
    label: `Promoter Commission (${fallbackPct}%)`,
  };
}
