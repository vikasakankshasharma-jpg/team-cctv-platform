import { strict as assert } from "node:assert";
import test from "node:test";
import type { FrozenContext } from "../types/certification.ts";
import { invokeCalculatePricing, PricingEngineAdapter, toProductionInputs } from "../production/pricing-engine.adapter.ts";

const snapshot: Pick<FrozenContext, "products" | "addons" | "app_settings"> = {
  products: [
    {
      id: "CAM-001", sku: "CAM-001", category: "cctv_camera", technology: "HD", resolution: "2MP",
      form_factor: "dome", ip_rating: "Indoor", technologies: ["HD"],
      display_name: "HD 2MP Indoor Dome Camera", brand: "TestBrand",
      is_active: true, is_deleted: false, is_quotation_eligible: true, stock_status: "in_stock",
      base_cost: 1000, unit_price: 1180,
    },
    {
      id: "DVR-001", sku: "DVR-001", category: "recorder", technology: "HD", resolution: "5MP",
      channel_capacity: 4, max_supported_mp: 5, display_name: "4 Channel HD DVR", brand: "TestBrand", technologies: ["HD"], is_active: true, is_deleted: false, is_quotation_eligible: true,
      stock_status: "in_stock", base_cost: 2000, unit_price: 2360,
    },
    {
      id: "HDD-001", sku: "HDD-001", category: "storage", storage_type: "Hard Disk", technology: "HD",
      capacity_tb: 1, display_name: "1TB Surveillance Hard Disk", brand: "TestBrand", technologies: ["HD"], is_active: true, is_deleted: false, is_quotation_eligible: true, stock_status: "in_stock",
      base_cost: 2500, unit_price: 2950,
    },
    {
      id: "PWR-001", sku: "PWR-001", category: "power_device", technology: "HD", channel_capacity: 4,
      display_name: "4 Channel HD Power Supply", brand: "TestBrand", technologies: ["HD"],
      is_active: true, is_deleted: false, is_quotation_eligible: true, stock_status: "in_stock",
      base_cost: 500, unit_price: 590,
    },
  ] as any,
  addons: [{ sku: "ADD-001", is_active: true, is_addon: true, unit_price: 100, base_cost: 80 } as any],
  app_settings: { gst_rate: 18 } as any,
};
const selection = { camera_count: 1, technology: "HD" } as Record<string, unknown>;

test("pricing adapter calls calculatePricing with the verified parameter object", async () => {
  let received: any;
  const fn = async (params: any) => { received = params; return { ok: true }; };
  await invokeCalculatePricing(fn, selection, snapshot as any);
  assert.equal(received.selection, selection);
  assert.equal(received.products, snapshot.products);
  assert.equal(received.addons, snapshot.addons);
  assert.equal(received.settings, snapshot.app_settings);
});

test("canonical translator produces separate selection and CCTV requirement inputs", () => {
  const result = toProductionInputs({ camera_count: 4, cameras: [{ technology: "IP", count: 4, resolution: "4MP" }] } as any);
  assert.equal(result.selection.camera_count, 4);
  assert.equal(result.selection.technology, "IP");
  assert.equal(result.selection.cabling_mode, undefined);
  assert.equal(result.selection.cable_length_meters, 0);
  assert.equal((result.cctvRequirement.cameras as any[])[0].resolution, "4MP");
  assert.equal(result.cctvRequirement.technology_preference, "IP");
});

test("pricing adapter is pointed at the verified production pricing exports", () => {
  const adapter = new PricingEngineAdapter();
  assert.equal(adapter.id, "pricing-engine");
  assert.match(adapter.version, /^2B\.2-v5$/);
});

test("real pricing-engine integration smoke test when production source exists", async (t) => {
  const repoRoot = process.cwd();
  const fs = await import("node:fs/promises");
  try { await fs.access(new URL("file://" + repoRoot.replace(/\\/g, "/") + "/lib/pricing-engine.ts")); }
  catch { t.skip("secure-easy/lib/pricing-engine.ts is not present in this package-only test environment"); return; }
  const adapter = new PricingEngineAdapter();
  const result = await adapter.execute({
    camera_count: 1,
    cameras: [{ technology: "HD", count: 1, resolution: "2MP" }],
    technology: "HD",
    resolution: "2MP",
    recording_days: 7,
    cabling_mode: "all_existing",
    cable_length_meters: 0,
    installation_preference: "pro",
  } as any, {
    repoRoot,
    snapshot: snapshot as any,
  } as any);
  assert.equal(result.ok, true, result.error?.message ?? "production pricing adapter failed");
  const value = result.value as any;
  assert.ok(Number(value?.calculatePricing?.total_payable ?? 0) > 0, "calculatePricing.total_payable must be > 0");
  assert.ok(
    Object.keys(value?.generatePricingSnapshot?.plans ?? {}).length > 0,
    "generatePricingSnapshot must contain at least one non-empty plan",
  );
});
