const fs = require("fs");
let content = fs.readFileSync("app/api/quote/save/route.ts", "utf8");

const loopStart = /let subtotal = 0;\r?\n\s*const verifiedItems: any\[\] = \[\];\r?\n\r?\n\s*for \(const item of configurationSnapshot\.items as any\[\]\) \{/;

const preLoop = `
      let totalWiredCameras = 0;
      let totalCableMeters = 0;
      let isIPSystem = false;
      
      for (const item of configurationSnapshot.items as any[]) {
          const dbProduct = catalog.find(p => p.id === item.product_id) || addons.find(a => a.id === item.product_id) || { category: item.category };
          const cat = (dbProduct.category || "").toLowerCase();
          const qty = Math.max(1, Math.min(100, Math.floor(Number(item.qty || 1))));
          
          if (cat === "cctv_camera" || cat.includes("camera")) {
              if (item.product_id?.toLowerCase().includes("ip")) isIPSystem = true;
              if (!item.product_id?.toLowerCase().includes("wifi") && !item.product_id?.toLowerCase().includes("wireless")) {
                  totalWiredCameras += qty;
              }
          } else if (cat === "cable") {
              const name = (dbProduct.display_name || item.name || "").toLowerCase();
              let lengthInItem = 90;
              if (name.includes("305")) lengthInItem = 305;
              else if (name.includes("70")) lengthInItem = 70;
              else if (name.includes("100")) lengthInItem = 100;
              else if (name.match(/(\d+)\s*m/)) {
                  lengthInItem = parseInt(name.match(/(\d+)\s*m/)[1], 10);
              }
              totalCableMeters += (lengthInItem * qty);
          }
      }
      
      const cablingDone = requirementSnapshot.cabling_done ?? false;
      const strictLaborRate = cablingDone 
          ? (settings.labor_fitting_only_rate || 300)
          : (isIPSystem ? (settings.labor_ip_per_camera || settings.labor_full_installation_rate || 500) : (settings.labor_hd_per_camera || settings.labor_full_installation_rate || 400));

      let subtotal = 0;
      const verifiedItems: any[] = [];
      for (const item of configurationSnapshot.items as any[]) {`;

content = content.replace(loopStart, preLoop);

const laborPriceLogic = /\} else if \(cat === "labor" \|\| cat === "installation" \|\| cat\.includes\("surcharge"\)\) \{\r?\n\s*\/\/ Surcharges and labor use labor_margin\r?\n\s*verifiedUnitPrice = Math\.round\(baseCost\);\r?\n\s*\}/;

const newLaborPriceLogic = `} else if (cat === "labor" || cat === "installation") {
            // Strict rule: Overwrite any catalog price with the strict market rate
            verifiedUnitPrice = Math.round(strictLaborRate);
        } else if (cat.includes("surcharge")) {
            // Surcharges have no margin
            verifiedUnitPrice = Math.round(baseCost);
        }`;

content = content.replace(laborPriceLogic, newLaborPriceLogic);

fs.writeFileSync("app/api/quote/save/route.ts", content);

