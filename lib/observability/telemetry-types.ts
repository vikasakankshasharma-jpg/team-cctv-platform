/**
 * @file lib/observability/telemetry-types.ts
 * @description Phase 6.2 Canonical Calculation Telemetry Types & Invariants.
 * Defines the strict, non-PII calculation telemetry contract for the TEAM CCTV Platform.
 */

import type { QuotationErrorCode } from "../quotation-boundary";

export const PRICING_ENGINE_VERSION = "pricing-engine-1.0.0" as const;
export const PRICING_POLICY_VERSION = "TEAM-CCTV-PRICING-POLICY-V1" as const;
export const CERTIFICATION_VERSION = "TEAM-CCTV-CERT-V1" as const;

export type TelemetrySource =
  | "api_quotes_post"
  | "calculatePricingV2"
  | "web_wizard"
  | "whatsapp";

export type TelemetryEventType =
  | "quotation.calculation.completed"
  | "quotation.calculation.failed";

export interface CalculationTelemetryRequirement {
  cameraCount?: number;
  outdoorCameraCount?: number;
  indoorCameraCount?: number;
  technology?: string;
  resolution?: string;
  brand?: string;
  storageDays?: number;
  propertyType?: string;
  requiresIndustrialQuote?: boolean;
}

export interface CalculationTelemetryPricing {
  totalPayable?: number;
  netTaxableAmount?: number;
  gstAmount?: number;
  lineCount?: number;
  grossProfitValue?: number;
}

export interface CalculationTelemetryResult {
  success: boolean;
  errorCode?: QuotationErrorCode;
  isRetryable?: boolean;
}

/**
 * Canonical Calculation Telemetry Event Contract.
 * Strictly excludes PII (names, emails, phones, addresses) and raw stack traces.
 */
export interface CalculationTelemetryEvent {
  event: TelemetryEventType;
  timestamp: string;
  requestId: string;
  quoteId?: string;
  source: TelemetrySource;
  durationMs: number;
  engineVersion: string;
  catalogSnapshotHash: string;
  pricingPolicyVersion: string;
  calculationFingerprint: string;
  result: CalculationTelemetryResult;
  requirement: CalculationTelemetryRequirement;
  pricing?: CalculationTelemetryPricing;
}
