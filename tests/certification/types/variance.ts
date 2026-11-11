export const VARIANCE_SEVERITIES = [
  "INFO",
  "WARNING",
  "ERROR",
  "CRITICAL",
] as const;

export type VarianceSeverity = (typeof VARIANCE_SEVERITIES)[number];

export const VARIANCE_CODES = [
  "VALUE_MISMATCH",
  "TYPE_MISMATCH",
  "MISSING_FIELD",
  "UNEXPECTED_FIELD",
  "GST_DOUBLE_CHARGE",
  "GST_MISSING",
  "GST_MODE_MISMATCH",
  "MOCK_SKU",
  "FALLBACK_SKU",
  "UNMAPPED_SKU",
  "AMBIGUOUS_SKU",
  "COST_DRIFT",
  "MARGIN_DRIFT",
  "UNIT_PRICE_DRIFT",
  "INACTIVE_PRODUCT",
  "DELETED_PRODUCT",
  "NON_QUOTATION_ELIGIBLE",
  "RECORDER_UNDERSIZED",
  "STORAGE_SHORTFALL",
  "PATH_TOTAL_MISMATCH",
  "PATH_BOM_MISMATCH",
  "PATH_PRICING_MISMATCH",
  "CLASSIFICATION_MISMATCH",
  "MANUAL_QUOTE_MISMATCH",
  "INVALID_CASE_ACCEPTED",
  "LEGACY_PLAN_DRIFT",
] as const;

export type VarianceCode = (typeof VARIANCE_CODES)[number];

export interface NumericVariance {
  expected: number;
  actual: number;
  absolute_difference: number;
  relative_difference_percent: number;
}

export interface Variance {
  code: VarianceCode;
  severity: VarianceSeverity;
  case_id: string;
  path?: string;
  expected: unknown;
  actual: unknown;
  message: string;
  delta?: number;
  numeric?: NumericVariance;
}

export interface VarianceSummary {
  total: number;
  by_severity: Record<VarianceSeverity, number>;
  by_code: Partial<Record<VarianceCode, number>>;
}

export function numericVariance(expected: number, actual: number): NumericVariance {
  const absolute_difference = Math.abs(actual - expected);
  const relative_difference_percent =
    expected === 0
      ? absolute_difference === 0
        ? 0
        : 100
      : (absolute_difference / Math.abs(expected)) * 100;

  return {
    expected,
    actual,
    absolute_difference,
    relative_difference_percent,
  };
}

export function createVariance(input: Variance): Variance {
  return { ...input };
}
