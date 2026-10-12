/**
 * @file scripts/run-quotation-oracle.ts
 * @description Comprehensive Quotation Engine QA & Price Reconciliation Harness.
 * Replaces static Excel workbooks with an automated, reproducible test runner.
 * Validates actual quotation engine outputs against an independent mathematical oracle.
 */

import { calculatePricing, generatePricingSnapshot } from "../lib/pricing-engine";
import { getCatalogCapacity } from "../lib/catalog-capacity";
import { MarginEngine, DEFAULT_MARGIN_POLICY } from "../lib/margin-engine";
import { ConfiguratorSelection, Product, Addon, AppSettings, ResolvedSystem, CCTVRequirement } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// 1. REPRODUCIBLE CATALOG & SETTINGS (DERIVED FROM PRICE LIST & BUSINESS RULES)
// ─────────────────────────────────────────────────────────────────────────────

const mockSettings: AppSettings = {
  company_name: "TEAM CCTV",
  gst_rate: 18,
  labor_fitting_only_rate: 300,
  labor_full_installation_rate: 500,
  labor_hd_fitting_only: 200,
  labor_ip_fitting_only: 300,
  labor_no_cabling_visit_charge: 500,
  labor_no_cabling_small_job_threshold: 2,
  labor_no_cabling_small_job_rate: 500,
  labor_ip_per_camera: 500,
  labor_hd_per_camera: 400,
  cable_copper_coated_ip: 12,
  cable_copper_coated_hd: 8,
  connector_rj45_cost: 5,
  connector_bnc_dc_cost: 20,
  visit_charge: 500,
  amc_1yr_pct: 15,
  max_supported_cameras: 16,
  quote_validity_days: 7,
  site_preparation: {
    ladderArrangementFee: 500,
    marbleLaborSurcharge: 400,
    metalInstallationSurcharge: 200,
    furnishedSiteSurcharge: 300,
    heavyWallDrillingSurcharge: 600
  },
  margin_policy: DEFAULT_MARGIN_POLICY
} as any;

