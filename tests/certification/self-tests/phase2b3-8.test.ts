import { strict as assert } from "node:assert";
import test from "node:test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { FrozenContext } from "../types/certification.ts";
import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import { runProductionAdapter } from "../production/production-runner.ts";
import { createPricingEngineV2Adapter, createVariantGeneratorAdapter, createQuotationProfitAdapter, createQuoteGenerateRouteAdapter, createBuildCalculateRouteAdapter, createWhatsAppQuoteDispatchAdapter } from "../production/default-adapters.ts";
import { generateCorpus } from "../corpus/deterministic-corpus.ts";
import { shrinkRequirement } from "../corpus/shrinker.ts";
import { compareOracleVsProduction } from "../comparator/semantic-comparator.ts";
import { runOracle } from "../oracle/index.ts";

const repoRoot = resolve(process.env.CERT_REPO_ROOT ?? process.cwd());
const hasRepo = existsSync(resolve(repoRoot, "lib")) && existsSync(resolve(repoRoot, "app"));
const skipReason = "real secure-easy repo not present; integration smoke is intentionally skipped";

const snapshot = {
  products: [
    { id: "CAM-001", sku: "CAM-001", category: "cctv_camera", form_factor: "dome", ip_rating: "Indoor", technologies: ["HD"], technology: "HD", resolution: "2MP", display_name: "2MP HD Dome Camera", brand: "TestBrand", unit_price: 118, base_cost: 100, is_active: true, is_deleted: false, is_quotation_eligible: true },
    { id: "DVR-001", sku: "DVR-001", category: "recorder", technology: "HD", channel_capacity: 4, channels: 4, max_supported_mp: 5, display_name: "4 Channel HD DVR", brand: "TestBrand", unit_price: 1180, base_cost: 1000, is_active: true, is_deleted: false, is_quotation_eligible: true },
    { id: "HDD-001", sku: "HDD-001", category: "storage", storage_type: "Hard Disk", capacity_tb: 1, capacity: 1, display_name: "1TB Surveillance Hard Disk", brand: "TestBrand", unit_price: 3540, base_cost: 3000, is_active: true, is_deleted: false, is_quotation_eligible: true },
    { id: "PWR-001", sku: "PWR-001", category: "power_device", technology: "HD", channel_capacity: 4, display_name: "4 Channel SMPS", brand: "TestBrand", unit_price: 236, base_cost: 200, is_active: true, is_deleted: false, is_quotation_eligible: true },
  ],
  addons: [], addon_rules: [], geo_rules: [], promoters: [], app_settings: { gst_rate: 18 }, sku_crosswalk: {}, manifest: {},
} as unknown as FrozenContext;

const requirement = {
  technology: "HD", camera_count: 1, recording_days: 0, cabling_mode: "all_new", cable_length_meters: 10,
  requested_features: [], installation_preference: "diy", cameras: [{ technology: "HD", count: 1, resolution: "2MP", requested_features: [] }],
} as CanonicalRequirement;


test("2B.3 corpus generation produces valid canonical cases and multi-bucket coverage", () => {
  const corpus = generateCorpus(20261111, 25);
  assert.equal(corpus.length, 25);
  assert.ok(corpus.every((c) => c.requirement.cable_length_meters !== undefined));
  assert.ok(corpus.some((c) => Array.isArray(c.requirement.cameras) && c.requirement.cameras.length >= 2));
});

test("2B.3 shrinker reruns an async failure predicate and removes forbidden legacy cable key", async () => {
  const original = generateCorpus(20261111, 1)[0].requirement;
  let calls = 0;
  const minimal = await shrinkRequirement(original, async (candidate) => { calls += 1; return Number(candidate.camera_count ?? 0) <= 1; });
  assert.ok(calls > 0);
  assert.equal((minimal as any).total_cable_length_meters, undefined);
});

test("2B.3 semantic comparator maps Oracle and calculatePricing mirror keys", () => {
  const oracle = { lines: [{ sku: "CAM-001", quantity: 1, unit_price: 118, gross: 118 }], subtotal_gross: 118, taxable_total: 100, gst_total: 18, grand_total: 118, manual_quote: false };
  const production = { calculatePricing: { items: [{ sku: "CAM-001", quantity: 1, unit_price: 118, total: 118 }], gross_subtotal: 118, net_taxable_amount: 100, gst_amount: 18, total_payable: 118, requiresIndustrialQuote: false } };
  const comparison = compareOracleVsProduction(oracle, production);
  assert.equal(comparison.equal, true, JSON.stringify(comparison.findings));
  assert.ok(Array.isArray((comparison.normalizedOracle as any).lines));
  assert.ok(Array.isArray((comparison.normalizedProduction as any).lines));
});

function integration(name: string, adapter: any) {
  test(name, { skip: hasRepo ? false : skipReason }, async () => {
    const result = await runProductionAdapter(adapter, requirement, { repoRoot, snapshot, caseId: `smoke-${name}` });
    assert.equal(result.ok, true, result.error?.message ?? "production adapter failed");
    const value: any = result.value;
    if (name.includes("pricing-engine-v2")) assert.ok(Number(value?.total_payable ?? value?.grand_total ?? 0) > 0, "pricing-engine-v2 returned a zero payable quote");
    if (name.includes("variant-generator")) assert.ok(Number(value?.totalVariationsCount ?? 0) > 0, "variant-generator returned zero variations");
    if (name.includes("quotation-profit")) assert.ok(Number(value?.overall?.total_payable ?? value?.total_payable ?? 0) > 0, "quotation-profit returned zero payable");
    if (name.includes("quote-generate")) assert.equal(value?.status, 200, `quote-generate HTTP ${value?.status}`);
    if (name.includes("quote-generate")) assert.ok(Object.keys(value?.body?.plans ?? {}).length > 0, "quote-generate returned no plans");
    if (name.includes("build-calculate")) { assert.equal(value?.status, 200, `build-calculate HTTP ${value?.status}`); assert.equal(value?.body?.success, true, "build-calculate returned success=false"); }
    if (name.includes("WhatsApp")) {
      assert.ok(Array.isArray(value?.outboundPayloads) && value.outboundPayloads.length > 0, "WhatsApp emitted no outbound payloads");
      assert.doesNotMatch(JSON.stringify(value.outboundPayloads), /no matching setup found/i, "WhatsApp fell back to no-match response");
    }
  });
}

integration("2B.3 pricing-engine-v2 adapter executes real calculatePricingV2", createPricingEngineV2Adapter());
integration("2B.3 variant-generator adapter executes real generateAllCatalogVariations", createVariantGeneratorAdapter());
integration("2B.3 quotation-profit adapter executes real calculateQuotationProfitBreakup", createQuotationProfitAdapter());
integration("2B.3 quote-generate route executes real POST", createQuoteGenerateRouteAdapter());
integration("2B.3 build-calculate route executes real POST", createBuildCalculateRouteAdapter());
integration("2B.3 WhatsApp dispatch executes offline", createWhatsAppQuoteDispatchAdapter());
