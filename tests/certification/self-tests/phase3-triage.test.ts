import { strict as assert } from "node:assert";
import test from "node:test";
import { triageCase, triageReport } from "../reports/discrepancy-triage.ts";
import { parseCredentialEnvironment, mapFirestoreCollections } from "../snapshots/firestore-source-exporter.ts";
import { normalizeProduct } from "../snapshots/snapshot-builder.ts";
import { validateFrozenSnapshot } from "../snapshots/snapshot-validator.ts";
import { buildSkuCrosswalk } from "../fixtures/sku-crosswalk.ts";

const finding = (path: string, kind = "VALUE_MISMATCH", message = "value mismatch", expected: unknown = 1, actual: unknown = 2) => ({ severity: "ERROR" as const, path, kind, expected, actual, message });

test("Phase 3 triage classifies GST and BOM discrepancies independently", () => {
  const result = triageCase({ caseId: "c1", seed: 1, classification: "VALID", status: "FAIL", findings: [finding("$.gst_amount"), finding("$.lines[0].junction_box.quantity", "ARRAY_LENGTH_MISMATCH", "junction box line differs")], duration_ms: 1 });
  assert.deepEqual(result.categories.sort(), ["BOM", "GST"]);
});

test("Phase 3 triage preserves Oracle classification counts", () => {
  const report = triageReport({ version: "2B.8-v1", generated_at: new Date().toISOString(), corpus_seed: 1, cases: [
    { caseId: "a", seed: 1, classification: "VALID", status: "FAIL", findings: [finding("$.gst_amount")], duration_ms: 1 },
    { caseId: "b", seed: 1, classification: "MANUAL_QUOTE", status: "PASS", findings: [], duration_ms: 1 },
    { caseId: "c", seed: 1, classification: "INVALID", status: "FAIL", findings: [finding("$.requiresIndustrialQuote", "VALUE_MISMATCH", "manual quote policy differs")], duration_ms: 1 },
  ], summary: { total: 3, passed: 1, failed: 2, errored: 0, total_cases: 3, pass: 1, fail: 2, error: 0, classifications: { VALID: 1, MANUAL_QUOTE: 1, INVALID: 1 } } }, "fixture.json");
  assert.equal(report.summary.total_cases, 3);
  assert.equal(report.summary.by_oracle_classification.VALID, 1);
  assert.equal(report.summary.by_oracle_classification.MANUAL_QUOTE, 1);
  assert.equal(report.summary.by_oracle_classification.INVALID, 1);
  assert.equal(report.summary.by_category.GST, 1);
  assert.equal(report.summary.by_category.CLASSIFICATION, 1);
});


test("Phase 3 triage classifies BOM from expected and actual payloads", () => {
  const cases = [
    finding("$.lines[0].name", "VALUE_MISMATCH", "line differs", { name: "PVC junction box", quantity: 4 }, { name: "acc_junction_box", quantity: 4 }),
    finding("$.lines[1].sku", "VALUE_MISMATCH", "line differs", "connector_bnc_dc", "connector_bnc_dc-alt"),
    finding("$.lines[2].sku", "VALUE_MISMATCH", "line differs", "SMPS-4CH", "POWER_SUPPLY-4CH"),
    finding("$.lines[3].sku", "VALUE_MISMATCH", "line differs", "CAT6-305M-CABLE", "CAT6-305M-CABLE"),
  ];
  const result = triageCase({ caseId: "bom", seed: 1, classification: "VALID", status: "FAIL", findings: cases, duration_ms: 1 });
  assert.deepEqual(result.categories, ["BOM"]);
});