const mockProducts: Product[] = [
  // HD Analog Cameras
  { id: "hd_cp_2mp_dome", display_name: "CP Plus 2MP HD Dome Camera", category: "cctv_camera" as any, technologies: ["HD"], brand: "cpplus", unit_price: 1300, base_cost: 1000, resolution_mp: 2, form_factor: "dome", is_active: true },
  { id: "hd_cp_2mp_bullet", display_name: "CP Plus 2MP HD Bullet Camera", category: "cctv_camera" as any, technologies: ["HD"], brand: "cpplus", unit_price: 1365, base_cost: 1050, resolution_mp: 2, form_factor: "bullet", is_active: true },
  { id: "hd_cp_5mp_dome", display_name: "CP Plus 5MP HD Dome Camera", category: "cctv_camera" as any, technologies: ["HD"], brand: "cpplus", unit_price: 2080, base_cost: 1600, resolution_mp: 5, form_factor: "dome", is_active: true },
  { id: "hd_cp_5mp_bullet", display_name: "CP Plus 5MP HD Bullet Camera", category: "cctv_camera" as any, technologies: ["HD"], brand: "cpplus", unit_price: 2145, base_cost: 1650, resolution_mp: 5, form_factor: "bullet", is_active: true },
  { id: "hd_budget_2mp_dome", display_name: "Budget 2MP HD Dome Camera", category: "cctv_camera" as any, technologies: ["HD"], brand: "budget", unit_price: 910, base_cost: 700, resolution_mp: 2, form_factor: "dome", is_active: true },
  
  // IP Network Cameras
  { id: "ip_cp_2mp_dome", display_name: "CP Plus 2MP IP Dome Camera", category: "cctv_camera" as any, technologies: ["IP"], brand: "cpplus", unit_price: 4030, base_cost: 3100, resolution_mp: 2, form_factor: "dome", is_active: true },
  { id: "ip_cp_2mp_bullet", display_name: "CP Plus 2MP IP Bullet Camera", category: "cctv_camera" as any, technologies: ["IP"], brand: "cpplus", unit_price: 4160, base_cost: 3200, resolution_mp: 2, form_factor: "bullet", is_active: true },
  { id: "ip_cp_4mp_dome", display_name: "CP Plus 4MP IP Dome Camera", category: "cctv_camera" as any, technologies: ["IP"], brand: "cpplus", unit_price: 5070, base_cost: 3900, resolution_mp: 4, form_factor: "dome", is_active: true },
  { id: "ip_cp_4mp_bullet", display_name: "CP Plus 4MP IP Bullet Camera", category: "cctv_camera" as any, technologies: ["IP"], brand: "cpplus", unit_price: 5200, base_cost: 4000, resolution_mp: 4, form_factor: "bullet", is_active: true },
  { id: "ip_cp_8mp_bullet", display_name: "CP Plus 8MP IP Bullet Camera", category: "cctv_camera" as any, technologies: ["IP"], brand: "cpplus", unit_price: 9750, base_cost: 7500, resolution_mp: 8, form_factor: "bullet", is_active: true },

  // Wireless / WiFi Cameras
  { id: "wifi_cam_3mp", display_name: "CP Plus 3MP Smart WiFi PTZ Camera", category: "cctv_camera" as any, technologies: ["Wireless"], brand: "cpplus", unit_price: 2499, base_cost: 1800, is_active: true },

  // HD DVR Recorders
  { id: "dvr_4ch", display_name: "CP Plus 4 Channel HD DVR", category: "recorder" as any, technologies: ["HD"], channels: 4, max_cameras: 4, unit_price: 4625, base_cost: 3700, is_active: true },
  { id: "dvr_8ch", display_name: "CP Plus 8 Channel HD DVR", category: "recorder" as any, technologies: ["HD"], channels: 8, max_cameras: 8, unit_price: 6000, base_cost: 4800, is_active: true },
  { id: "dvr_16ch", display_name: "CP Plus 16 Channel HD DVR", category: "recorder" as any, technologies: ["HD"], channels: 16, max_cameras: 16, unit_price: 10125, base_cost: 8100, is_active: true },

  // IP NVR Recorders
  { id: "nvr_4ch", display_name: "CP Plus 4 Channel IP NVR", category: "recorder" as any, technologies: ["IP"], channels: 4, max_cameras: 4, unit_price: 5875, base_cost: 4700, is_active: true },
  { id: "nvr_8ch", display_name: "CP Plus 8 Channel IP NVR", category: "recorder" as any, technologies: ["IP"], channels: 8, max_cameras: 8, unit_price: 6500, base_cost: 5200, is_active: true },
  { id: "nvr_16ch", display_name: "CP Plus 16 Channel IP NVR", category: "recorder" as any, technologies: ["IP"], channels: 16, max_cameras: 16, unit_price: 10375, base_cost: 8300, is_active: true },
  { id: "nvr_32ch", display_name: "CP Plus 32 Channel IP NVR", category: "recorder" as any, technologies: ["IP"], channels: 32, max_cameras: 32, unit_price: 18750, base_cost: 15000, is_active: true },

  // Cables
  { id: "cable_hd_bundle", display_name: "CP Plus 3+1 HD Cable 90m Roll", category: "cable" as any, technologies: ["HD"], unit_price: 1800, base_cost: 1350, cable_length_m: 90, is_active: true },
  { id: "cable_ip_bundle", display_name: "CP Plus CAT6 Cable 305m Roll", category: "cable" as any, technologies: ["IP"], unit_price: 4900, base_cost: 3700, cable_length_m: 305, is_active: true },

  // Power Supplies / PoE
  { id: "psu_smps_8ch", display_name: "CP Plus 8 Channel SMPS Power Supply", category: "power_device" as any, technologies: ["HD"], channels: 8, max_cameras: 8, unit_price: 850, base_cost: 600, is_active: true },
  { id: "poe_switch_4ch", display_name: "4 Channel PoE Switch", category: "power_device" as any, technologies: ["IP"], channels: 4, max_cameras: 4, unit_price: 1350, base_cost: 900, is_active: true },
  { id: "poe_switch_8ch", display_name: "8 Channel PoE Switch", category: "power_device" as any, technologies: ["IP"], channels: 8, max_cameras: 8, unit_price: 1800, base_cost: 1200, is_active: true },
];

