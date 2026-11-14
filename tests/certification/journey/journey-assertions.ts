/**
 * @file tests/certification/journey/journey-assertions.ts
 * @description Phase 7.1 Independent Gate Assertions (Gates 01 to 18).
 * Modular assertion functions ensuring every checkpoint of the customer journey is independently testable.
 */

import assert from "node:assert/strict";
import type { CCTVRequirement, QuoteDelivery } from "../../../types";
import type { SafeQuotationExecution, SafeQuotationSuccess } from "../../../lib/quotation-boundary";
import type { StoredQuoteRecord } from "./journey-test-context";
import { calculateGstBreakup } from "../../../lib/pdf/pdf-helpers";
import { classifyItem } from "../../../lib/quotation-profit";

// Banned 3-tier marketing labels
const BANNED_TIER_WORDS = [
  "plan 1", "plan 2", "plan 3",
  "value", "pro", "premium", "elite", "essential",
  "smart plus", "pro elite"
];

export function assertGate01CanonicalRequirement(req: CCTVRequirement): void {
  assert.ok(req, "Requirement must be non-null");
  assert.ok(typeof req.camera_count === "number" && req.camera_count > 0, "camera_count must be > 0");
  assert.ok(req.brand, "brand must be defined");
  assert.ok(req.resolution, "resolution must be defined");
  assert.ok(req.technology, "technology must be defined");
  assert.ok(typeof req.storage_retention_days === "number", "storage_retention_days must be defined");
}

export function assertGate02Calculation(quote: QuoteDelivery): void {
  assert.ok(quote, "QuoteDelivery must be returned");
  assert.ok(typeof quote.total_payable === "number" && quote.total_payable > 0, "total_payable must be > 0");
  assert.ok(Array.isArray(quote.items) && quote.items.length > 0, "items array must be non-empty");
  assert.ok(typeof quote.net_taxable_amount === "number", "net_taxable_amount must be a number");
  assert.ok(typeof quote.gst_amount === "number", "gst_amount must be a number");
}

export function assertGate03SafeExecution(safeExec: SafeQuotationExecution<any>): asserts safeExec is SafeQuotationSuccess<any> {
  assert.equal(safeExec.success, true, "Safe quotation execution must succeed");
  assert.ok(safeExec.requestId, "Safe execution must contain requestId");
  assert.ok(safeExec.timestamp, "Safe execution must contain timestamp");
}

export function assertGate04PackageAttributes(title: string, req: CCTVRequirement): void {
  const lower = title.toLowerCase();
  for (const banned of BANNED_TIER_WORDS) {
    assert.equal(
      lower.includes(banned),
      false,
      `Package title "${title}" violates permanent ban on 3-tier marketing label: "${banned}"`
    );
  }
  // Must contain camera count, brand, and resolution
  assert.ok(title.includes(String(req.camera_count)), "Package title must reflect camera count");
  assert.ok(title.toUpperCase().includes(req.brand.toUpperCase()), "Package title must reflect brand");
  assert.ok(title.toUpperCase().includes(req.resolution.toUpperCase()), "Package title must reflect resolution");
}

export function assertGate05BOMConsistency(items: any[], req: CCTVRequirement): void {
  assert.ok(Array.isArray(items) && items.length > 0, "BOM items must exist");
  const cameraItems = items.filter((it: any) => {
    const classification = classifyItem(it.product_id, it.display_name, it.category);
    return classification.category === "camera";
  });
  assert.ok(cameraItems.length > 0, "BOM must contain camera items");
  const totalBOMCameras = cameraItems.reduce((acc: number, it: any) => acc + (it.qty || it.quantity || 1), 0);
  assert.equal(totalBOMCameras, req.camera_count, "BOM camera quantities must match requirement camera count");
}

export function assertGate06GSTReconciliation(quote: { total_payable: number; net_taxable_amount: number; gst_amount: number }): void {
  const gross = quote.total_payable;
  const taxable = quote.net_taxable_amount;
  const gst = quote.gst_amount;

  const sum = Math.round((taxable + gst) * 100) / 100;
  const drift = Math.abs(gross - sum);
  assert.ok(drift <= 0.10, `GST reconciliation drift ₹${drift.toFixed(2)} exceeds ₹0.10 limit`);

  const reverseTaxable = gross / 1.18;
  const reverseGst = gross - reverseTaxable;
  assert.ok(Math.abs(taxable - reverseTaxable) <= 1.0, "Taxable base must match gross / 1.18 within rounding");
  assert.ok(Math.abs(gst - reverseGst) <= 1.0, "GST must match gross - taxable within rounding");
}

export function assertGate07QuoteId(quoteId: string): void {
  assert.ok(quoteId && typeof quoteId === "string", "quoteId must be a non-empty string");
  assert.ok(quoteId.length >= 8, "quoteId must have sufficient entropy");
}

export function assertGate08SnapshotFields(snapshot: StoredQuoteRecord): void {
  assert.ok(snapshot.id, "Snapshot must have id");
  assert.ok(snapshot.leadId, "Snapshot must have leadId");
  assert.ok(Array.isArray(snapshot.configuration_snapshot), "Snapshot must have configuration_snapshot");
  assert.ok(snapshot.configuration_snapshot.length > 0, "configuration_snapshot must not be empty");
  assert.ok(snapshot.request_id, "Snapshot must record request_id");
  assert.ok(snapshot.calculation_fingerprint, "Snapshot must record calculation_fingerprint");
  assert.ok(snapshot.catalog_snapshot_hash, "Snapshot must record catalog_snapshot_hash");
  assert.ok(snapshot.created_at, "Snapshot must have created_at timestamp");
  assert.equal(snapshot.version, 1, "Original quote snapshot must have version 1");
}

