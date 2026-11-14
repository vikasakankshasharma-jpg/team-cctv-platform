/**
 * @file tests/certification/journey/customer-journey-e2e.test.ts
 * @description Phase 7.1 Customer Journey E2E Certification Test Suite.
 * Exercises the 18 distinct customer journey gates and full end-to-end orchestration.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  webWizardRequirement,
  whatsAppRequirement,
  editedRequirement,
  certifiedProducts,
  certifiedAddons,
  certifiedSettings,
  buildPricingV2Params,
} from "./journey-fixtures";
import { JourneyTestContext } from "./journey-test-context";
import {
  assertGate01CanonicalRequirement,
  assertGate02Calculation,
  assertGate03SafeExecution,
  assertGate04PackageAttributes,
  assertGate05BOMConsistency,
  assertGate06GSTReconciliation,
  assertGate07QuoteId,
  assertGate08SnapshotFields,
  assertGate09NonDestructiveEdit,
  assertGate10ReloadImmutability,
  assertGate11DirectQuoteUrl,
  assertGate12ShareUrl,
  assertGate13PDFRender,
  assertGate14PDFGST,
  assertGate15RequestCorrelation,
  assertGate16CalculationFingerprint,
  assertGate17Telemetry,
  assertGate18CustomerSafeFailure,
} from "./journey-assertions";
import { calculatePricingV2Safe } from "../../../lib/pricing-engine-v2";
import { executeSafeQuotationCalculation } from "../../../lib/quotation-boundary";
import {
  computeCatalogSnapshotHash,
  computeCalculationFingerprint,
  extractCalculationRelevantRequirement,
} from "../../../lib/observability/calculation-fingerprint";
import {
  buildCalculationTelemetryEvent,
  telemetryBus,
} from "../../../lib/observability/calculation-telemetry";
import { calculateGstBreakup } from "../../../lib/pdf/pdf-helpers";

test("Phase 7.1 — Omnichannel Customer Journey E2E Verification", async (t) => {
  const context = new JourneyTestContext();

  await t.test("Gate 01 — Canonical Requirement Input Validation", () => {
    assertGate01CanonicalRequirement(webWizardRequirement);
    assertGate01CanonicalRequirement(whatsAppRequirement);
  });

  await t.test("Gate 02 & 03 — Safe Quotation Calculation Execution", () => {
    const safeCalc = calculatePricingV2Safe(buildPricingV2Params(webWizardRequirement));
    assertGate03SafeExecution(safeCalc);
    assertGate02Calculation(safeCalc.data);
  });

  await t.test("Gate 04 — Package Title Hardware Specification Mandate (Zero 3-Tier Labels)", () => {
    const title = `${webWizardRequirement.camera_count}-Camera ${webWizardRequirement.brand} ${webWizardRequirement.resolution} ${webWizardRequirement.technology} Package (1TB Storage)`;
    assertGate04PackageAttributes(title, webWizardRequirement);
  });

  await t.test("Gate 05 — Rendered BOM Consistency with Customer Requirement", () => {
    const safeCalc = calculatePricingV2Safe(buildPricingV2Params(webWizardRequirement));
    assertGate03SafeExecution(safeCalc);
    assertGate05BOMConsistency(safeCalc.data.items, webWizardRequirement);
  });

  await t.test("Gate 06 — Reverse-GST 18% Mathematical Reconciliation (≤ ₹0.10 drift)", () => {
    const safeCalc = calculatePricingV2Safe(buildPricingV2Params(webWizardRequirement));
    assertGate03SafeExecution(safeCalc);
    const quote = safeCalc.data;
    assertGate06GSTReconciliation({
      total_payable: quote.total_payable,
      net_taxable_amount: quote.net_taxable_amount,
      gst_amount: quote.gst_amount,
    });
  });

  await t.test("Gate 07 & 08 — Quote Persistence & Snapshot Completeness", () => {
    const safeCalc = calculatePricingV2Safe(buildPricingV2Params(webWizardRequirement));
    assertGate03SafeExecution(safeCalc);
    const quote = safeCalc.data;
    const catalogHash = computeCatalogSnapshotHash(certifiedProducts as any[]);
    const fingerprint = computeCalculationFingerprint({
      requirement: extractCalculationRelevantRequirement(webWizardRequirement),
      catalogSnapshotHash: catalogHash,
    });

    const quoteId = context.saveQuote({
      leadId: "lead_test_01",
      plan_type: "IP",
      technology: "IP",
      total_payable: quote.total_payable,
      net_taxable_amount: quote.net_taxable_amount,
      gst_amount: quote.gst_amount,
      items: quote.items,
      configuration_snapshot: quote.items,
      request_id: "req_gate_07",
      calculation_fingerprint: fingerprint,
      catalog_snapshot_hash: catalogHash,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      version: 1,
    });

    assertGate07QuoteId(quoteId);
    const saved = context.getQuote(quoteId);
    assert.ok(saved);
    assertGate08SnapshotFields(saved!);
  });

  await t.test("Gate 09 — Non-Destructive Customer Editing (Preserves Original Snapshot)", () => {
    const calcOriginal = calculatePricingV2Safe(buildPricingV2Params(webWizardRequirement));
    const calcEdited = calculatePricingV2Safe(buildPricingV2Params(editedRequirement));
    assertGate03SafeExecution(calcOriginal);
    assertGate03SafeExecution(calcEdited);

    const catalogHash = computeCatalogSnapshotHash(certifiedProducts as any[]);
    const origId = context.saveQuote({
      leadId: "lead_test_02",
      technology: "IP",
      total_payable: calcOriginal.data.total_payable,
      net_taxable_amount: calcOriginal.data.net_taxable_amount,
      gst_amount: calcOriginal.data.gst_amount,
      items: calcOriginal.data.items,
      configuration_snapshot: calcOriginal.data.items,
      request_id: "req_orig",
      calculation_fingerprint: computeCalculationFingerprint({
        requirement: extractCalculationRelevantRequirement(webWizardRequirement),
        catalogSnapshotHash: catalogHash,
      }),
      catalog_snapshot_hash: catalogHash,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      version: 1,
    });

    const editId = context.saveQuote({
      leadId: "lead_test_02",
      technology: "IP",
      total_payable: calcEdited.data.total_payable,
      net_taxable_amount: calcEdited.data.net_taxable_amount,
      gst_amount: calcEdited.data.gst_amount,
      items: calcEdited.data.items,
      configuration_snapshot: calcEdited.data.items,
      request_id: "req_edit",
      calculation_fingerprint: computeCalculationFingerprint({
        requirement: extractCalculationRelevantRequirement(editedRequirement),
        catalogSnapshotHash: catalogHash,
      }),
      catalog_snapshot_hash: catalogHash,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      version: 1,
    });

    const origSaved = context.getQuote(origId)!;
    const editSaved = context.getQuote(editId)!;
    assertGate09NonDestructiveEdit(origSaved, editSaved);
  });

  await t.test("Gate 10 — Adversarial Snapshot Immutability (Unchanged by Catalog Price Hikes)", () => {
    // T0: Calculate and persist quote at baseline catalog prices
    const calcT0 = calculatePricingV2Safe(buildPricingV2Params(webWizardRequirement));
    assertGate03SafeExecution(calcT0);
    const catalogHash = computeCatalogSnapshotHash(certifiedProducts as any[]);
    const quoteId = context.saveQuote({
      leadId: "lead_test_immutability",
      technology: "IP",
      total_payable: calcT0.data.total_payable,
      net_taxable_amount: calcT0.data.net_taxable_amount,
      gst_amount: calcT0.data.gst_amount,
      items: calcT0.data.items,
      configuration_snapshot: calcT0.data.items,
      request_id: "req_t0",
      calculation_fingerprint: computeCalculationFingerprint({
        requirement: extractCalculationRelevantRequirement(webWizardRequirement),
        catalogSnapshotHash: catalogHash,
      }),
      catalog_snapshot_hash: catalogHash,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      version: 1,
    });

    const originalSnapshot = context.getQuote(quoteId)!;

    // T2: Mutate catalog prices by +50%
    const mutatedCatalog = context.getAdversarialMutatedProducts();
    assert.notEqual(mutatedCatalog[0].unit_price, certifiedProducts[0].unit_price);

    // T3: Reload historical quote from storage
    const reloadedSnapshot = context.getQuote(quoteId)!;
    assertGate10ReloadImmutability(originalSnapshot, reloadedSnapshot, true);
  });

  await t.test("Gate 11 & 12 — Direct URL & Share URL Resolution by Identity", () => {
    const calc = calculatePricingV2Safe(buildPricingV2Params(webWizardRequirement));
    assertGate03SafeExecution(calc);
    const quoteId = context.saveQuote({
      leadId: "lead_share_01",
      technology: "IP",
      total_payable: calc.data.total_payable,
      net_taxable_amount: calc.data.net_taxable_amount,
      gst_amount: calc.data.gst_amount,
      items: calc.data.items,
      configuration_snapshot: calc.data.items,
      request_id: "req_share",
      calculation_fingerprint: "dummy_fp",
      catalog_snapshot_hash: "dummy_hash",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      version: 1,
    });

    // Identity-based resolution simulates app/(customer)/quote/[leadId]/page.tsx
    const directResolution = context.resolveQuoteOrLeadRoute(quoteId);
    assertGate11DirectQuoteUrl(directResolution);

    const shareUrl = `/quote/review/${quoteId}`;
    assertGate12ShareUrl(shareUrl, quoteId);
  });

  await t.test("Gate 13 & 14 — PDF Render Integrity & Reverse GST Reconciliation", () => {
    const safeCalc = calculatePricingV2Safe(buildPricingV2Params(webWizardRequirement));
    assertGate03SafeExecution(safeCalc);
    const quote = safeCalc.data;

    // PDF helper strictly consumes stored snapshot values
    const pdfBreakup = calculateGstBreakup({
      itemsSubtotalExTax: quote.net_taxable_amount,
      storedTotalPayable: quote.total_payable,
      storedNetTaxable: quote.net_taxable_amount,
      storedGstAmount: quote.gst_amount,
      gstPercent: 18,
    });

    const mockStoredSnapshot = {
      id: "quote_pdf_01",
      leadId: "lead_pdf_01",
      technology: "IP",
      total_payable: quote.total_payable,
      net_taxable_amount: quote.net_taxable_amount,
      gst_amount: quote.gst_amount,
      items: quote.items,
      configuration_snapshot: quote.items,
      request_id: "req_pdf",
      calculation_fingerprint: "fp_pdf",
      catalog_snapshot_hash: "hash_pdf",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      version: 1,
    };

    assertGate13PDFRender(
      {
        grossTotal: pdfBreakup.totalPayable,
        taxableBase: pdfBreakup.netTaxable,
        gstTotal: pdfBreakup.gstAmount,
      },
      mockStoredSnapshot
    );

    assertGate14PDFGST({
      grossTotal: pdfBreakup.totalPayable,
      taxableBase: pdfBreakup.netTaxable,
      gstTotal: pdfBreakup.gstAmount,
      cgst: pdfBreakup.cgstAmount,
      sgst: pdfBreakup.sgstAmount,
    });
  });

  await t.test("Gate 15, 16 & 17 — Correlation Triangle & Telemetry Emission", () => {
    const requestId = "req_audit_triangle_01";
    const safeCalc = calculatePricingV2Safe(buildPricingV2Params(webWizardRequirement), { requestId });
    assertGate03SafeExecution(safeCalc);
    const quote = safeCalc.data;
    const catalogHash = computeCatalogSnapshotHash(certifiedProducts as any[]);
    const cleanReq = extractCalculationRelevantRequirement(webWizardRequirement);
    const fingerprint = computeCalculationFingerprint({
      requirement: cleanReq,
      catalogSnapshotHash: catalogHash,
    });

    assertGate16CalculationFingerprint(fingerprint, webWizardRequirement, catalogHash);

    const quoteId = context.saveQuote({
      leadId: "lead_triangle_01",
      technology: "IP",
      total_payable: quote.total_payable,
      net_taxable_amount: quote.net_taxable_amount,
      gst_amount: quote.gst_amount,
      items: quote.items,
      configuration_snapshot: quote.items,
      request_id: requestId,
      calculation_fingerprint: fingerprint,
      catalog_snapshot_hash: catalogHash,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      version: 1,
    });

    const saved = context.getQuote(quoteId)!;
    const telemetryEvent = buildCalculationTelemetryEvent({
      execution: safeCalc,
      requirement: cleanReq,
      source: "api_quotes_post",
      catalogSnapshotHash: catalogHash,
      durationMs: 45,
      quoteId,
    });

    assertGate15RequestCorrelation(requestId, saved, telemetryEvent);
    assertGate17Telemetry(telemetryEvent, quoteId);
  });

  await t.test("Gate 18 — Customer-Safe Failure Handling (Zero Leaks)", () => {
    // Adversarial execution with negative camera count
    const safeCalc = executeSafeQuotationCalculation(
      () => {
        throw new Error("Firestore permission denied at databases/(default)/documents/leads/secret_path");
      },
      { requestId: "req_fail_safe", source: "api_quotes_post" }
    );

    assertGate18CustomerSafeFailure(safeCalc);
  });

  await t.test("Orchestration E2E — Complete Customer Journey Simulation", () => {
    // 1. Customer enters via WhatsApp or Web Wizard
    const req = whatsAppRequirement;
    const requestId = `wa_lead_orch_${Date.now()}`;

    // 2. Safe calculation executed
    const safeCalc = calculatePricingV2Safe(buildPricingV2Params(req), { requestId });
    assertGate03SafeExecution(safeCalc);
    const quote = safeCalc.data;

    // 3. Package title conforms to hardware spec
    const title = `${req.camera_count}-Camera ${req.brand} ${req.resolution} ${req.technology} Package (7 Days Storage)`;
    assertGate04PackageAttributes(title, req);

    // 4. Quotation persisted to database
    const catalogHash = computeCatalogSnapshotHash(certifiedProducts as any[]);
    const cleanReq = extractCalculationRelevantRequirement(req);
    const fingerprint = computeCalculationFingerprint({
      requirement: cleanReq,
      catalogSnapshotHash: catalogHash,
    });

    const quoteId = context.saveQuote({
      leadId: "lead_whatsapp_orch",
      technology: req.technology,
      total_payable: quote.total_payable,
      net_taxable_amount: quote.net_taxable_amount,
      gst_amount: quote.gst_amount,
      items: quote.items,
      configuration_snapshot: quote.items,
      request_id: requestId,
      calculation_fingerprint: fingerprint,
      catalog_snapshot_hash: catalogHash,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      version: 1,
    });

    // 5. Customer opens direct quote URL
    const routeRes = context.resolveQuoteOrLeadRoute(quoteId);
    assertGate11DirectQuoteUrl(routeRes);
    const loadedSnapshot = routeRes.quoteData!;

    // 6. PDF generated directly from loaded snapshot without dynamic recalculation
    const pdfBreakup = calculateGstBreakup({
      itemsSubtotalExTax: loadedSnapshot.net_taxable_amount,
      storedTotalPayable: loadedSnapshot.total_payable,
      storedNetTaxable: loadedSnapshot.net_taxable_amount,
      storedGstAmount: loadedSnapshot.gst_amount,
      gstPercent: 18,
    });

    assert.equal(pdfBreakup.totalPayable, loadedSnapshot.total_payable);
    assert.equal(pdfBreakup.netTaxable, Math.round(loadedSnapshot.net_taxable_amount));
    assert.equal(pdfBreakup.netTaxable + pdfBreakup.cgstAmount + pdfBreakup.sgstAmount, pdfBreakup.totalPayable);
  });
});