const mockAddons: Addon[] = [
  // Storage HDDs
  { id: "hdd_500gb", display_name: "Surveillance Hard Disk 500GB", category: "storage", addon_type: "hardware", unit_price: 2340, base_cost: 1800, storage_tb: 0.5, is_active: true } as any,
  { id: "hdd_1tb", display_name: "Surveillance Hard Disk 1TB", category: "storage", addon_type: "hardware", unit_price: 6760, base_cost: 5200, storage_tb: 1.0, is_active: true } as any,
  { id: "hdd_2tb", display_name: "Surveillance Hard Disk 2TB", category: "storage", addon_type: "hardware", unit_price: 10400, base_cost: 8000, storage_tb: 2.0, is_active: true } as any,
  { id: "hdd_4tb", display_name: "Surveillance Hard Disk 4TB", category: "storage", addon_type: "hardware", unit_price: 19500, base_cost: 15000, storage_tb: 4.0, is_active: true } as any,
  
  // Accessories
  { id: "acc_junction_box", display_name: "PVC Weatherproof Camera Junction Box", category: "accessory", addon_type: "hardware", unit_price: 30, base_cost: 20, is_active: true } as any,
  { id: "acc_rack_2u", display_name: "2U Wall Mount DVR/NVR Rack", category: "accessory", addon_type: "hardware", unit_price: 550, base_cost: 350, is_active: true } as any,
  { id: "acc_router_4g", display_name: "4G SIM Wi-Fi Router for Remote Viewing", category: "accessory", addon_type: "hardware", unit_price: 2200, base_cost: 1450, is_active: true } as any,
  { id: "amc_1yr", display_name: "1-Year Annual Maintenance Contract", category: "service", addon_type: "service", unit_price: 0, base_cost: 0, is_active: true } as any,
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. TEST REGISTRATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

interface OracleAssertion {
  id: string;
  category: string;
  description: string;
  test: () => { pass: boolean; expected: any; actual: any; message?: string };
}

const tests: OracleAssertion[] = [];

function registerTest(category: string, id: string, description: string, test: () => { pass: boolean; expected: any; actual: any; message?: string }) {
  tests.push({ id, category, description, test });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CORE BATTERY: CAPACITY & SIZING BOUNDARIES
// ─────────────────────────────────────────────────────────────────────────────

// DOMAIN 1: Core Capacity & Boundary Values (0, 1, 4, 5, 8, 9, 16, 17, 32)
const cameraCounts = [1, 4, 5, 8, 9, 16, 17, 32];
for (const count of cameraCounts) {
  for (const tech of ["HD", "IP", "Wireless"] as const) {
    registerTest(
      "Capacity Boundaries",
      `CAP-${tech}-${count}`,
      `Verify capacity handling for ${count} ${tech} cameras`,
      () => {
        const capacity = getCatalogCapacity(mockProducts);
        const max = capacity[tech] ?? 16;
        const isIndustrial = count > max;
        
        const sel: ConfiguratorSelection = {
          technology: tech,
          camera_count: count,
          plan_type: "recommended",
          recording_days: 7,
          selected_addons: []
        };
        const result = calculatePricing({
          selection: sel,
          products: mockProducts,
          addons: mockAddons,
          settings: mockSettings,
          cablingDone: false
        });

        if (isIndustrial) {
          return {
            pass: result.requiresIndustrialQuote === true && result.items.length === 0,
            expected: "Industrial lead flagged (requiresIndustrialQuote=true, items=0)",
            actual: `requiresIndustrialQuote=${result.requiresIndustrialQuote}, items=${result.items.length}`
          };
        } else {
          return {
            pass: result.total_payable > 0 && result.items.length > 0 && !result.requiresIndustrialQuote,
            expected: `Valid quote for <= ${max} cameras`,
            actual: `total_payable=${result.total_payable}, items=${result.items.length}`
          };
        }
      }
    );
  }
}

// DOMAIN 2: Recorder Sizing Invariant
const recorderExpectations = [
  { tech: "HD", cams: 4, expectedChannels: 4 },
  { tech: "HD", cams: 5, expectedChannels: 8 },
  { tech: "HD", cams: 8, expectedChannels: 8 },
  { tech: "HD", cams: 9, expectedChannels: 16 },
  { tech: "IP", cams: 4, expectedChannels: 4 },
  { tech: "IP", cams: 5, expectedChannels: 8 },
  { tech: "IP", cams: 16, expectedChannels: 16 },
  { tech: "IP", cams: 17, expectedChannels: 32 }
];

for (const recTest of recorderExpectations) {
  registerTest(
    "Recorder Sizing",
    `REC-${recTest.tech}-${recTest.cams}`,
    `${recTest.cams} ${recTest.tech} cameras must receive >= ${recTest.expectedChannels}Ch recorder`,
    () => {
      const sel: ConfiguratorSelection = {
        technology: recTest.tech as any,
        camera_count: recTest.cams,
        plan_type: "recommended",
        recording_days: 7,
        selected_addons: []
      };
      const result = calculatePricing({
        selection: sel,
        products: mockProducts,
        addons: mockAddons,
        settings: mockSettings,
        cablingDone: false
      });

      const recorderItem = result.items.find(i => i.display_name.includes("DVR") || i.display_name.includes("NVR"));
      const pass = !!recorderItem && recorderItem.display_name.includes(`${recTest.expectedChannels} Channel`);
      return {
        pass,
        expected: `${recTest.expectedChannels} Channel ${recTest.tech === "HD" ? "DVR" : "NVR"}`,
        actual: recorderItem?.display_name || "None"
      };
    }
  );
}

// DOMAIN 3: Installation & Cabling Labor Rules (BUSINESS_RULES.md Section 4)
const laborMatrix = [
  { tech: "HD", cams: 4, cablingDone: true, meters: 60, expectedLabor: (4 * 200) + 500 },
  { tech: "HD", cams: 4, cablingDone: false, meters: 60, expectedLabor: 4 * 400 },
  { tech: "HD", cams: 4, cablingDone: false, meters: 80, expectedLabor: (4 * 400) + (20 * 15) },
  { tech: "IP", cams: 4, cablingDone: true, meters: 60, expectedLabor: (4 * 300) + 500 },
  { tech: "IP", cams: 4, cablingDone: false, meters: 60, expectedLabor: 4 * 500 },
  { tech: "IP", cams: 4, cablingDone: false, meters: 100, expectedLabor: (4 * 500) + (40 * 15) },
  // Small Job Guarantee (count <= 2 cams with cablingDone=true)
  { tech: "HD", cams: 1, cablingDone: true, meters: 0, expectedLabor: 1 * 500 },
  { tech: "HD", cams: 2, cablingDone: true, meters: 0, expectedLabor: 2 * 500 },
  { tech: "HD", cams: 3, cablingDone: true, meters: 0, expectedLabor: (3 * 200) + 500 },
  { tech: "IP", cams: 1, cablingDone: true, meters: 0, expectedLabor: 1 * 500 },
  { tech: "IP", cams: 2, cablingDone: true, meters: 0, expectedLabor: 2 * 500 },
  { tech: "IP", cams: 3, cablingDone: true, meters: 0, expectedLabor: (3 * 300) + 500 }
];

for (let idx = 0; idx < laborMatrix.length; idx++) {
  const lm = laborMatrix[idx];
  registerTest(
    "Labor & Excess Cabling",
    `LABOR-00${idx + 1}`,
    `${lm.cams} ${lm.tech} cams, cablingDone=${lm.cablingDone}, ${lm.meters}m => ₹${lm.expectedLabor} labor`,
    () => {
      const sel: ConfiguratorSelection = {
        technology: lm.tech as any,
        camera_count: lm.cams,
        total_cable_length_meters: lm.meters,
        cabling_done: lm.cablingDone,
        plan_type: "recommended",
        recording_days: 7,
        selected_addons: []
      };
      const result = calculatePricing({
        selection: sel,
        products: mockProducts,
        addons: mockAddons,
        settings: mockSettings,
        cablingDone: lm.cablingDone
      });

      const laborTotal = result.items
        .filter(i => i.product_id?.startsWith("labor_") || i.display_name?.includes("Installation") || i.display_name?.includes("Labor"))
        .reduce((sum, i) => sum + i.line_total, 0);

      const pass = laborTotal === lm.expectedLabor;
      return {
        pass,
        expected: lm.expectedLabor,
        actual: laborTotal
      };
    }
  );
}

// DOMAIN 4: Storage Sizing & Downgrade / Overflow Safeguard
registerTest(
  "Storage Safeguards",
  "STOR-001-ZERO-DAYS",
  "Zero recording days must include 0 HDD line items",
  () => {
    const sel: ConfiguratorSelection = {
      technology: "IP",
      camera_count: 4,
      recording_days: 0,
      plan_type: "recommended",
      selected_addons: []
    };
    const result = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true
    });
    const hasHDD = result.items.some(i => i.display_name.toLowerCase().includes("hard disk") || i.display_name.toLowerCase().includes("hdd"));
    return {
      pass: !hasHDD,
      expected: "No HDD added",
      actual: hasHDD ? "HDD present in quote" : "No HDD added"
    };
  }
);

