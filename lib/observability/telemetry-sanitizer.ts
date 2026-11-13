/**
 * @file lib/observability/telemetry-sanitizer.ts
 * @description Invariant 6.2.10: Calculation Telemetry Sanitizer.
 * Guarantees zero PII leakage, zero NaN/Infinity, and zero [object Object] artifacts.
 */

import type { CalculationTelemetryEvent } from "./telemetry-types";

const FORBIDDEN_PII_KEYS = new Set([
  "name",
  "customer_name",
  "customername",
  "phone",
  "phonenumber",
  "mobile",
  "email",
  "address",
  "street",
  "city",
  "pincode",
  "uid",
  "firebase_uid",
  "actor_id",
  "internalmessage",
  "stack",
  "stacktrace",
]);

/**
 * Sanitizes and validates a calculation telemetry event before emission.
 * Throws an Error if illegal values (NaN, Infinity, PII) are detected.
 */
export function sanitizeCalculationTelemetry(
  event: CalculationTelemetryEvent
): CalculationTelemetryEvent {
  if (!event || typeof event !== "object") {
    throw new Error("[Telemetry Sanitizer] Event must be a non-null object.");
  }

  // 1. Validate Non-Finite Numbers
  if (!Number.isFinite(event.durationMs) || event.durationMs < 0) {
    throw new Error(`[Telemetry Sanitizer] durationMs must be a finite non-negative number: ${event.durationMs}`);
  }

  if (event.pricing) {
    if (event.pricing.totalPayable !== undefined && !Number.isFinite(event.pricing.totalPayable)) {
      throw new Error(`[Telemetry Sanitizer] totalPayable cannot be NaN or Infinity: ${event.pricing.totalPayable}`);
    }
    if (event.pricing.netTaxableAmount !== undefined && !Number.isFinite(event.pricing.netTaxableAmount)) {
      throw new Error(`[Telemetry Sanitizer] netTaxableAmount cannot be NaN or Infinity: ${event.pricing.netTaxableAmount}`);
    }
    if (event.pricing.gstAmount !== undefined && !Number.isFinite(event.pricing.gstAmount)) {
      throw new Error(`[Telemetry Sanitizer] gstAmount cannot be NaN or Infinity: ${event.pricing.gstAmount}`);
    }
  }

  // 2. Validate Strings & Prevent [object Object]
  const stringFields = [
    { key: "requestId", val: event.requestId },
    { key: "engineVersion", val: event.engineVersion },
    { key: "catalogSnapshotHash", val: event.catalogSnapshotHash },
    { key: "pricingPolicyVersion", val: event.pricingPolicyVersion },
    { key: "calculationFingerprint", val: event.calculationFingerprint },
  ];

  for (const f of stringFields) {
    if (!f.val || typeof f.val !== "string" || f.val.includes("[object Object]")) {
      throw new Error(`[Telemetry Sanitizer] Field ${f.key} contains illegal or [object Object] string: ${f.val}`);
    }
  }

  // 3. Recursive PII and Object Scrubbing
  function checkPiiRecursively(obj: unknown, path = ""): void {
    if (!obj || typeof obj !== "object") return;
    for (const [key, val] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (FORBIDDEN_PII_KEYS.has(lowerKey)) {
        throw new Error(`[Telemetry Sanitizer] Forbidden PII field '${key}' detected at ${path}.${key}`);
      }
      if (typeof val === "string" && val.includes("[object Object]")) {
        throw new Error(`[Telemetry Sanitizer] String contains [object Object] at ${path}.${key}`);
      }
      if (val && typeof val === "object") {
        checkPiiRecursively(val, `${path}.${key}`);
      }
    }
  }

  checkPiiRecursively(event);

  // Return deeply cloned clean object
  return JSON.parse(JSON.stringify(event));
}
