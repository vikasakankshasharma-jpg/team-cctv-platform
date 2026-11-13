import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PRICING_ENGINE_VERSION,
  PRICING_POLICY_VERSION,
  CERTIFICATION_VERSION,
  type CalculationTelemetryEvent,
} from "../../../lib/observability/telemetry-types.ts";
import {
  computeCalculationFingerprint,
  computeCatalogSnapshotHash,
  toCanonicalJsonString,
  canonicalizeJson,
} from "../../../lib/observability/calculation-fingerprint.ts";
import { sanitizeCalculationTelemetry } from "../../../lib/observability/telemetry-sanitizer.ts";
import {
  buildCalculationTelemetryEvent,
  emitCalculationTelemetry,
  telemetryBus,
} from "../../../lib/observability/calculation-telemetry.ts";
import { inspectProductDrift } from "../../../lib/observability/catalog-drift-watcher.ts";

test("Phase 6.2 — Calculation Observability, Telemetry & Drift Watcher", async (t) => {
  const snapshotPath = join(process.cwd(), "tests/certification/fixtures/CERTIFICATION_SNAPSHOT_BUNDLE.json");
  const bundle = JSON.parse(readFileSync(snapshotPath, "utf8"));
  const products = bundle.context?.products ?? bundle.products ?? [];
  const catalogHash = computeCatalogSnapshotHash(products);

  assert.ok(catalogHash && catalogHash.length === 64, "Catalog snapshot hash must be 64-char hex SHA-256");

  // ==========================================
  // Section 1: Deterministic Fingerprint Tests
  // ==========================================

  await t.test("1. Same canonical requirement produces identical calculation fingerprint", () => {
    const req1 = { camera_count: 4, technology: "HD", resolution: "2MP", property_type: "shop" };
    const req2 = { camera_count: 4, technology: "HD", resolution: "2MP", property_type: "shop" };

    const fp1 = computeCalculationFingerprint({ requirement: req1, catalogSnapshotHash: catalogHash });
    const fp2 = computeCalculationFingerprint({ requirement: req2, catalogSnapshotHash: catalogHash });

    assert.equal(fp1, fp2);
    assert.equal(fp1.length, 64);
  });

  await t.test("2. Key-order variation produces identical calculation fingerprint", () => {
    // Different key insertion order
    const reqA = { camera_count: 4, technology: "HD", resolution: "2MP", storage_retention_days: 15 };
    const reqB = { storage_retention_days: 15, resolution: "2MP", camera_count: 4, technology: "HD" };

    const fpA = computeCalculationFingerprint({ requirement: reqA, catalogSnapshotHash: catalogHash });
    const fpB = computeCalculationFingerprint({ requirement: reqB, catalogSnapshotHash: catalogHash });

    assert.equal(fpA, fpB, "Fingerprint must be immune to object key ordering differences");
  });

  await t.test("3. Requirement change (cameraCount 4 -> 5) produces different fingerprint", () => {
    const req4 = { camera_count: 4, technology: "HD", resolution: "2MP" };
    const req5 = { camera_count: 5, technology: "HD", resolution: "2MP" };

    const fp4 = computeCalculationFingerprint({ requirement: req4, catalogSnapshotHash: catalogHash });
    const fp5 = computeCalculationFingerprint({ requirement: req5, catalogSnapshotHash: catalogHash });

    assert.notEqual(fp4, fp5, "Altering camera count must produce distinct fingerprint");
  });

  await t.test("4. Engine version change produces different fingerprint", () => {
    const req = { camera_count: 4, technology: "HD" };
    const fpV1 = computeCalculationFingerprint({ requirement: req, catalogSnapshotHash: catalogHash, engineVersion: "pricing-engine-1.0.0" });
    const fpV2 = computeCalculationFingerprint({ requirement: req, catalogSnapshotHash: catalogHash, engineVersion: "pricing-engine-2.0.0" });

    assert.notEqual(fpV1, fpV2);
  });

  await t.test("5. Catalog snapshot hash change produces different fingerprint", () => {
    const req = { camera_count: 4, technology: "HD" };
    const fpCat1 = computeCalculationFingerprint({ requirement: req, catalogSnapshotHash: "0000000000000000000000000000000000000000000000000000000000000001" });
    const fpCat2 = computeCalculationFingerprint({ requirement: req, catalogSnapshotHash: "0000000000000000000000000000000000000000000000000000000000000002" });

    assert.notEqual(fpCat1, fpCat2);
  });

  await t.test("6. Pricing policy version change produces different fingerprint", () => {
    const req = { camera_count: 4, technology: "HD" };
    const fpPol1 = computeCalculationFingerprint({ requirement: req, catalogSnapshotHash: catalogHash, pricingPolicyVersion: "TEAM-CCTV-PRICING-POLICY-V1" });
    const fpPol2 = computeCalculationFingerprint({ requirement: req, catalogSnapshotHash: catalogHash, pricingPolicyVersion: "TEAM-CCTV-PRICING-POLICY-V2" });

    assert.notEqual(fpPol1, fpPol2);
  });

  // ==========================================
  // Section 2: Telemetry Event Construction & Sanitization
  // ==========================================

  await t.test("7. Success telemetry event captures required fields and preserves requestId & quoteId", () => {
    const execution = {
      success: true as const,
      data: {
        total_payable: 25000,
        taxable_amount: 21186.44,
        gst_amount: 3813.56,
        line_items: [{ sku: "CAM-HIK-2MP", unit_price: 2000, quantity: 4, total_price: 8000 }],
        gross_profit_value: 5000,
      },
      requestId: "req_success_101",
      timestamp: new Date().toISOString(),
    };

    const event = buildCalculationTelemetryEvent({
      execution,
      requirement: { camera_count: 4, technology: "HD" },
      source: "api_quotes_post",
      catalogSnapshotHash: catalogHash,
      durationMs: 42,
      quoteId: "quote_hik_001",
    });

    assert.equal(event.event, "quotation.calculation.completed");
    assert.equal(event.requestId, "req_success_101");
    assert.equal(event.quoteId, "quote_hik_001");
    assert.equal(event.durationMs, 42);
    assert.equal(event.pricing?.totalPayable, 25000);
    assert.equal(event.pricing?.lineCount, 1);
    assert.equal(event.result.success, true);
  });

  await t.test("8. Failure telemetry event records errorCode and isRetryable without internal messages", () => {
    const execution = {
      success: false as const,
      code: "INFRASTRUCTURE_ERROR" as const,
      customerMessage: "Catalog services are temporarily taking longer than expected. Please try again in a few moments.",
      internalMessage: "Firestore timeout at connection pool socket /var/run/firestore.sock",
      requestId: "req_fail_202",
      isRetryable: true,
      timestamp: new Date().toISOString(),
    };

    const event = buildCalculationTelemetryEvent({
      execution,
      requirement: { camera_count: 4, technology: "HD" },
      source: "api_quotes_post",
      catalogSnapshotHash: catalogHash,
      durationMs: 120,
    });

    assert.equal(event.event, "quotation.calculation.failed");
    assert.equal(event.result.success, false);
    assert.equal(event.result.errorCode, "INFRASTRUCTURE_ERROR");
    assert.equal(event.result.isRetryable, true);

    const eventStr = JSON.stringify(event);
    assert.ok(!eventStr.includes("internalMessage"), "Internal message must not be in telemetry");
    assert.ok(!eventStr.includes("/var/run/firestore.sock"), "Internal socket path must not be in telemetry");
  });

  await t.test("9. Sanitizer blocks NaN, Infinity and non-finite monetary values", () => {
    const badEvent: any = {
      event: "quotation.calculation.completed",
      timestamp: new Date().toISOString(),
      requestId: "req_bad_303",
      source: "api_quotes_post",
      durationMs: 50,
      engineVersion: "pricing-engine-1.0.0",
      catalogSnapshotHash: catalogHash,
      pricingPolicyVersion: "TEAM-CCTV-PRICING-POLICY-V1",
      calculationFingerprint: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      result: { success: true },
      requirement: { cameraCount: 4 },
      pricing: { totalPayable: NaN },
    };

    assert.throws(() => sanitizeCalculationTelemetry(badEvent), /cannot be NaN or Infinity/);
  });

  await t.test("10. Sanitizer blocks PII fields (customer phone, name, email)", () => {
    const piiEvent: any = {
      event: "quotation.calculation.completed",
      timestamp: new Date().toISOString(),
      requestId: "req_pii_404",
      source: "api_quotes_post",
      durationMs: 30,
      engineVersion: "pricing-engine-1.0.0",
      catalogSnapshotHash: catalogHash,
      pricingPolicyVersion: "TEAM-CCTV-PRICING-POLICY-V1",
      calculationFingerprint: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      result: { success: true },
      requirement: { cameraCount: 4, customer_name: "John Doe" }, // ILLEGAL PII
    };

    assert.throws(() => sanitizeCalculationTelemetry(piiEvent), /Forbidden PII field 'customer_name'/);
  });

  await t.test("11. Invariant: MANUAL_QUOTE produces valid telemetry with totalPayable=0", () => {
    const execution = {
      success: true as const,
      data: {
        plan_type: "MANUAL_QUOTE",
        requiresIndustrialQuote: true,
        total_payable: 0,
        taxable_amount: 0,
        gst_amount: 0,
        line_items: [],
      },
      requestId: "req_manual_505",
      timestamp: new Date().toISOString(),
    };

    const event = buildCalculationTelemetryEvent({
      execution,
      requirement: { requiresIndustrialQuote: true, camera_count: 64 },
      source: "api_quotes_post",
      catalogSnapshotHash: catalogHash,
      durationMs: 15,
    });

    assert.equal(event.event, "quotation.calculation.completed");
    assert.equal(event.pricing?.totalPayable, 0);
    assert.equal(event.requirement.requiresIndustrialQuote, true);
  });

  // ==========================================
  // Section 3: Governed Catalog Drift Watcher
  // ==========================================

  await t.test("12. Drift Watcher detects price mutation, warns, and enforces NO AUTO REVERT", () => {
    const governed = {
      sku: "HDD-BUD-500GB",
      unit_price: 1800,
      is_active: true,
      is_quotation_eligible: true,
    };

    // Live price changed from 1800 to 1950 (+150)
    const live = {
      sku: "HDD-BUD-500GB",
      unit_price: 1950,
      is_active: true,
      is_quotation_eligible: true,
    };

    const incident = inspectProductDrift(live, governed);
    assert.equal(incident.requiresReview, true);
    assert.equal(incident.autoReverted, false, "Must strictly NOT auto-revert");
    assert.equal(incident.findings.length, 1);
    assert.equal(incident.findings[0]?.category, "PRICE_DRIFT");
    assert.equal(incident.findings[0]?.severity, "WARNING");
    assert.equal(incident.findings[0]?.variance, 150);
  });

  await t.test("13. Drift Watcher detects deleted/missing governed product as CRITICAL", () => {
    const governed = {
      sku: "CAM-HIK-HD-2MP-BULLET",
      unit_price: 2000,
      is_active: true,
    };

    const incident = inspectProductDrift(null as any, governed);
    assert.equal(incident.maxSeverity, "CRITICAL");
    assert.equal(incident.requiresReview, true);
    assert.equal(incident.findings[0]?.category, "SKU_DRIFT");
    assert.equal(incident.autoReverted, false);
  });

  await t.test("14. Telemetry event bus emission and subscriber receipt", () => {
    telemetryBus.clearHistory();
    let received: CalculationTelemetryEvent | null = null;
    const unsub = telemetryBus.subscribe((evt) => {
      received = evt;
    });

    const execution = {
      success: true as const,
      data: { total_payable: 15000, taxable_amount: 12711.86, gst_amount: 2288.14 },
      requestId: "req_bus_test",
      timestamp: new Date().toISOString(),
    };

    const emitted = emitCalculationTelemetry({
      execution,
      requirement: { camera_count: 2 },
      source: "web_wizard",
      catalogSnapshotHash: catalogHash,
      durationMs: 25,
    });

    assert.ok(received);
    assert.equal((received as CalculationTelemetryEvent).requestId, "req_bus_test");
    assert.equal(telemetryBus.getRecentEvents().length, 1);
    unsub();
  });
});