registerTest(
  "Storage Safeguards",
  "STOR-002-OVERFLOW-FLAG",
  "Extreme storage (16 cams * 365 days) must flag storage_overflow and shortfall",
  () => {
    const sel: ConfiguratorSelection = {
      technology: "IP",
      camera_count: 16,
      recording_days: 365,
      plan_type: "recommended",
      selected_addons: []
    };
    const result = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true
    });
    const hddItem = result.items.find(i => i.display_name.includes("Hard Disk") || i.display_name.includes("4TB"));
    const overflowDetected = !!hddItem && hddItem.display_name.includes("requires");
    return {
      pass: overflowDetected,
      expected: "Storage overflow note in item description",
      actual: hddItem?.display_name || "None"
    };
  }
);

// DOMAIN 5: Mathematical Tax & GST Reconciliation
registerTest(
  "Tax & GST Parity",
  "TAX-001-GST18",
  "GST must equal exactly 18% of taxable subtotal, and total = taxable + GST",
  () => {
    const sel: ConfiguratorSelection = {
      technology: "IP",
      camera_count: 4,
      recording_days: 15,
      plan_type: "recommended",
      selected_addons: []
    };
    const result = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: false
    });

    const sumLines = result.items.reduce((sum, i) => sum + i.line_total, 0) + result.addons.reduce((sum, a) => sum + (a.price * a.qty), 0);
    const expectedGst = Math.round(sumLines * 0.18);
    const expectedTotal = sumLines + expectedGst;

    const pass = Math.abs(result.gst_amount - expectedGst) <= 1 && Math.abs(result.total_payable - expectedTotal) <= 1;
    return {
      pass,
      expected: { gst: expectedGst, total: expectedTotal },
      actual: { gst: result.gst_amount, total: result.total_payable }
    };
  }
);

