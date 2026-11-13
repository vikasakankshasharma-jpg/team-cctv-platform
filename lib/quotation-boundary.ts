/**
 * @file lib/quotation-boundary.ts
 * @description Phase 6.1.1 Canonical Quotation Runtime Safety Boundary.
 * Enforces zero-leak error taxonomy, invalid money guards, catalog integrity,
 * and zero-[object Object] invariants before any quotation crosses the application boundary.
 */

import { extractErrorMessage } from "./utils";

export type QuotationErrorCode =
  | "VALIDATION_ERROR"
  | "CATALOG_ERROR"
  | "CALCULATION_ERROR"
  | "INFRASTRUCTURE_ERROR"
  | "INTERNAL_ERROR";

export interface SafeQuotationError {
  success: false;
  code: QuotationErrorCode;
  customerMessage: string;
  internalMessage: string;
  requestId?: string;
  isRetryable: boolean;
  timestamp: string;
}

export interface SafeQuotationSuccess<T> {
  success: true;
  data: T;
  requestId?: string;
  timestamp: string;
}

export type SafeQuotationExecution<T> = SafeQuotationSuccess<T> | SafeQuotationError;

/**
 * Standard customer-facing messages that never leak internal database,
 * infrastructure, or stack trace details to consumers.
 */
export const DEFAULT_CUSTOMER_MESSAGES: Record<QuotationErrorCode, string> = {
  VALIDATION_ERROR: "Please check your camera and property specifications and try again.",
  CATALOG_ERROR: "Some selected hardware specifications are currently being updated in our catalog. Please contact us for a site survey.",
  CALCULATION_ERROR: "We were unable to compute pricing for this configuration. Our technical team has been notified.",
  INFRASTRUCTURE_ERROR: "Catalog services are temporarily taking longer than expected. Please try again in a few moments.",
  INTERNAL_ERROR: "An unexpected error occurred while generating your quotation. Please try again.",
};

export class QuotationBoundaryError extends Error {
  readonly code: QuotationErrorCode;
  readonly customerMessage: string;
  readonly internalDetails?: Record<string, unknown>;
  readonly isRetryable: boolean;

  constructor(params: {
    code: QuotationErrorCode;
    message: string;
    customerMessage?: string;
    internalDetails?: Record<string, unknown>;
    isRetryable?: boolean;
  }) {
    super(params.message);
    this.name = "QuotationBoundaryError";
    this.code = params.code;
    this.customerMessage = params.customerMessage || DEFAULT_CUSTOMER_MESSAGES[params.code];
    this.internalDetails = params.internalDetails;
    this.isRetryable = params.isRetryable ?? (params.code === "INFRASTRUCTURE_ERROR");
  }
}

/**
 * Invariant 6.1.4: NaN / Infinity / Invalid-Money Guard.
 * Rejects any quotation containing NaN, Infinity, undefined monetary amounts,
 * negative customer prices, or broken reverse-GST reconciliations.
 */
export function validateMoneyIntegrity(pricing: Record<string, any>): void {
  if (!pricing || typeof pricing !== "object") {
    throw new QuotationBoundaryError({
      code: "CALCULATION_ERROR",
      message: "Quotation payload is null or not an object.",
    });
  }

  const numericFieldsToCheck = [
    { key: "total_payable", name: "Total Payable", canBeZero: false },
    { key: "taxable_amount", name: "Taxable Base", canBeZero: false, altKeys: ["net_taxable_amount"] },
    { key: "gst_amount", name: "GST Amount", canBeZero: false },
  ];

  for (const field of numericFieldsToCheck) {
    let value = pricing[field.key];
    if (value === undefined && field.altKeys) {
      for (const alt of field.altKeys) {
        if (pricing[alt] !== undefined) {
          value = pricing[alt];
          break;
        }
      }
    }

    if (value === undefined || value === null) {
      throw new QuotationBoundaryError({
        code: "CALCULATION_ERROR",
        message: `Missing mandatory monetary field: ${field.key}`,
        internalDetails: { field: field.key },
      });
    }

    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new QuotationBoundaryError({
        code: "CALCULATION_ERROR",
        message: `Monetary field ${field.key} is not a finite number: ${value}`,
        internalDetails: { field: field.key, value },
      });
    }

    if (!field.canBeZero && value <= 0) {
      throw new QuotationBoundaryError({
        code: "CALCULATION_ERROR",
        message: `Monetary field ${field.key} must be strictly positive: ${value}`,
        internalDetails: { field: field.key, value },
      });
    }
  }

  // Reverse-GST Reconciliation Invariant: Taxable + GST === Total Payable (±₹0.10 currency rounding)
  const payable = pricing.total_payable ?? pricing.totalPayable ?? 0;
  const taxable = pricing.taxable_amount ?? pricing.net_taxable_amount ?? pricing.taxableBase ?? 0;
  const gst = pricing.gst_amount ?? pricing.gstAmount ?? 0;
  const taxSum = taxable + gst;
  const drift = Math.abs(taxSum - payable);

  if (drift > 0.10) {
    throw new QuotationBoundaryError({
      code: "CALCULATION_ERROR",
      message: `Tax reconciliation broken: taxable (${taxable}) + gst (${gst}) = ${taxSum} !== total (${payable}), drift = ${drift}`,
      internalDetails: { payable, taxable, gst, drift },
    });
  }

  // Validate Line Items
  const items = pricing.line_items || pricing.items || pricing.bom || [];
  if (Array.isArray(items)) {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it || typeof it !== "object") {
        throw new QuotationBoundaryError({
          code: "CALCULATION_ERROR",
          message: `Line item at index ${i} is corrupt.`,
        });
      }

      if (typeof it.unit_price === "number" && !Number.isFinite(it.unit_price)) {
        throw new QuotationBoundaryError({
          code: "CALCULATION_ERROR",
          message: `Line item ${it.sku || it.name} has non-finite unit_price: ${it.unit_price}`,
        });
      }

      if (typeof it.total_price === "number" && !Number.isFinite(it.total_price)) {
        throw new QuotationBoundaryError({
          code: "CALCULATION_ERROR",
          message: `Line item ${it.sku || it.name} has non-finite total_price: ${it.total_price}`,
        });
      }

      if (typeof it.quantity === "number" && (!Number.isFinite(it.quantity) || it.quantity < 0)) {
        throw new QuotationBoundaryError({
          code: "CALCULATION_ERROR",
          message: `Line item ${it.sku || it.name} has invalid quantity: ${it.quantity}`,
        });
      }
    }
  }
}

