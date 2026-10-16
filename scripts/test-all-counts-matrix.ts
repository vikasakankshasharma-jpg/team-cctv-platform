import { calculatePricing } from "../lib/pricing-engine";
import { testProducts, testAddons, testSettings } from "./execute-all-238-tests";
import { getProductChannelCapacity } from "../lib/product-resolver";

async function runComprehensiveMatrix() {
  console.log("==================================================================");
  console.log("   COMPREHENSIVE ALL-CAMERA-COUNT & ALL-TECH AUDIT MATRIX        ");
  console.log("==================================================================");

  // Fetch live products
  const res = await fetch("https://cctvquotation.com/api/products");
  const catalog = await res.json();
  const liveProducts = catalog.products || [];
  const liveAddons = catalog.addons || [];

  const countsToTest = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 20, 24, 32];
  const brandsToTest = ["CP Plus", "Budget Brand", "all"];
  const resolutionsToTest = ["2MP", "4MP", "5MP", "8MP"];

  let totalTests = 0;
  let passedTests = 0;
  const issues: string[] = [];

  for (const count of countsToTest) {
    for (const tech of ["HD", "IP", "Wireless"] as const) {
      for (const brand of brandsToTest) {
        // Skip brand/resolution permutations that don't apply
        const resList = tech === "Wireless" ? ["3MP"] : resolutionsToTest;
        
        for (const res of resList) {
          totalTests++;
          const label = `[${tech} | ${count} cams | ${res} | ${brand}]`;

          try {
            const quote = calculatePricing({
              selection: {
                technology: tech,
                camera_count: count,
                brand_preference: brand,
                resolution_preference: res,
                recording_days: 7,
                recording_mode: "motion"
              },
              products: liveProducts,
              addons: liveAddons,
              settings: {
                ...testSettings,
                labor_ip_per_camera: 500,
                labor_hd_per_camera: 400
              }
            });

            // If industrial (e.g. HD > 16 cams or Wireless > 16 cams or IP > 32 cams)
            if (quote.requiresIndustrialQuote || (quote as any).is_industrial) {
              passedTests++;
              continue;
            }

            if (quote.error) {
              issues.push(`${label} Returned error: ${quote.error_message}`);
              continue;
            }

            // INVARIANT 1: Check Camera Items
            const cameraItems = quote.items.filter(i => {
              const p = liveProducts.find(prod => prod.id === i.product_id);
              const name = (i.display_name || "").toLowerCase();
              const isAccessory = name.includes("junction") || name.includes("connector") || name.includes("cable") || name.includes("rack") || name.includes("box");
              return (p?.category === "cctv_camera" || name.includes("camera") || name.includes("bullet") || name.includes("dome")) && !isAccessory;
            });
            const totalCamQty = cameraItems.reduce((s, i) => s + i.qty, 0);
            if (totalCamQty !== count) {
              issues.push(`${label} Camera qty mismatch: expected ${count}, got ${totalCamQty}`);
              continue;
            }

            // INVARIANT 2: Check Recorder
            const rec = quote.items.find(i => i.display_name?.toLowerCase().includes("nvr") || i.display_name?.toLowerCase().includes("dvr"));
            if (tech === "Wireless") {
              if (rec) {
                issues.push(`${label} Wireless setup should not have a recorder, but got: ${rec.display_name}`);
                continue;
              }
            } else {
              if (!rec) {
                issues.push(`${label} Missing recorder for ${tech} setup!`);
                continue;
              }
              const recCap = getProductChannelCapacity(liveProducts.find(p => p.id === rec.product_id) || (rec as any));
              if (recCap < count) {
                issues.push(`${label} Recorder capacity (${recCap}Ch) is LESS than camera count (${count})! ${rec.display_name}`);
                continue;
              }
              // Technology separation
              if (tech === "IP" && rec.display_name?.toLowerCase().includes("dvr") && !rec.display_name?.toLowerCase().includes("nvr")) {
                issues.push(`${label} IP setup selected a DVR: ${rec.display_name}`);
                continue;
              }
              if (tech === "HD" && rec.display_name?.toLowerCase().includes("nvr") && !rec.display_name?.toLowerCase().includes("dvr")) {
                issues.push(`${label} HD setup selected an NVR: ${rec.display_name}`);
                continue;
              }
            }

            // INVARIANT 3: Check Power Transmission
            const pwr = quote.items.find(i => i.display_name?.toLowerCase().includes("poe") || i.display_name?.toLowerCase().includes("smps") || i.display_name?.toLowerCase().includes("power"));
            if (tech === "Wireless") {
              // Wireless cameras use standard adapters or individual plugs, power supplies optional
            } else {
              if (!pwr) {
                issues.push(`${label} Missing power supply / PoE for ${tech} setup!`);
                continue;
              }
              if (tech === "IP") {
                if (pwr.display_name?.toLowerCase().includes("smps")) {
                  issues.push(`${label} IP setup selected an Analog SMPS: ${pwr.display_name}`);
                  continue;
                }
                const pwrProduct = liveProducts.find(p => p.id === pwr.product_id) || (pwr as any);
                const switchPorts = getProductChannelCapacity(pwrProduct);
                const totalPorts = switchPorts * pwr.qty;
                if (totalPorts < count) {
                  issues.push(`${label} Total PoE ports (${totalPorts}) is LESS than camera count (${count})! ${pwr.display_name} x ${pwr.qty}`);
                  continue;
                }
                // Port tier sizing: if count <= 4 and an 8-port switch is available, we shouldn't pick 16-port or multiple switches
                if (count <= 4 && switchPorts > 8) {
                  issues.push(`${label} Oversized PoE switch chosen for <= 4 cameras: ${pwr.display_name}`);
                  continue;
                }
                if (count <= 4 && pwr.qty > 1) {
                  issues.push(`${label} Multiple PoE switches quoted for ${count} cameras: ${pwr.display_name} x ${pwr.qty}`);
                  continue;
                }
                if (count > 4 && count <= 8 && switchPorts === 4 && pwr.qty > 1) {
                  // Check if an 8-port switch exists in the catalog for this brand
                  const eightPortExists = liveProducts.some(p => {
                    const isIP = (p.technologies || []).includes("IP") || p.technology === "IP";
                    const isPoe = (p.display_name || "").toLowerCase().includes("poe");
                    const cap = getProductChannelCapacity(p);
                    return isIP && isPoe && cap >= 8;
                  });
                  if (eightPortExists) {
                    issues.push(`${label} Quoted multiple 4-port switches instead of an 8-port switch for ${count} cameras: ${pwr.display_name} x ${pwr.qty}`);
                    continue;
                  }
                }
              } else if (tech === "HD") {
                if (pwr.display_name?.toLowerCase().includes("poe")) {
                  issues.push(`${label} HD setup selected a PoE Switch: ${pwr.display_name}`);
                  continue;
                }
                const pwrProduct = liveProducts.find(p => p.id === pwr.product_id) || (pwr as any);
                const smpsCap = getProductChannelCapacity(pwrProduct);
                const totalSmpsCap = smpsCap * pwr.qty;
                if (totalSmpsCap < count) {
                  issues.push(`${label} Total SMPS capacity (${totalSmpsCap}) is LESS than camera count (${count})! ${pwr.display_name} x ${pwr.qty}`);
                  continue;
                }
              }
            }

            // INVARIANT 4: Labor Billing
            const labor = quote.items.find(i => i.product_id?.includes("labor_install"));
            if (tech === "Wireless") {
              if (labor) {
                issues.push(`${label} Wireless setup should have 0 cable installation labor, but found: ${labor.display_name}`);
                continue;
              }
            } else {
              if (!labor) {
                issues.push(`${label} Missing installation labor for wired setup!`);
                continue;
              }
              if (labor.qty !== count) {
                issues.push(`${label} Labor qty (${labor.qty}) does not match camera count (${count})!`);
                continue;
              }
              const expectedRate = tech === "IP" ? 500 : 400;
              if (labor.unit_price !== expectedRate) {
                issues.push(`${label} Labor unit price (₹${labor.unit_price}) does not match expected rate (₹${expectedRate})!`);
                continue;
              }
            }

            // INVARIANT 5: Connectors & Junction Boxes
            if (tech !== "Wireless") {
              const junction = quote.items.find(i => i.product_id?.includes("junction_box"));
              if (!junction || junction.qty !== count) {
                issues.push(`${label} Junction box qty (${junction?.qty}) does not match camera count (${count})!`);
                continue;
              }
            }

            // INVARIANT 6: Currency Symbols
            const brokenItem = quote.items.find(i => i.display_name?.includes("?"));
            if (brokenItem) {
              issues.push(`${label} Item display name contains literal '?' symbol: ${brokenItem.display_name}`);
              continue;
            }

            passedTests++;
          } catch (err: any) {
            issues.push(`${label} Exception thrown: ${err.message}`);
          }
        }
      }
    }
  }

  console.log(`\n==================================================================`);
  console.log(`TOTAL CONFIGURATIONS TESTED: ${totalTests}`);
  console.log(`PASSED:                      ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`ISSUES DETECTED:             ${issues.length}`);
  console.log(`==================================================================\n`);

  if (issues.length > 0) {
    console.log("DETECTED ISSUES:");
    issues.forEach((iss, idx) => console.log(`  ${idx + 1}. ${iss}`));
    process.exit(1);
  } else {
    console.log("PERFECT SCORE! All camera counts, technologies, resolutions, and brands passed with 100% mathematical and technical integrity!");
  }
}

runComprehensiveMatrix().catch(e => {
  console.error(e);
  process.exit(1);
});