// DOMAIN 6: Input Immutability
registerTest(
  "Input Immutability",
  "MUT-001-TECHNOLOGY",
  "calculatePricing must NEVER mutate caller's selection object in-place",
  () => {
    const inputSelection: ConfiguratorSelection = {
      technology: "analog" as any,
      camera_count: 4,
      plan_type: "recommended",
      selected_addons: []
    };
    Object.freeze(inputSelection);

    try {
      const result = calculatePricing({
        selection: inputSelection,
        products: mockProducts,
        addons: mockAddons,
        settings: mockSettings,
        cablingDone: true
      });
      return {
        pass: inputSelection.technology === "analog" && result.total_payable > 0,
        expected: "inputSelection.technology remains 'analog' and valid quote produced",
        actual: `inputSelection.technology is '${inputSelection.technology}', total_payable=₹${result.total_payable}`
      };
    } catch (err: any) {
      return {
        pass: false,
        expected: "No mutation error on frozen object",
        actual: `Failed with error: ${err.message}`
      };
    }
  }
);

// DOMAIN 7: Monotonicity & Invariants
registerTest(
  "Invariants",
  "INV-001-WIRING-PARITY",
  "cablingDone=true must ALWAYS cost strictly less than or equal to cablingDone=false",
  () => {
    const baseSel: ConfiguratorSelection = {
      technology: "HD",
      camera_count: 4,
      plan_type: "recommended",
      selected_addons: []
    };
    const withCabling = calculatePricing({
      selection: baseSel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: false
    });
    const withoutCabling = calculatePricing({
      selection: baseSel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true
    });

    const pass = withoutCabling.total_payable < withCabling.total_payable;
    return {
      pass,
      expected: "withoutCabling.total_payable < withCabling.total_payable",
      actual: `withCabling=₹${withCabling.total_payable}, withoutCabling=₹${withoutCabling.total_payable}`
    };
  }
);

registerTest(
  "Invariants",
  "INV-002-CAMERA-SCALE-MONOTONIC",
  "Adding cameras must monotonically increase quote total",
  () => {
    let prevTotal = 0;
    let monotonic = true;
    const totals: number[] = [];
    
    for (const count of [1, 2, 4, 8, 16]) {
      const sel: ConfiguratorSelection = {
        technology: "IP",
        camera_count: count,
        plan_type: "recommended",
        selected_addons: []
      };
      const res = calculatePricing({
        selection: sel,
        products: mockProducts,
        addons: mockAddons,
        settings: mockSettings,
        cablingDone: true
      });
      totals.push(res.total_payable);
      if (res.total_payable <= prevTotal) {
        monotonic = false;
      }
      prevTotal = res.total_payable;
    }

    return {
      pass: monotonic,
      expected: "Strictly increasing prices for [1, 2, 4, 8, 16] cameras",
      actual: totals.join(" < ")
    };
  }
);

