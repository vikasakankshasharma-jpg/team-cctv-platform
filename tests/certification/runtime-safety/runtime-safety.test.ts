import test from "node:test";
import assert from "node:assert/strict";
import {
  executeSafeQuotationCalculation,
  validateMoneyIntegrity,
  validateCatalogIntegrity,
  QuotationBoundaryError,
  DEFAULT_CUSTOMER_MESSAGES,
} from "../../../lib/quotation-boundary.ts";

test("Phase 6.1.1 — Canonical Quotation Runtime Safety Boundary", async (t) => {
  await t.test("Valid quotation execution passes cleanly with requestId & timestamp", () => {
    const validQuotation = {
      total_payable: 14160,
      taxable_amount: 12000,
      gst_amount: 2160,
      line_items: [
        { sku: "CAM-HIK-2MP-BULLET", name: "Hikvision 2MP Bullet", unit_price: 2000, quantity: 4, total_price: 8000 },
        { sku: "REC-HIK-4CH-DVR", name: "Hikvision 4CH DVR", unit_price: 4000, quantity: 1, total_price: 4000 },
      ],
    };

    const res = executeSafeQuotationCalculation(() => validQuotation, { requestId: "req_test_123" });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.total_payable, 14160);
      assert.equal(res.requestId, "req_test_123");
      assert.ok(res.timestamp);
    }
  });

  await t.test("Invariant 6.1.4: Blocks NaN monetary values", () => {
    const nanQuotation = {
      total_payable: NaN,
      taxable_amount: 10000,
      gst_amount: 1800,
    };

    const res = executeSafeQuotationCalculation(() => nanQuotation);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.code, "CALCULATION_ERROR");
      assert.ok(!res.customerMessage.includes("NaN"), "Must not leak NaN to customer");
      assert.equal(res.customerMessage, DEFAULT_CUSTOMER_MESSAGES.CALCULATION_ERROR);
    }
  });

  await t.test("Invariant 6.1.4: Blocks Infinity monetary values", () => {
    const infQuotation = {
      total_payable: Infinity,
      taxable_amount: 10000,
      gst_amount: 1800,
    };

    const res = executeSafeQuotationCalculation(() => infQuotation);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.code, "CALCULATION_ERROR");
      assert.ok(res.internalMessage.includes("finite number"));
    }
  });

  await t.test("Invariant 6.1.4: Blocks negative customer payable amount", () => {
    const negQuotation = {
      total_payable: -500,
      taxable_amount: -423.73,
      gst_amount: -76.27,
    };

    const res = executeSafeQuotationCalculation(() => negQuotation);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.code, "CALCULATION_ERROR");
      assert.ok(res.internalMessage.includes("strictly positive"));
    }
  });

  await t.test("Invariant 6.1.4: Blocks broken reverse-GST tax reconciliation (drift > ₹0.10)", () => {
    const brokenTaxQuotation = {
      total_payable: 10000,
      taxable_amount: 8000, // 8000 + 1000 = 9000 !== 10000 (drift = 1000)
      gst_amount: 1000,
    };

    const res = executeSafeQuotationCalculation(() => brokenTaxQuotation);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.code, "CALCULATION_ERROR");
      assert.ok(res.internalMessage.includes("Tax reconciliation broken"));
    }
  });

  await t.test("Invariant 6.1.3: Blocks empty Bill of Materials (BOM)", () => {
    const emptyBomQuotation = {
      total_payable: 10000,
      taxable_amount: 8474.58,
      gst_amount: 1525.42,
      line_items: [],
    };

    const res = executeSafeQuotationCalculation(() => emptyBomQuotation);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.code, "CATALOG_ERROR");
      assert.ok(res.internalMessage.includes("empty Bill of Materials"));
    }
  });

  await t.test("Invariant 6.1.3: Blocks silent unpriced unknown SKU (unit_price <= 0 without promo)", () => {
    const silentUnpricedQuotation = {
      total_payable: 10000,
      taxable_amount: 8474.58,
      gst_amount: 1525.42,
      line_items: [
        { sku: "CAM-UNKNOWN-SKU", name: "Ghost Camera", unit_price: 0, quantity: 4, total_price: 0 },
      ],
    };

    const res = executeSafeQuotationCalculation(() => silentUnpricedQuotation);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.code, "CATALOG_ERROR");
      assert.ok(res.internalMessage.includes("zero or negative unit_price"));
    }
  });

  await t.test("Zero [object Object] Invariant: Intercepts raw JS exceptions gracefully", () => {
    const faultyExecution = () => {
      // Simulate raw throw of an object or native exception
      const obj: any = {};
      return obj.nonExistentMethod.execute();
    };

    const res = executeSafeQuotationCalculation(faultyExecution);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.notEqual(res.customerMessage, "[object Object]");
      assert.notEqual(res.internalMessage, "[object Object]");
      assert.ok(res.internalMessage.includes("execute") || res.internalMessage.includes("undefined"));
      assert.equal(res.customerMessage, DEFAULT_CUSTOMER_MESSAGES.INTERNAL_ERROR);
    }
  });

  await t.test("Validation error classification: camera_count <= 0 throws controlled VALIDATION_ERROR", () => {
    const zeroCameraExecution = () => {
      throw new Error("Invalid camera count: camera_count <= 0 is not quotation eligible.");
    };

    const res = executeSafeQuotationCalculation(zeroCameraExecution);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.code, "VALIDATION_ERROR");
      assert.equal(res.customerMessage, DEFAULT_CUSTOMER_MESSAGES.VALIDATION_ERROR);
    }
  });

  await t.test("Infrastructure error classification: Firestore timeout / ECONNREFUSED marked retryable", () => {
    const timeoutExecution = () => {
      throw new Error("Firestore read timeout: Connection unavailable to Google Cloud Firestore (ECONNREFUSED).");
    };

    const res = executeSafeQuotationCalculation(timeoutExecution);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.code, "INFRASTRUCTURE_ERROR");
      assert.equal(res.isRetryable, true);
      assert.equal(res.customerMessage, DEFAULT_CUSTOMER_MESSAGES.INFRASTRUCTURE_ERROR);
    }
  });

  await t.test("Catalog error classification: missing SKU / PRODUCT_NOT_FOUND throws controlled CATALOG_ERROR", () => {
    const missingSkuExecution = () => {
      throw new Error("PRODUCT_NOT_FOUND: No matching 16-channel PoE NVR in catalog.");
    };

    const res = executeSafeQuotationCalculation(missingSkuExecution);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.code, "CATALOG_ERROR");
      assert.equal(res.customerMessage, DEFAULT_CUSTOMER_MESSAGES.CATALOG_ERROR);
    }
  });
});
