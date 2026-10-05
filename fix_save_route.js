const fs = require("fs");
let content = fs.readFileSync("app/api/quote/save/route.ts", "utf8");

// We need to inject the logic to find total cameras and cable meters first
const loopStart = "      let subtotal = 0;\n      for (const item of snapshot.items) {";
const preLoop = `
      let totalWiredCameras = 0;
      let totalCableMeters = 0;
      let isIPSystem = false;
      
      for (const item of snapshot.items) {
          const dbProduct = catalog.find(p => p.id === item.product_id) || addons.find(a => a.id === item.product_id) || { category: item.category };
          const cat = (dbProduct.category || "").toLowerCase();
          const qty = Math.max(1, Math.min(100, Math.floor(Number(item.qty || 1))));
          
          if (cat === "cctv_camera" || cat.includes("camera")) {
              if (item.product_id?.toLowerCase().includes("ip")) isIPSystem = true;
              // Ignore wireless cameras for labor rules
              if (!item.product_id?.toLowerCase().includes("wifi") && !item.product_id?.toLowerCase().includes("wireless")) {
                  totalWiredCameras += qty;
              }
          } else if (cat === "cable") {
              // Usually cable comes in 90m bundles in Custom Build.
              // If the product ID or name suggests a bundle, we should multiply by bundle length?
              // Wait, the rule is just "total_cable_length_meters". In Custom Build, they select bundles.
              // A bundle of 90m is qty=1. We must extract length from product name!
              const name = (dbProduct.display_name || item.name || "").toLowerCase();
              let lengthInItem = 90; // default assumption for bundle
              if (name.includes("305")) lengthInItem = 305;
              else if (name.includes("70")) lengthInItem = 70;
              else if (name.includes("100")) lengthInItem = 100;
              else if (name.includes("m") && name.match(/(\d+)\s*m/)) {
                  lengthInItem = parseInt(name.match(/(\d+)\s*m/)[1], 10);
              }
              totalCableMeters += (lengthInItem * qty);
          }
      }
      
      const cablingDone = requirementSnapshot.cabling_done ?? false;
      const strictLaborRate = cablingDone 
          ? (settings.labor_fitting_only_rate || 300)
          : (isIPSystem ? (settings.labor_ip_per_camera || settings.labor_full_installation_rate || 500) : (settings.labor_hd_per_camera || settings.labor_full_installation_rate || 400));
`;

content = content.replace(loopStart, preLoop + "\n" + loopStart);

const laborPriceLogic = `        } else if (cat === "labor" || cat === "installation" || cat.includes("surcharge")) {
            // Surcharges and labor use labor_margin
            verifiedUnitPrice = Math.round(baseCost);
        }`;

const newLaborPriceLogic = `        } else if (cat === "labor" || cat === "installation") {
            // Strict rule: Overwrite any catalog price with the strict market rate
            verifiedUnitPrice = Math.round(strictLaborRate);
        } else if (cat.includes("surcharge")) {
            // Surcharges have no margin
            verifiedUnitPrice = Math.round(baseCost);
        }`;

content = content.replace(laborPriceLogic, newLaborPriceLogic);

// Add the excess cabling injection after the loop
const afterLoop = `      const gstRate = settings.gst_rate || 18;`;
const excessLogic = `      // Strict Rule: Excess Cabling Labor
      if (!cablingDone && totalWiredCameras > 0 && totalCableMeters > 0) {
          const defaultMetersPerCamera = 15;
          const freeLimit = totalWiredCameras * defaultMetersPerCamera;
          const excessMeters = Math.max(0, totalCableMeters - freeLimit);
          
          if (excessMeters > 0) {
              const excessLaborRate = 15;
              const excessLineTotal = excessLaborRate * excessMeters;
              subtotal += excessLineTotal;
              verifiedItems.push({
                  product_id: "labor_cabling_excess",
                  name: \`Excess Cabling Installation Labor (\${excessMeters}m beyond \${freeLimit}m free limit)\`,
                  category: "labor",
                  unit_price: excessLaborRate,
                  qty: excessMeters,
                  line_total: excessLineTotal
              });
          }
      }
      
      const gstRate = settings.gst_rate || 18;`;

content = content.replace(afterLoop, excessLogic);

fs.writeFileSync("app/api/quote/save/route.ts", content);