test("Phase 3 Firestore mapping keeps is_addon products in addons and explicit addon wins", () => {
  const mapped = mapFirestoreCollections({
    products: [
      { id: "P1", data: { sku: "P1", is_addon: false } },
      { id: "A1", data: { sku: "A1", is_addon: true, name: "product-addon" } },
    ],
    addons: [{ id: "A1", data: { sku: "A1", is_addon: true, name: "explicit-addon" } }],
    addon_rules: [],
    geo_pricing_rules: [{ id: "G1", data: { rule: "geo" } }],
    geo_rules: [{ id: "G2", data: { rule: "override" } }],
    recommendation_rules: [{ id: "R1", data: { recommendation: true } }],
    coverage_zones: [{ id: "Z1", data: { pincode: "302001" } }],
    promoters: [],
    settings: [{ id: "app_config", data: { settings: { gst: 18, source: "settings/app_config" } } }, { id: "kill_switch", data: { enabled: true } }],
    app_config: [{ id: "app_config", data: { gst: 99, explicit: true } }],
  });
  assert.equal(mapped.products.some((x) => x.id === "A1"), false);
  assert.equal(mapped.addons.filter((x) => x.id === "A1").length, 1);
  assert.equal(mapped.addons.find((x) => x.id === "A1")?.name, "explicit-addon");
  assert.equal(mapped.geo_rules.length, 4);
  assert.equal(mapped.app_settings.gst, 18);
  assert.equal(mapped.app_settings.source, "settings/app_config");
  assert.equal((mapped.app_settings as any).enabled, undefined);
  assert.equal((mapped.app_settings as any).explicit, undefined);
});

test("Phase 3 split Firebase credential parsing supports literal\\n replacement", () => {
  const credentials = parseCredentialEnvironment({
    FIREBASE_PROJECT_ID: "secure-easy",
    FIREBASE_CLIENT_EMAIL: "firebase-adminsdk@example.com",
    FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n",
  });
  assert.deepEqual(credentials, {
    projectId: "secure-easy",
    clientEmail: "firebase-adminsdk@example.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n",
  });
});


test("Phase 3 id-only Firestore products normalize SKU from document id through validation", () => {
  const mapped = mapFirestoreCollections({ products: [{ id: "CAM-ID-001", data: { display_name: "Camera", is_active: true, is_quotation_eligible: true, base_cost: 100, unit_price: 115 } }], addons: [] });
  assert.equal(mapped.products[0]?.sku, "CAM-ID-001");
  const product = normalizeProduct(mapped.products[0]!, false);
  const context = { products: [product], addons: [], addon_rules: [], geo_rules: [], promoters: [], app_settings: {}, sku_crosswalk: {}, manifest: {} } as never;
  const report = validateFrozenSnapshot(context, [product]);
  assert.equal(report.sku_crosswalk?.entries[0]?.status, "MATCHED");
});

test("Phase 3 SKU crosswalk uses production margin rounding for IEEE-754 .5 cases", () => {
  const result = buildSkuCrosswalk(
    [{ id: "CAM-3450", sku: "CAM-3450", base_cost: 3450, unit_price: 3968 } as never],
    [{ id: "CAM-3450", sku: "CAM-3450", base_cost: 3450, margin_percentage: 15, unit_price: 3968 } as never],
  );
  assert.equal(result.entries[0]?.status, "MATCHED");
  assert.equal(result.entries[0]?.expected_unit_price, 3968);
});

test("Phase 3 exporter redaction removes secrets and promoter PII while preserving certification fields", () => {
  const mapped = mapFirestoreCollections({
    products: [],
    addons: [],
    promoters: [{ id: "PROMO1", data: { name: "Promoter Name", business_name: "Promoter Business", email: "a@b.test", mobile_number: "9999999999", phone: "8888888888", address: "secret address", coordinates: { latitude: 26.9, longitude: 75.8 }, follow_up_notes: "call later", commission_percent: 10, discount_percent: 5 } }],
    settings: [{ id: "app_config", data: { settings: { gst: 18, gemini_api_keys: ["LIVE-KEY"], nested: { api_key: "LIVE-NESTED" }, site_preparation: {}, commission_percent: 10 } } }],
  });
  assert.equal((mapped.app_settings as any).gemini_api_keys, undefined);
  assert.equal((mapped.app_settings as any).nested, undefined);
  assert.deepEqual((mapped.app_settings as any).site_preparation, {});
  assert.equal(mapped.app_settings.gst, 18);
  assert.equal(mapped.app_settings.commission_percent, 10);
  const promoter = mapped.promoters[0]!;
  for (const key of ["name", "business_name", "email", "mobile_number", "phone", "address", "coordinates", "follow_up_notes"]) assert.equal(promoter[key], undefined);
  assert.equal(promoter.commission_percent, 10);
  assert.equal(promoter.discount_percent, 5);
});