// DOMAIN 8: Connectors
registerTest(
  "Connectors",
  "CONN-001-HD-BNC-DC",
  "4 HD cameras must receive exactly 4 BNC/DC connector sets priced with margin",
  () => {
    const sel: ConfiguratorSelection = {
      technology: "HD",
      camera_count: 4,
      plan_type: "recommended",
      selected_addons: []
    };
    const res = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true
    });
    const connItem = res.items.find(i => i.product_id === "connector_bnc_dc");
    const pass = !!connItem && connItem.qty === 4;
    return {
      pass,
      expected: "4 BNC & DC connector sets",
      actual: connItem ? `${connItem.qty} sets` : "Missing"
    };
  }
);

registerTest(
  "Connectors",
  "CONN-002-IP-RJ45",
  "4 IP cameras must receive 2 ends per camera + 2 for PoE uplink = 10 RJ45 connectors",
  () => {
    const sel: ConfiguratorSelection = {
      technology: "IP",
      camera_count: 4,
      plan_type: "recommended",
      selected_addons: []
    };
    const res = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true
    });
    const connItem = res.items.find(i => i.product_id === "connector_rj45");
    const pass = !!connItem && connItem.qty === 10;
    return {
      pass,
      expected: "10 RJ45 connectors (8 for cameras + 2 for PoE uplink)",
      actual: connItem ? `${connItem.qty} connectors` : "Missing"
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. EXPANDED DOMAINS: SITE CONDITION BITMASKS (ALL 32 COMBINATIONS)
// ─────────────────────────────────────────────────────────────────────────────

const SURCHARGE_RATES = {
  ladder: 500,
  marble: 400,
  metal: 200,
  furnished: 300,
  heavy_drilling: 600
};

for (let mask = 0; mask < 32; mask++) {
  const hasLadder = (mask & 1) !== 0;
  const hasMarble = (mask & 2) !== 0;
  const hasMetal = (mask & 4) !== 0;
  const hasFurnished = (mask & 8) !== 0;
  const hasHeavyDrilling = (mask & 16) !== 0;

  const expectedSurchargeTotal = 
    (hasLadder ? SURCHARGE_RATES.ladder : 0) +
    (hasMarble ? SURCHARGE_RATES.marble : 0) +
    (hasMetal ? SURCHARGE_RATES.metal : 0) +
    (hasFurnished ? SURCHARGE_RATES.furnished : 0) +
    (hasHeavyDrilling ? SURCHARGE_RATES.heavy_drilling : 0);

  const flagNames: string[] = [];
  if (hasLadder) flagNames.push("ladder");
  if (hasMarble) flagNames.push("marble");
  if (hasMetal) flagNames.push("metal");
  if (hasFurnished) flagNames.push("furnished");
  if (hasHeavyDrilling) flagNames.push("heavy_drilling");
  const label = flagNames.length > 0 ? flagNames.join("+") : "none";

  registerTest(
    "Site Prep Surcharges (32 Combinations)",
    `SITE-MASK-${mask.toString(2).padStart(5, "0")}`,
    `Flags [${label}] => ₹${expectedSurchargeTotal} in exact surcharges (no margin markup)`,
    () => {
      const mockResolvedSystem: ResolvedSystem = {
        plan_type: "IP_2MP",
        cameras: [{ product: mockProducts.find(p => p.id === "ip_cp_2mp_dome")!, qty: 2 }],
        recorder: mockProducts.find(p => p.id === "nvr_4ch"),
        storage: mockAddons.find(a => a.id === "hdd_1tb") as any,
        power: mockProducts.find(p => p.id === "poe_switch_4ch"),
        cable_meters: 30,
        connectors_qty: 6,
        site_surcharge_flags: {
          requiresLadderFee: hasLadder,
          requiresMarbleSurcharge: hasMarble,
          requiresMetalSurcharge: hasMetal,
          requiresFurnishedSurcharge: hasFurnished,
          requiresHeavyDrillingSurcharge: hasHeavyDrilling
        }
      } as any;

      const mockReq: CCTVRequirement = {
        property_type: "home",
        setup_type: "new",
        technology_preference: "IP",
        camera_count: 2,
        cabling_done: true,
        recording_days: 7,
        addons: []
      } as any;

      const snapshot = generatePricingSnapshot(
        mockResolvedSystem,
        mockReq,
        mockAddons,
        [],
        mockSettings,
        undefined,
        0,
        0,
        mockProducts
      );

      const surchargeItems = snapshot.items.filter(i => i.product_id.startsWith("surcharge_"));
      const actualSurcharges = surchargeItems.reduce((sum, i) => sum + i.line_total, 0);

      const pass = actualSurcharges === expectedSurchargeTotal && surchargeItems.length === flagNames.length;
      return {
        pass,
        expected: { count: flagNames.length, total: expectedSurchargeTotal },
        actual: { count: surchargeItems.length, total: actualSurcharges }
      };
    }
  );
}

registerTest(
  "Site Prep Surcharges (32 Combinations)",
  "SITE-CALC-FLAGS-PARITY",
  "calculatePricing with site_surcharge_flags adds exact ₹0-margin line items",
  () => {
    const sel: ConfiguratorSelection = {
      technology: "HD",
      camera_count: 4,
      plan_type: "recommended",
      selected_addons: [],
      site_surcharge_flags: {
        requiresLadderFee: true,
        requiresMarbleSurcharge: true,
        requiresMetalSurcharge: false,
        requiresFurnishedSurcharge: false,
        requiresHeavyDrillingSurcharge: false
      }
    };

    const res = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true
    });

    const ladder = res.items.find(i => i.product_id === "surcharge_ladder");
    const marble = res.items.find(i => i.product_id === "surcharge_marble");
    const pass = !!ladder && ladder.line_total === 500 && !!marble && marble.line_total === 400;

    return {
      pass,
      expected: "Ladder=₹500, Marble=₹400 in quote line items",
      actual: `Ladder=₹${ladder?.line_total || 0}, Marble=₹${marble?.line_total || 0}`
    };
  }
);

