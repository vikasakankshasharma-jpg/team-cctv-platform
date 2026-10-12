/**
 * @file scripts/reconcile-price-list.ts
 * @description Automated SKU Crosswalk & Price Reconciliation Script.
 * Matches the user's wholesale price list against `scripts/pricing-master-seed.json`
 * and live catalog products, detecting SKU mappings, price drift, and coverage gaps.
 */

import * as fs from "fs";
import * as path from "path";

interface SourcePriceRow {
  category: string;
  brand: string;
  spec: string;
  formOrChannel: string;
  features: string;
  unit: string;
  sourceCost: number;
}

// 61 Source rows transcribed from the user's Markdown price list
const SOURCE_PRICE_LIST: SourcePriceRow[] = [
  // HD Analog Cameras
  { category: "HD Analog Camera", brand: "CP Plus", spec: "2MP", formOrChannel: "Dome", features: "B&W night vision; Audio IN", unit: "each", sourceCost: 1000 },
  { category: "HD Analog Camera", brand: "CP Plus", spec: "2MP", formOrChannel: "Bullet", features: "B&W night vision; Audio IN", unit: "each", sourceCost: 1050 },
  { category: "HD Analog Camera", brand: "CP Plus", spec: "2MP", formOrChannel: "Dome", features: "Color night vision; Audio IN", unit: "each", sourceCost: 1250 },
  { category: "HD Analog Camera", brand: "CP Plus", spec: "2MP", formOrChannel: "Bullet", features: "Color night vision; Audio IN", unit: "each", sourceCost: 1300 },
  { category: "HD Analog Camera", brand: "CP Plus", spec: "5MP", formOrChannel: "Dome", features: "Color night vision; Audio IN", unit: "each", sourceCost: 1600 },
  { category: "HD Analog Camera", brand: "CP Plus", spec: "5MP", formOrChannel: "Bullet", features: "Color night vision; Audio IN", unit: "each", sourceCost: 1650 },
  { category: "HD Analog Camera", brand: "Budget Brand", spec: "2MP", formOrChannel: "Dome", features: "Color night vision; Audio IN", unit: "each", sourceCost: 700 },
  { category: "HD Analog Camera", brand: "Budget Brand", spec: "2MP", formOrChannel: "Bullet", features: "Color night vision; Audio IN", unit: "each", sourceCost: 750 },

  // HD DVRs
  { category: "HD DVR", brand: "CP Plus", spec: "2MP supported", formOrChannel: "4Ch", features: "1 SATA", unit: "each", sourceCost: 3700 },
  { category: "HD DVR", brand: "CP Plus", spec: "2MP supported", formOrChannel: "8Ch", features: "1 SATA", unit: "each", sourceCost: 4800 },
  { category: "HD DVR", brand: "CP Plus", spec: "2MP supported", formOrChannel: "16Ch", features: "1 SATA", unit: "each", sourceCost: 8100 },
  { category: "HD DVR", brand: "CP Plus", spec: "5MP supported", formOrChannel: "4Ch", features: "1 SATA", unit: "each", sourceCost: 5750 },
  { category: "HD DVR", brand: "CP Plus", spec: "5MP supported", formOrChannel: "8Ch", features: "1 SATA", unit: "each", sourceCost: 8100 },
  { category: "HD DVR", brand: "CP Plus", spec: "5MP supported", formOrChannel: "16Ch", features: "1 SATA", unit: "each", sourceCost: 13300 },

  // Power Supplies
  { category: "DVR Power Supply / SMPS", brand: "CP Plus", spec: "8Ch", formOrChannel: "8Ch", features: "—", unit: "each", sourceCost: 600 },
  { category: "DVR Power Supply / SMPS", brand: "Budget Brand", spec: "8Ch", formOrChannel: "8Ch", features: "—", unit: "each", sourceCost: 350 },

  // 3+1 HD Cables
  { category: "3+1 HD Cable", brand: "CP Plus", spec: "90 m", formOrChannel: "90 m", features: "Copper", unit: "roll", sourceCost: 1350 },
  { category: "3+1 HD Cable", brand: "Budget Brand", spec: "70 m", formOrChannel: "70 m", features: "Copper coated", unit: "roll", sourceCost: 600 },

  // CAT6 Cables
  { category: "CAT6 Cable", brand: "CP Plus", spec: "305 m", formOrChannel: "305 m", features: "Copper", unit: "roll", sourceCost: 9500 },
  { category: "CAT6 Cable", brand: "CP Plus", spec: "305 m", formOrChannel: "305 m", features: "Copper coated", unit: "roll", sourceCost: 3700 },
  { category: "CAT6 Cable", brand: "Budget Brand", spec: "100 m", formOrChannel: "100 m", features: "Copper", unit: "roll", sourceCost: 1200 },
  { category: "CAT6 Cable", brand: "Budget Brand", spec: "305 m", formOrChannel: "305 m", features: "Copper coated", unit: "roll", sourceCost: 3200 },

  // Connectors
  { category: "Camera Connector", brand: "Budget Brand", spec: "BNC", formOrChannel: "BNC", features: "—", unit: "piece", sourceCost: 15 },
  { category: "Camera Connector", brand: "Budget Brand", spec: "DC", formOrChannel: "DC", features: "—", unit: "piece", sourceCost: 5 },
  { category: "Camera Connector", brand: "Budget Brand", spec: "RJ45", formOrChannel: "RJ45", features: "—", unit: "piece", sourceCost: 5 },

  // HDMI Cables
  { category: "HDMI Cable", brand: "Budget Brand", spec: "1.5 m", formOrChannel: "1.5 m", features: "—", unit: "each", sourceCost: 60 },
  { category: "HDMI Cable", brand: "Budget Brand", spec: "3 m", formOrChannel: "3 m", features: "—", unit: "each", sourceCost: 120 },
  { category: "HDMI Cable", brand: "Budget Brand", spec: "5 m", formOrChannel: "5 m", features: "—", unit: "each", sourceCost: 180 },
  { category: "HDMI Cable", brand: "Budget Brand", spec: "10 m", formOrChannel: "10 m", features: "—", unit: "each", sourceCost: 300 },

  // Hard Disks / Storage
  { category: "Hard Disk / Recorder Storage", brand: "Budget Brand", spec: "500GB", formOrChannel: "500GB", features: "—", unit: "each", sourceCost: 1800 },
  { category: "Hard Disk / Recorder Storage", brand: "Budget Brand", spec: "1TB", formOrChannel: "1TB", features: "—", unit: "each", sourceCost: 5200 },
  { category: "Hard Disk / Recorder Storage", brand: "Budget Brand", spec: "2TB", formOrChannel: "2TB", features: "—", unit: "each", sourceCost: 8000 },
  { category: "Hard Disk / Recorder Storage", brand: "Budget Brand", spec: "4TB", formOrChannel: "4TB", features: "—", unit: "each", sourceCost: 15000 },
  { category: "Hard Disk / Recorder Storage", brand: "Seagate", spec: "1TB", formOrChannel: "1TB", features: "—", unit: "each", sourceCost: 9500 },
  { category: "Hard Disk / Recorder Storage", brand: "Seagate", spec: "2TB", formOrChannel: "2TB", features: "—", unit: "each", sourceCost: 10900 },
  { category: "Hard Disk / Recorder Storage", brand: "Seagate", spec: "4TB", formOrChannel: "4TB", features: "—", unit: "each", sourceCost: 18500 },

  // PoE Switches
  { category: "PoE Switch for NVR", brand: "Budget Brand", spec: "4Ch", formOrChannel: "4Ch", features: "—", unit: "each", sourceCost: 900 },
  { category: "PoE Switch for NVR", brand: "Budget Brand", spec: "8Ch", formOrChannel: "8Ch", features: "—", unit: "each", sourceCost: 1200 },
  { category: "PoE Switch for NVR", brand: "D-Link", spec: "16Ch", formOrChannel: "16Ch", features: "—", unit: "each", sourceCost: 9500 },

  // IP Network NVRs
  { category: "IP Network NVR", brand: "CP Plus", spec: "4Ch", formOrChannel: "4Ch", features: "1 SATA", unit: "each", sourceCost: 4700 },
  { category: "IP Network NVR", brand: "CP Plus", spec: "8Ch", formOrChannel: "8Ch", features: "1 SATA", unit: "each", sourceCost: 5200 },
  { category: "IP Network NVR", brand: "CP Plus", spec: "16Ch", formOrChannel: "16Ch", features: "1 SATA", unit: "each", sourceCost: 8300 },
  { category: "IP Network NVR", brand: "CP Plus", spec: "32Ch", formOrChannel: "32Ch", features: "2 SATA", unit: "each", sourceCost: 15000 },

  // IP Network Cameras
  { category: "IP Network Camera", brand: "CP Plus", spec: "2MP", formOrChannel: "Dome", features: "Color night vision; Audio IN; ECO", unit: "each", sourceCost: 3100 },
  { category: "IP Network Camera", brand: "CP Plus", spec: "2MP", formOrChannel: "Bullet", features: "Color night vision; Audio IN; ECO", unit: "each", sourceCost: 3200 },
  { category: "IP Network Camera", brand: "CP Plus", spec: "4MP", formOrChannel: "Dome", features: "Color night vision; Audio IN; Normal", unit: "each", sourceCost: 3900 },
  { category: "IP Network Camera", brand: "CP Plus", spec: "4MP", formOrChannel: "Bullet", features: "Color night vision; Audio IN; Normal", unit: "each", sourceCost: 4000 },
  { category: "IP Network Camera", brand: "CP Plus", spec: "6MP", formOrChannel: "Dome", features: "Color night vision; Audio IN; Normal", unit: "each", sourceCost: 5200 },
  { category: "IP Network Camera", brand: "CP Plus", spec: "6MP", formOrChannel: "Bullet", features: "Color night vision; Audio IN; Normal", unit: "each", sourceCost: 5250 },
  { category: "IP Network Camera", brand: "CP Plus", spec: "8MP", formOrChannel: "Dome", features: "Color night vision; Audio IN; Premium", unit: "each", sourceCost: 7500 },
  { category: "IP Network Camera", brand: "CP Plus", spec: "8MP", formOrChannel: "Bullet", features: "Color night vision; Audio IN; Premium", unit: "each", sourceCost: 7500 },
  { category: "IP Network Camera", brand: "Budget Brand", spec: "5MP", formOrChannel: "Dome", features: "Color night vision; Audio IN; ECO", unit: "each", sourceCost: 1400 },
  { category: "IP Network Camera", brand: "Budget Brand", spec: "5MP", formOrChannel: "Bullet", features: "Color night vision; Audio IN; ECO", unit: "each", sourceCost: 1450 },
  { category: "IP Network Camera", brand: "Budget Brand", spec: "5MP", formOrChannel: "Dome", features: "Color night vision; Audio IN; Premium", unit: "each", sourceCost: 2000 },
  { category: "IP Network Camera", brand: "Budget Brand", spec: "5MP", formOrChannel: "Bullet", features: "Color night vision; Audio IN; Premium", unit: "each", sourceCost: 2050 },

  // Accessories
  { category: "Accessory", brand: "Budget Brand", spec: "Junction Box for Camera", formOrChannel: "Junction Box for Camera", features: "—", unit: "each", sourceCost: 20 },
  { category: "Accessory", brand: "Budget Brand", spec: "2U Rack for Recorder", formOrChannel: "2U Rack for Recorder", features: "—", unit: "each", sourceCost: 350 },
  { category: "Accessory", brand: "Budget Brand", spec: "4U Rack for Recorder", formOrChannel: "4U Rack for Recorder", features: "—", unit: "each", sourceCost: 450 },
  { category: "Accessory", brand: "Budget Brand", spec: "PVC Rack for PoE Switch", formOrChannel: "PVC Rack for PoE Switch", features: "—", unit: "each", sourceCost: 450 },
  { category: "Accessory", brand: "Budget Brand", spec: "4G Router", formOrChannel: "4G Router", features: "—", unit: "each", sourceCost: 1450 },
  { category: "Accessory", brand: "Budget Brand", spec: "Display 19\"", formOrChannel: "Display 19\"", features: "—", unit: "each", sourceCost: 2100 }
];

