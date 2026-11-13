/**
 * @file lib/observability/calculation-telemetry.ts
 * @description Phase 6.2.1 / 6.2.3 Canonical Calculation Telemetry Emitter.
 * Constructs, sanitizes, and emits auditable calculation events without mutating domain pricing.
 */

import {
  PRICING_ENGINE_VERSION,
  PRICING_POLICY_VERSION,
  type CalculationTelemetryEvent,
  type TelemetrySource,
} from "./telemetry-types";
import {
  computeCalculationFingerprint,
  extractCalculationRelevantRequirement,
} from "./calculation-fingerprint";
import { sanitizeCalculationTelemetry } from "./telemetry-sanitizer";
import type { SafeQuotationExecution } from "../quotation-boundary";

type TelemetryListener = (event: CalculationTelemetryEvent) => void;

class CalculationTelemetryBus {
  private readonly listeners: TelemetryListener[] = [];
  private readonly recentEvents: CalculationTelemetryEvent[] = [];
  private readonly MAX_HISTORY = 100;

  subscribe(listener: TelemetryListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  emit(event: CalculationTelemetryEvent): void {
    const sanitized = sanitizeCalculationTelemetry(event);
    this.recentEvents.push(sanitized);
    if (this.recentEvents.length > this.MAX_HISTORY) {
      this.recentEvents.shift();
    }

    for (const listener of this.listeners) {
      try {
        listener(sanitized);
      } catch (err) {
        console.error("[Telemetry Bus] Error in listener execution:", err);
      }
    }
  }

  getRecentEvents(): readonly CalculationTelemetryEvent[] {
    return this.recentEvents;
  }

  clearHistory(): void {
    this.recentEvents.length = 0;
  }
}

export const telemetryBus = new CalculationTelemetryBus();

export interface BuildTelemetryParams {
  execution: SafeQuotationExecution<any>;
  requirement: any;
  source: TelemetrySource;
  catalogSnapshotHash: string;
  durationMs: number;
  quoteId?: string;
  engineVersion?: string;
  pricingPolicyVersion?: string;
}

/**
 * Builds and sanitizes a calculation telemetry event from a SafeQuotationExecution.
 */
export function buildCalculationTelemetryEvent(params: BuildTelemetryParams): CalculationTelemetryEvent {
  const { execution, requirement, source, catalogSnapshotHash, durationMs, quoteId } = params;
  const engineVersion = params.engineVersion || PRICING_ENGINE_VERSION;
  const pricingPolicyVersion = params.pricingPolicyVersion || PRICING_POLICY_VERSION;

  const cleanReq = extractCalculationRelevantRequirement(requirement);
  const fingerprint = computeCalculationFingerprint({
    requirement: cleanReq,
    engineVersion,
    catalogSnapshotHash,
    pricingPolicyVersion,
  });

  const timestamp = execution.timestamp || new Date().toISOString();
  const requestId = execution.requestId || `req_${Date.now()}`;

  if (execution.success) {
    const data = execution.data || {};
    const items = data.line_items || data.items || data.bom || [];

    const event: CalculationTelemetryEvent = {
      event: "quotation.calculation.completed",
      timestamp,
      requestId,
      quoteId,
      source,
      durationMs: Math.max(0, durationMs),
      engineVersion,
      catalogSnapshotHash,
      pricingPolicyVersion,
      calculationFingerprint: fingerprint,
      result: {
        success: true,
      },
      requirement: cleanReq,
      pricing: {
        totalPayable: typeof data.total_payable === "number" ? data.total_payable : data.totalPayable,
        netTaxableAmount: typeof data.taxable_amount === "number" ? data.taxable_amount : data.net_taxable_amount,
        gstAmount: typeof data.gst_amount === "number" ? data.gst_amount : data.gstAmount,
        lineCount: Array.isArray(items) ? items.length : 0,
        grossProfitValue: typeof data.gross_profit_value === "number" ? data.gross_profit_value : undefined,
      },
    };

    return sanitizeCalculationTelemetry(event);
  }

  // Failure event
  const failureEvent: CalculationTelemetryEvent = {
    event: "quotation.calculation.failed",
    timestamp,
    requestId,
    quoteId,
    source,
    durationMs: Math.max(0, durationMs),
    engineVersion,
    catalogSnapshotHash,
    pricingPolicyVersion,
    calculationFingerprint: fingerprint,
    result: {
      success: false,
      errorCode: execution.code,
      isRetryable: execution.isRetryable,
    },
    requirement: cleanReq,
  };

  return sanitizeCalculationTelemetry(failureEvent);
}

/**
 * Emits calculation telemetry to the system event bus.
 */
export function emitCalculationTelemetry(params: BuildTelemetryParams): CalculationTelemetryEvent {
  const event = buildCalculationTelemetryEvent(params);
  telemetryBus.emit(event);
  return event;
}
