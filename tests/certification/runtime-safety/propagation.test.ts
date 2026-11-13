import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  executeSafeQuotationCalculation,
  toHttpErrorResponse,
  QuotationBoundaryError,
  DEFAULT_CUSTOMER_MESSAGES,
  type SafeQuotationExecution,
} from "../../../lib/quotation-boundary.ts";
import { calculatePricingV2, calculatePricingV2Safe } from "../../../lib/pricing-engine-v2.ts";

test("Phase 6.1.2 — Propagation Gate & Delivery Boundary Integration", async (t) => {
  const snapshotPath = join(process.cwd(), "tests/certification/fixtures/CERTIFICATION_SNAPSHOT_BUNDLE.json");
  const bundle = JSON.parse(readFileSync(snapshotPath, "utf8"));
  const products = bundle.context?.products ?? bundle.products ?? [];
  const settings = bundle.context?.settings ?? bundle.settings ?? {};

  const cameraProduct = products.find((p: any) => p.sku === "CAM-HIK-HD-2MP-BULLET") || products[0];

  // Mock valid requirement & resolved system for calculatePricingV2
  const validResolvedSystem: any = {
    brand: "HIKVISION",
    resolution: "2MP",
    technology: "HD",
    channelCapacity: 4,
    cameraCount: 4,
    storageDays: 15,
    camera: cameraProduct,
    cameras: [{ product: cameraProduct, qty: 4, location: "outdoor" }],
    recorder: products.find((p: any) => (p.sku || "").includes("DVR")) || products[1],
    storage: products.find((p: any) => (p.sku || "").includes("hdd")) || products[2],
    powerSupply: products.find((p: any) => (p.sku || "").includes("PSU")) || products[3],
    cable: products.find((p: any) => (p.sku || "").includes("cable")) || products[4],
  };

  const validReq: any = {
    camera_count: 4,
    outdoor_camera_count: 2,
    indoor_camera_count: 2,
    property_type: "shop",
    storage_retention_days: 15,
  };

  await t.test("1. calculatePricingV2 domain return contract is preserved and returns QuoteDelivery", () => {
    const directResult = calculatePricingV2({
      resolvedSystem: validResolvedSystem,
      req: validReq,
      settings: settings as any,
      products,
    });

    assert.ok(directResult, "Direct calculatePricingV2 must return result");
    assert.ok(typeof directResult.total_payable === "number", "Must have numeric total_payable");
    assert.ok(directResult.total_payable > 0, "Must have positive total_payable");
    assert.ok(Array.isArray(directResult.items), "Must have items array");
  });

  await t.test("2. calculatePricingV2Safe wraps QuoteDelivery into SafeQuotationExecution.success", () => {
    const correlationId = "req_audit_test_789";
    const safeResult = calculatePricingV2Safe({
      resolvedSystem: validResolvedSystem,
      req: validReq,
      settings: settings as any,
      products,
    }, { requestId: correlationId });

    assert.equal(safeResult.success, true);
    if (safeResult.success) {
      assert.equal(safeResult.requestId, correlationId, "requestId must survive into success envelope");
      assert.ok(safeResult.timestamp, "Must contain ISO timestamp");
      assert.ok(safeResult.data.total_payable > 0, "Payload must contain valid total_payable");
    }
  });

  await t.test("3. VALIDATION_ERROR reaches API safely with HTTP 400 and safe customer message", () => {
    const errorExec = executeSafeQuotationCalculation(() => {
      throw new Error("Invalid camera count: camera_count <= 0 is not quotation eligible.");
    }, { requestId: "req_val_001" });

    assert.equal(errorExec.success, false);
    if (!errorExec.success) {
      assert.equal(errorExec.code, "VALIDATION_ERROR");
      const http = toHttpErrorResponse(errorExec);
      assert.equal(http.status, 400);
      assert.equal(http.body.error.code, "VALIDATION_ERROR");
      assert.equal(http.body.error.message, DEFAULT_CUSTOMER_MESSAGES.VALIDATION_ERROR);
      assert.equal(http.body.error.requestId, "req_val_001");
      assert.equal(http.body.error.isRetryable, false);
    }
  });

  await t.test("4. CATALOG_ERROR reaches API safely with HTTP 422 and hides internal database paths", () => {
    const errorExec = executeSafeQuotationCalculation(() => {
      throw new Error("PRODUCT_NOT_FOUND: firestore/products/CAM-XYZ missing in active snapshot.");
    }, { requestId: "req_cat_002" });

    assert.equal(errorExec.success, false);
    if (!errorExec.success) {
      assert.equal(errorExec.code, "CATALOG_ERROR");
      const http = toHttpErrorResponse(errorExec);
      assert.equal(http.status, 422);
      assert.equal(http.body.error.code, "CATALOG_ERROR");
      assert.equal(http.body.error.message, DEFAULT_CUSTOMER_MESSAGES.CATALOG_ERROR);
      assert.ok(!http.body.error.message.includes("firestore"), "Must not leak firestore path");
      assert.ok(!http.body.error.message.includes("CAM-XYZ"), "Must not leak internal SKU");
    }
  });

  await t.test("5. CALCULATION_ERROR reaches API safely with HTTP 422 and masks arithmetic anomalies", () => {
    const errorExec = executeSafeQuotationCalculation(() => {
      return { total_payable: NaN, taxable_amount: 1000, gst_amount: 180 };
    }, { requestId: "req_calc_003" });

    assert.equal(errorExec.success, false);
    if (!errorExec.success) {
      assert.equal(errorExec.code, "CALCULATION_ERROR");
      const http = toHttpErrorResponse(errorExec);
      assert.equal(http.status, 422);
      assert.equal(http.body.error.code, "CALCULATION_ERROR");
      assert.equal(http.body.error.message, DEFAULT_CUSTOMER_MESSAGES.CALCULATION_ERROR);
    }
  });

  await t.test("6. INFRASTRUCTURE_ERROR has isRetryable=true and HTTP 503", () => {
    const errorExec = executeSafeQuotationCalculation(() => {
      throw new Error("Firestore read timeout: Connection unavailable to Google Cloud Firestore (ECONNREFUSED).");
    }, { requestId: "req_infra_004" });

    assert.equal(errorExec.success, false);
    if (!errorExec.success) {
      assert.equal(errorExec.code, "INFRASTRUCTURE_ERROR");
      assert.equal(errorExec.isRetryable, true);
      const http = toHttpErrorResponse(errorExec);
      assert.equal(http.status, 503);
      assert.equal(http.body.error.isRetryable, true);
      assert.equal(http.body.error.message, DEFAULT_CUSTOMER_MESSAGES.INFRASTRUCTURE_ERROR);
    }
  });

  await t.test("7. INTERNAL_ERROR strictly hides stack traces and internal messages", () => {
    const errorExec = executeSafeQuotationCalculation(() => {
      const x: any = null;
      return x.methodThatDoesNotExist();
    }, { requestId: "req_internal_005" });

    assert.equal(errorExec.success, false);
    if (!errorExec.success) {
      assert.equal(errorExec.code, "INTERNAL_ERROR");
      const http = toHttpErrorResponse(errorExec);
      assert.equal(http.status, 500);
      assert.equal(http.body.error.message, DEFAULT_CUSTOMER_MESSAGES.INTERNAL_ERROR);
      assert.ok(!http.body.error.message.includes("TypeError"), "Must not leak JS TypeError");
      assert.ok(!http.body.error.message.includes("stack"), "Must not leak stack keyword");
      assert.notEqual(http.body.error.message, "[object Object]");
    }
  });

  await t.test("8. Invariant: MANUAL_QUOTE remains semantically valid with total=0 and requiresIndustrialQuote=true", () => {
    const manualIndustrialQuote = {
      plan_type: "MANUAL_QUOTE",
      requiresIndustrialQuote: true,
      total_payable: 0,
      taxable_amount: 0,
      gst_amount: 0,
      line_items: [],
      reason: "Custom factory deployment requires on-site survey.",
    };

    const res = executeSafeQuotationCalculation(() => manualIndustrialQuote, { requestId: "req_ind_006" });
    assert.equal(res.success, true, "MANUAL_QUOTE must be accepted as legitimate business state");
    if (res.success) {
      assert.equal(res.data.total_payable, 0);
      assert.equal(res.data.requiresIndustrialQuote, true);
      assert.equal(res.data.line_items.length, 0);
    }
  });

  await t.test("9. WhatsApp formatter integration receives safe structured message without raw object leakage", () => {
    const failedQuotation: SafeQuotationExecution<any> = {
      success: false,
      code: "CATALOG_ERROR",
      customerMessage: DEFAULT_CUSTOMER_MESSAGES.CATALOG_ERROR,
      internalMessage: "PRODUCT_NOT_FOUND: camera_4mp_ptz not in catalog",
      requestId: "req_wa_007",
      isRetryable: false,
      timestamp: new Date().toISOString(),
    };

    // Simulate WhatsApp Message Dispatcher handling
    function formatWhatsAppQuotationMessage(safeResult: SafeQuotationExecution<any>): string {
      if (!safeResult.success) {
        return `⚠️ *Quotation Notice*\n\n${safeResult.customerMessage}\n\n_Reference ID: ${safeResult.requestId}_`;
      }
      return `✅ Total: ₹${safeResult.data.total_payable}`;
    }

    const waText = formatWhatsAppQuotationMessage(failedQuotation);
    assert.ok(waText.includes("Reference ID: req_wa_007"));
    assert.ok(waText.includes(DEFAULT_CUSTOMER_MESSAGES.CATALOG_ERROR));
    assert.ok(!waText.includes("[object Object]"), "WhatsApp message must never contain [object Object]");
    assert.ok(!waText.includes("PRODUCT_NOT_FOUND"), "WhatsApp message must never contain internal error tags");
  });
});
