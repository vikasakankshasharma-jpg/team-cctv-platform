import { generatePricingSnapshot } from "../lib/pricing-engine";
import { MarginEngine, DEFAULT_MARGIN_POLICY } from "../lib/margin-engine";

const mockReq = {
  property_type: "residential",
  technology_preference: "HD",
  camera_resolution: "2MP",
  cameras: [
    { type: "bullet", environment: "outdoor", qty: 2 },
  ],
  cabling_done: false,
};

const resolvedSystem = {
  plan_type: "budget",
  cameras: [
    {
      qty: 2,
      product: {
        id: "c1",
        display_name: "Budget 2MP Camera",
        category: "cctv_camera",
        brand: "Budget",
        base_cost: 700,
        unit_price: 910
      }
    }
  ],
  recorder: {
    id: "r1",
    display_name: "4Ch DVR",
    category: "recorder",
    brand: "Budget",
    base_cost: 2000,
    unit_price: 2300
  },
  storage: {
    id: "s1",
    display_name: "500GB HDD",
    category: "storage",
    brand: "Budget",
    base_cost: 1800,
    unit_price: 1980
  },
  power: {
    id: "p1",
    display_name: "SMPS 4Ch",
    category: "power_supply",
    brand: "Budget",
    base_cost: 350,
    unit_price: 438
  },
  cable_meters: 30,
  connectors_qty: 4,
  site_surcharge_flags: {}
};

const settings = {
  labor_hd_per_camera: 400,
  margin_cable: 50,
  connector_bnc_dc_cost: 20,
};

const snapshot = generatePricingSnapshot(
  resolvedSystem as any,
  mockReq as any,
  [],
  [],
  settings as any,
  undefined,
  undefined,
  []
);

console.log(JSON.stringify(snapshot, null, 2));