registerTest(
  "Site Prep Surcharges (32 Combinations)",
  "SITE-ADMIN-RATE-UPDATE",
  "calculatePricing dynamically uses updated admin rates when site_preparation is changed",
  () => {
    const customAdminSettings: AppSettings = {
      ...mockSettings,
      site_preparation: {
        ...mockSettings.site_preparation,
        ladderArrangementFee: 750,
        marbleLaborSurcharge: 650
      }
    };

    const sel: ConfiguratorSelection = {
      technology: "HD",
      camera_count: 4,
      plan_type: "recommended",
      selected_addons: [],
      site_surcharge_flags: {
        requiresLadderFee: true,
        requiresMarbleSurcharge: true
      }
    };

    const res = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: customAdminSettings,
      cablingDone: true
    });

    const ladder = res.items.find(i => i.product_id === "surcharge_ladder");
    const marble = res.items.find(i => i.product_id === "surcharge_marble");
    const pass = !!ladder && ladder.line_total === 750 && !!marble && marble.line_total === 650;

    return {
      pass,
      expected: "Ladder=₹750, Marble=₹650 with custom admin settings",
      actual: `Ladder=₹${ladder?.line_total || 0}, Marble=₹${marble?.line_total || 0}`
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. EXPANDED DOMAINS: DISCOUNTS, REFERRALS & FREE AMC CAPPING
// ─────────────────────────────────────────────────────────────────────────────

registerTest(
  "Discounts & Offers",
  "OFFER-001-PERCENT",
  "10% referral discount reduces subtotal by exact 10%",
  () => {
    const sel: ConfiguratorSelection = {
      technology: "HD",
      camera_count: 4,
      plan_type: "recommended",
      selected_addons: []
    };
    const regular = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true
    });
    const discounted = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true,
      referralDiscountPercent: 10
    });

    const expectedDiscount = Math.round(regular.gross_subtotal * 0.10);
    const pass = discounted.referral_discount === expectedDiscount && discounted.net_taxable_amount === regular.gross_subtotal - expectedDiscount;
    return {
      pass,
      expected: expectedDiscount,
      actual: discounted.referral_discount
    };
  }
);

registerTest(
  "Discounts & Offers",
  "OFFER-002-FLAT",
  "Flat ₹500 referral discount reduces taxable subtotal by ₹500",
  () => {
    const sel: ConfiguratorSelection = {
      technology: "HD",
      camera_count: 4,
      plan_type: "recommended",
      selected_addons: []
    };
    const regular = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true
    });
    const discounted = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true,
      referralDiscountFlat: 500
    });

    const pass = discounted.referral_discount === 500 && discounted.net_taxable_amount === regular.gross_subtotal - 500;
    return {
      pass,
      expected: 500,
      actual: discounted.referral_discount
    };
  }
);