export function assertGate09NonDestructiveEdit(origQuote: StoredQuoteRecord, editedQuote: StoredQuoteRecord): void {
  assert.notEqual(origQuote.id, editedQuote.id, "Edited quote must have a distinct quoteId");
  assert.notEqual(origQuote.total_payable, editedQuote.total_payable, "Edited requirement must produce a different price");
  assert.notEqual(origQuote.calculation_fingerprint, editedQuote.calculation_fingerprint, "Fingerprints must differ");
}

export function assertGate10ReloadImmutability(
  originalSnapshot: StoredQuoteRecord,
  reloadedSnapshot: StoredQuoteRecord,
  catalogMutated: boolean
): void {
  assert.ok(catalogMutated, "Catalog must be mutated at T2 to test historical immutability");
  assert.equal(reloadedSnapshot.total_payable, originalSnapshot.total_payable, "Reloaded quote total must match original");
  assert.equal(reloadedSnapshot.net_taxable_amount, originalSnapshot.net_taxable_amount, "Reloaded taxable base must match original");
  assert.equal(reloadedSnapshot.gst_amount, originalSnapshot.gst_amount, "Reloaded GST must match original");
  assert.equal(reloadedSnapshot.calculation_fingerprint, originalSnapshot.calculation_fingerprint, "Reloaded fingerprint must match original");
  assert.deepEqual(reloadedSnapshot.configuration_snapshot, originalSnapshot.configuration_snapshot, "Reloaded BOM must match original");
}

export function assertGate11DirectQuoteUrl(resolution: { type: string; quoteData?: any }): void {
  assert.equal(resolution.type, "QUOTE_SNAPSHOT", "Direct /quote/[quoteId] must resolve to QUOTE_SNAPSHOT");
  assert.ok(resolution.quoteData, "Resolved quote snapshot must exist");
}

export function assertGate12ShareUrl(shareUrl: string, quoteId: string): void {
  assert.ok(shareUrl.includes(quoteId), "Share URL must contain quoteId");
  assert.ok(shareUrl.startsWith("/quote/") || shareUrl.startsWith("http"), "Share URL must be valid path or URL");
}

export function assertGate13PDFRender(pdfValues: { grossTotal: number; taxableBase: number; gstTotal: number }, snapshot: StoredQuoteRecord): void {
  assert.equal(pdfValues.grossTotal, snapshot.total_payable, "PDF Gross Total must strictly equal stored total_payable");
  assert.equal(pdfValues.taxableBase, Math.round(snapshot.net_taxable_amount), "PDF Taxable Base must strictly equal stored net_taxable");
}

export function assertGate14PDFGST(pdfValues: { grossTotal: number; taxableBase: number; gstTotal: number; cgst: number; sgst: number }): void {
  const sum = pdfValues.taxableBase + pdfValues.cgst + pdfValues.sgst;
  const drift = Math.abs(pdfValues.grossTotal - sum);
  assert.ok(drift <= 0.10, `PDF GST breakdown drift ₹${drift} exceeds ₹0.10`);
  assert.equal(pdfValues.cgst, pdfValues.sgst, "CGST and SGST must be equal for intra-state standard");
}

export function assertGate15RequestCorrelation(requestId: string, snapshot: StoredQuoteRecord, telemetryEvent?: any): void {
  assert.ok(requestId.length >= 6, "requestId must have sufficient length");
  assert.equal(snapshot.request_id, requestId, "Snapshot request_id must equal triggering requestId");
  if (telemetryEvent) {
    assert.equal(telemetryEvent.requestId, requestId, "Telemetry requestId must match triggering requestId");
  }
}

export function assertGate16CalculationFingerprint(fingerprint: string, req: CCTVRequirement, catalogHash: string): void {
  assert.ok(fingerprint && fingerprint.length === 64, "Calculation fingerprint must be a 64-char SHA-256 hex string");
  assert.ok(catalogHash && catalogHash.length === 64, "Catalog hash must be a 64-char SHA-256 hex string");
}

export function assertGate17Telemetry(event: any, expectedQuoteId: string): void {
  assert.ok(event, "Telemetry event must be emitted");
  assert.equal(event.quoteId, expectedQuoteId, "Telemetry event must bind to quoteId");
  assert.equal(event.event, "quotation.calculation.completed", "Event must be quotation.calculation.completed");
  assert.equal(event.result.success, true, "Telemetry result must be success");
  // Ensure no PII in requirement
  assert.equal(event.requirement.customer_name, undefined, "Telemetry requirement must exclude customer name");
  assert.equal(event.requirement.mobile_number, undefined, "Telemetry requirement must exclude customer phone");
}

export function assertGate18CustomerSafeFailure(failedExecution: SafeQuotationExecution<any>): void {
  assert.equal(failedExecution.success, false, "Execution must fail on adversarial invalid input");
  assert.ok(failedExecution.code, "Error code must be categorized");
  assert.ok(failedExecution.customerMessage, "Customer message must be defined");
  
  // Must NOT leak internal database paths, stack traces, or [object Object]
  const msg = failedExecution.customerMessage;
  assert.equal(msg.includes("[object Object]"), false, "Customer message must not contain [object Object]");
  assert.equal(msg.includes("Firestore"), false, "Customer message must not expose Firestore internals");
  assert.equal(msg.includes("node_modules"), false, "Customer message must not expose stack traces");
  assert.equal(msg.includes(".ts"), false, "Customer message must not expose file paths");
}