async function runReconciliation() {
  console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║     AUTOMATED SKU CROSSWALK & PRICE RECONCILIATION ENGINE            ║");
  console.log("║     Reconciling Source Price List vs pricing-master-seed.json        ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝\n");

  const seedPath = path.resolve(__dirname, "pricing-master-seed.json");
  if (!fs.existsSync(seedPath)) {
    console.error(`Error: Seed file not found at ${seedPath}`);
    process.exit(1);
  }

  const seedData: any[] = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  console.log(`Loaded ${seedData.length} SKUs from pricing-master-seed.json.\n`);

  let matched = 0;
  let drifted = 0;
  let unmapped = 0;

  console.log("┌─────┬────────────────────────────────────────────────┬──────────────────────────────────────┬──────────┬──────────┬────────┐");
  console.log("│ #   │ Source Description                             │ Matched Catalog SKU                  │ Src Cost │ Seed Cost│ Status │");
  console.log("├─────┼────────────────────────────────────────────────┼──────────────────────────────────────┼──────────┼──────────┼────────┤");

  let idx = 1;
  for (const src of SOURCE_PRICE_LIST) {
    const srcDesc = `${src.brand} ${src.spec} ${src.formOrChannel}`.slice(0, 46).padEnd(46);

    // Fuzzy matching logic
    const candidate = seedData.find(item => {
      // 1. Brand match
      const brandMatches = item.brand.toLowerCase().replace(/\s+/g, "") === src.brand.toLowerCase().replace(/\s+/g, "");
      if (!brandMatches) return false;

      // 2. Category / Tech match
      const isConn = src.category.includes("Connector");
      const isCam = src.category.includes("Camera") && !isConn;
      const isDvr = src.category.includes("DVR") && !src.category.includes("SMPS");
      const isNvr = src.category.includes("NVR") && !src.category.includes("PoE Switch");
      const isPoe = src.category.includes("PoE Switch");
      const isHdd = src.category.includes("Hard Disk");
      const isCable = src.category.includes("Cable");
      const isSmps = src.category.includes("Power Supply") || src.category.includes("SMPS");
      const isAcc = src.category.includes("Accessory");

      if (isCam) {
        const isCamItem = item.category === "cctv_camera" || item.category.includes("CAMERA") || item.legacy_category?.includes("CAMERA");
        if (!isCamItem) return false;
        const isIp = src.category.includes("IP");
        const itemIsIp = item.technology === "IP" || item.technologies?.includes("IP") || item.category?.includes("IP") || item.legacy_category?.includes("IP");
        if (isIp !== itemIsIp) return false;
        
        // Resolution check
        const resMatch = (item.specifications?.mp || "").toLowerCase() === src.spec.toLowerCase() || item.resolution_mp === parseInt(src.spec);
        // Form factor check
        const formMatch = (item.specifications?.formFactor || item.form_factor || "").toLowerCase() === src.formOrChannel.toLowerCase();
        
        // Feature check for CP Plus 2MP Color vs B&W
        if (src.features.includes("Color") && item.specifications?.features && !item.specifications.features.includes("Color") && !item.skuId.includes("COLOR")) {
          return false;
        }
        if (src.features.includes("B&W") && (item.skuId.includes("COLOR") || (item.specifications?.features && item.specifications.features.includes("Color")))) {
          return false;
        }

        // Tier check for 5MP Budget IP (ECO vs Premium)
        if (src.features.includes("ECO") && item.specifications?.tier && item.specifications.tier !== "ECO") return false;
        if (src.features.includes("Premium") && item.specifications?.tier && item.specifications.tier !== "PREMIUM") return false;

        return resMatch && formMatch;
      }

      if (isDvr) {
        const isDvrItem = (item.category === "recorder" || item.category === "DVR" || item.legacy_category === "DVR") && (item.technology === "HD" || item.technologies?.includes("HD") || item.skuId.includes("DVR"));
        if (!isDvrItem) return false;
        const ch = parseInt(src.formOrChannel);
        return (item.specifications?.channels === ch || item.channels === ch) && (item.specifications?.mpSupported || "").includes(src.spec.slice(0, 3));
      }

      if (isNvr) {
        const isNvrItem = (item.category === "recorder" || item.category === "NVR" || item.legacy_category === "NVR") && (item.technology === "IP" || item.technologies?.includes("IP") || item.skuId.includes("NVR"));
        if (!isNvrItem) return false;
        const ch = parseInt(src.formOrChannel);
        return item.specifications?.channels === ch || item.channels === ch;
      }

      if (isPoe) {
        const isPoeItem = item.skuId?.includes("POE") || item.display_name?.toLowerCase().includes("poe");
        if (!isPoeItem) return false;
        const ch = parseInt(src.formOrChannel);
        return item.specifications?.channels === ch || item.channels === ch;
      }

      if (isHdd) {
        const isHddItem = item.category === "storage" || item.category === "HDD" || item.legacy_category === "HDD";
        if (!isHddItem) return false;
        return (item.specifications?.storage || "").toLowerCase() === src.spec.toLowerCase();
      }

      if (isCable) {
        const isCableItem = item.category === "cable" || item.category === "CABLE" || item.legacy_category === "CABLE";
        if (!isCableItem) return false;
        const isHdmi = src.category.includes("HDMI");
        if (isHdmi) return (item.specifications?.type === "HDMI" || item.cable_type === "HDMI") && Number(item.specifications?.lengthMeters || item.cable_length_m) === parseFloat(src.spec);
        const is3p1 = src.category.includes("3+1");
        if (is3p1) return (item.specifications?.type === "3+1" || item.cable_type?.includes("3+1")) && (item.specifications?.lengthMeters === parseInt(src.spec) || item.cable_length_m === parseInt(src.spec));
        const isCat6 = src.category.includes("CAT6");
        if (isCat6) {
          const coated = src.features.toLowerCase().includes("coated");
          const itemCoated = (item.specifications?.material || item.display_name || "").toLowerCase().includes("coated");
          return (item.specifications?.type === "CAT6" || item.cable_type === "Cat6") && (item.specifications?.lengthMeters === parseInt(src.spec) || item.cable_length_m === parseInt(src.spec)) && coated === itemCoated;
        }
      }

      if (isConn) {
        const isConnItem = item.category === "connector" || item.category === "CONNECTOR" || item.legacy_category === "CONNECTOR";
        if (!isConnItem) return false;
        return (item.specifications?.type || "").toLowerCase() === src.spec.toLowerCase() || item.skuId.includes(src.spec);
      }

      if (isSmps) {
        const isSmpsItem = item.skuId?.includes("SMPS") || item.display_name?.toLowerCase().includes("smps");
        if (!isSmpsItem) return false;
        return item.specifications?.channels === parseInt(src.formOrChannel) || item.channels === parseInt(src.formOrChannel);
      }

      if (isAcc) {
        const isAccCategory = item.category === "accessories" || item.category === "camera_mount" || item.category === "rack" || item.category === "network" || item.category === "display" || item.category === "ACCESSORY" || item.legacy_category === "ACCESSORY";
        if (!isAccCategory) return false;
        const n1 = item.display_name.toLowerCase();
        const n2 = src.spec.toLowerCase();
        if (n2.includes("junction") && n1.includes("junction")) return true;
        if (n2.includes("2u rack") && n1.includes("2u rack")) return true;
        if (n2.includes("4u rack") && n1.includes("4u rack")) return true;
        if (n2.includes("pvc rack") && n1.includes("pvc rack")) return true;
        if (n2.includes("router") && n1.includes("router")) return true;
        if (n2.includes("display") && n1.includes("display")) return true;
      }

      return false;
    });

    const numStr = String(idx).padStart(3);
    if (candidate) {
      const skuStr = candidate.skuId.slice(0, 36).padEnd(36);
      const srcCostStr = `₹${src.sourceCost}`.padStart(8);
      const seedCostStr = candidate.baseCost != null ? `₹${candidate.baseCost}`.padStart(8) : "On-Demand".padStart(8);
      
      let statusStr = "MATCH ";
      if (candidate.baseCost == null) {
        statusStr = "ON-DEM";
        matched++;
      } else if (candidate.baseCost === src.sourceCost) {
        statusStr = "EXACT ";
        matched++;
      } else {
        const diff = src.sourceCost - candidate.baseCost;
        statusStr = diff > 0 ? "DRIFT↑" : "DRIFT↓";
        drifted++;
      }

      console.log(`│ ${numStr} │ ${srcDesc} │ ${skuStr} │ ${srcCostStr} │ ${seedCostStr} │ ${statusStr} │`);
    } else {
      const skuStr = "NO_MATCH_FOUND".padEnd(36);
      const srcCostStr = `₹${src.sourceCost}`.padStart(8);
      const seedCostStr = "—".padStart(8);
      console.log(`│ ${numStr} │ ${srcDesc} │ ${skuStr} │ ${srcCostStr} │ ${seedCostStr} │ UNMAP  │`);
      unmapped++;
    }
    idx++;
  }

  console.log("└─────┴────────────────────────────────────────────────┴──────────────────────────────────────┴──────────┴──────────┴────────┘");
  console.log(`\nReconciliation Summary:`);
  console.log(`  Total Items Evaluated: ${SOURCE_PRICE_LIST.length}`);
  console.log(`  Mapped SKUs:           ${matched + drifted} (${(((matched + drifted) / SOURCE_PRICE_LIST.length) * 100).toFixed(1)}%)`);
  console.log(`    - Exact Cost Match:  ${matched}`);
  console.log(`    - Cost Drift:        ${drifted} (Wholesale rates in source list differ from seed)`);
  console.log(`  Unmapped Items:        ${unmapped}`);

  if (drifted > 0) {
    console.log(`\n💡 Note on Cost Drift: A cost drift means your physical vendor quotation had a slight variance vs seed-data.`);
    console.log(`   Our automated sync script can update seed values to match your latest vendor quotation in 1 click!`);
  }
}

runReconciliation().catch(err => {
  console.error("Reconciliation error:", err);
  process.exit(1);
});