registerTest(
  "Discounts & Offers",
  "OFFER-003-FREE-AMC",
  "Free AMC offer adds AMC line item and promo_free_amc offset, netting to ₹0 addition",
  () => {
    const sel: ConfiguratorSelection = {
      technology: "HD",
      camera_count: 4,
      plan_type: "recommended",
      selected_addons: ["amc_1yr"]
    };
    const withoutOffer = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true
    });
    const withFreeAmc = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true,
      activeOffer: { type: "free_amc", campaign_id: "test_promo" }
    });

    // AMC in regular quote adds to total; Free AMC promo nets out so total equals zero-AMC setup
    const selNoAmc: ConfiguratorSelection = {
      technology: "HD",
      camera_count: 4,
      plan_type: "recommended",
      selected_addons: []
    };
    const baseNoAmc = calculatePricing({
      selection: selNoAmc,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true
    });

    const pass = withFreeAmc.total_payable === baseNoAmc.total_payable && withFreeAmc.addons.some(a => a.addon_id === "promo_free_amc");
    return {
      pass,
      expected: `Net ₹0 added for AMC (total = ₹${baseNoAmc.total_payable})`,
      actual: `total_payable=₹${withFreeAmc.total_payable}, regularWithAmc=₹${withoutOffer.total_payable}`
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. EXPANDED DOMAINS: JOURNEY PARITY (GUIDED SETUP VS CUSTOM BUILD / CART)
// ─────────────────────────────────────────────────────────────────────────────

registerTest(
  "Quote Journey Parity",
  "PARITY-001-GUIDED-VS-PRO",
  "Guided Setup and Custom Build line items for 4 HD cameras have ₹0 variance",
  () => {
    const sel: ConfiguratorSelection = {
      technology: "HD",
      camera_count: 4,
      plan_type: "recommended",
      selected_addons: []
    };
    const guided = calculatePricing({
      selection: sel,
      products: mockProducts,
      addons: mockAddons,
      settings: mockSettings,
      cablingDone: true
    });

    // Emulate Pro Builder line item evaluation (from app/api/quote/save/route.ts)
    let proSubtotal = 0;
    for (const item of guided.items) {
      const cat = (item.product_id.startsWith("labor_") ? "labor" : "hardware");
      let unitPrice = item.unit_price;
      proSubtotal += unitPrice * item.qty;
    }
    const proGst = Math.round(proSubtotal * 0.18);
    const proTotal = proSubtotal + proGst;

    const variance = Math.abs(guided.total_payable - proTotal);
    const pass = variance === 0;
    return {
      pass,
      expected: `₹${guided.total_payable}`,
      actual: `₹${proTotal} (variance = ₹${variance})`
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. EXECUTION HARNESS & AUTOMATED REPORTING
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║     TEAM CCTV PLATFORM - EXPANDED PRICING ORACLE QA SUITE            ║");
  console.log("║     Validating Mathematical Parity, Compatibilities & Invariants     ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝\n");

  let passed = 0;
  let failed = 0;
  const failures: any[] = [];

  const categories = [...new Set(tests.map(t => t.category))];

  for (const cat of categories) {
    console.log(`\n── Category: ${cat} ──`);
    const catTests = tests.filter(t => t.category === cat);
    for (const t of catTests) {
      try {
        const result = t.test();
        if (result.pass) {
          console.log(`  ✅ [${t.id}] ${t.description}`);
          passed++;
        } else {
          console.log(`  ❌ [${t.id}] ${t.description}`);
          console.log(`     Expected: ${JSON.stringify(result.expected)}`);
          console.log(`     Actual:   ${JSON.stringify(result.actual)}`);
          if (result.message) console.log(`     Note:     ${result.message}`);
          failed++;
          failures.push({ id: t.id, desc: t.description, ...result });
        }
      } catch (err: any) {
        console.log(`  💥 [${t.id}] EXCEPTION: ${err.message}`);
        failed++;
        failures.push({ id: t.id, desc: t.description, error: err.message });
      }
    }
  }

  console.log("\n" + "═".repeat(70));
  console.log(`TOTAL EXECUTED: ${tests.length}`);
  console.log(`PASSED:         ${passed} (${((passed / tests.length) * 100).toFixed(1)}%)`);
  console.log(`FAILED:         ${failed}`);
  console.log("═".repeat(70) + "\n");

  if (failed === 0) {
    console.log("🎉 ALL QUOTATION ORACLE INVARIANTS AND SPECIFICATIONS PASSED!\n");
    process.exit(0);
  } else {
    console.error(`⚠️ ${failed} test(s) failed. See output above for variance.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