/**
 * Invariant 6.1.3: Catalog Integrity Guard.
 * Rejects silent fallbacks (price ?? 0, quantity || 1) when SKUs are unknown or uncertified.
 */
export function validateCatalogIntegrity(items: readonly any[]): void {
  if (!Array.isArray(items) || items.length === 0) {
    throw new QuotationBoundaryError({
      code: "CATALOG_ERROR",
      message: "Quotation generated an empty Bill of Materials (BOM).",
    });
  }

  for (const item of items) {
    const sku = String(item.sku || item.id || "").trim();
    if (!sku) {
      throw new QuotationBoundaryError({
        code: "CATALOG_ERROR",
        message: "Line item is missing SKU / ID identifier.",
        internalDetails: { item },
      });
    }

    // Check for silent unpriced items (unit_price is 0 or negative without being an approved zero-price promo)
    const isFreePromo = item.is_promo === true || item.is_free === true || sku.includes("promo_free_amc");
    if (typeof item.unit_price === "number" && item.unit_price <= 0 && !isFreePromo) {
      throw new QuotationBoundaryError({
        code: "CATALOG_ERROR",
        message: `Line item ${sku} has zero or negative unit_price without being an approved promotional SKU.`,
        internalDetails: { sku, unit_price: item.unit_price },
      });
    }
  }
}

/**
 * Canonical Quotation Runtime Safety Boundary Runner.
 * Executes any quotation generation function safely, captures all error types,
 * sanitizes messages, guarantees zero `[object Object]`, and returns a strongly-typed execution result.
 */
export function executeSafeQuotationCalculation<T>(
  calculationFn: () => T,
  context?: { requestId?: string; source?: string }
): SafeQuotationExecution<T> {
  const timestamp = new Date().toISOString();
  const requestId = context?.requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const result = calculationFn();

    // Verify money integrity if result is a pricing object
    if (result && typeof result === "object") {
      validateMoneyIntegrity(result as Record<string, any>);
      const items = (result as any).line_items || (result as any).items || (result as any).bom;
      if (Array.isArray(items)) {
        validateCatalogIntegrity(items);
      }
    }

    return {
      success: true,
      data: result,
      requestId,
      timestamp,
    };
  } catch (err: unknown) {
    // 1. If it's already a QuotationBoundaryError, preserve its classification
    if (err instanceof QuotationBoundaryError) {
      return {
        success: false,
        code: err.code,
        customerMessage: err.customerMessage,
        internalMessage: err.message,
        requestId,
        isRetryable: err.isRetryable,
        timestamp,
      };
    }

    // 2. Classify raw error types
    const rawMessage = extractErrorMessage(err);
    let code: QuotationErrorCode = "INTERNAL_ERROR";
    let isRetryable = false;

    if (
      rawMessage.includes("Invalid camera count") ||
      rawMessage.includes("camera_count <= 0") ||
      rawMessage.includes("negative") ||
      rawMessage.includes("validation") ||
      rawMessage.includes("Please enter")
    ) {
      code = "VALIDATION_ERROR";
    } else if (
      rawMessage.includes("No matching") ||
      rawMessage.includes("SKU") ||
      rawMessage.includes("catalog") ||
      rawMessage.includes("PRODUCT_NOT_FOUND") ||
      rawMessage.includes("unmapped")
    ) {
      code = "CATALOG_ERROR";
    } else if (
      rawMessage.includes("timeout") ||
      rawMessage.includes("ECONNREFUSED") ||
      rawMessage.includes("network") ||
      rawMessage.includes("Firestore") ||
      rawMessage.includes("unavailable")
    ) {
      code = "INFRASTRUCTURE_ERROR";
      isRetryable = true;
    } else if (
      rawMessage.includes("NaN") ||
      rawMessage.includes("Infinity") ||
      rawMessage.includes("tax") ||
      rawMessage.includes("reconciliation") ||
      rawMessage.includes("pricing calculation")
    ) {
      code = "CALCULATION_ERROR";
    }

    return {
      success: false,
      code,
      customerMessage: DEFAULT_CUSTOMER_MESSAGES[code],
      internalMessage: rawMessage,
      requestId,
      isRetryable,
      timestamp,
    };
  }
}
