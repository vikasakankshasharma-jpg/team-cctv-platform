import fs from "fs";

let content = fs.readFileSync("app/api/quote/generate/route.ts", "utf8");

const replacement = `
    // 3. Extract unique brands from catalog
    const brands = new Set<string>();
    catalog.forEach(p => {
       if (p.category === "cctv_camera" || p.category === "recorder" || p.category === "CAMERA_HD" || p.category === "CAMERA_IP") {
          if (p.brand) brands.add(p.brand);
          else if (p.display_name.toLowerCase().includes("cp plus")) brands.add("CP Plus");
          else if (p.display_name.toLowerCase().includes("hikvision")) brands.add("Hikvision");
          else if (p.display_name.toLowerCase().includes("prama")) brands.add("Prama");
          else if (p.display_name.toLowerCase().includes("dahua")) brands.add("Dahua");
       }
    });
    const uniqueBrands = Array.from(brands);

    // 4. Resolve Hardware (Dynamic Tech+MP Combinations) for "Budget" (No Brand Filter) + Each Brand
    let allResolvedPlans: Record<string, any> = {};
    const lifecycleWarnings: string[] = [];

    // Run for "Budget"
    const budgetRes = resolveProducts(config, req, catalog);
    Object.entries(budgetRes.plans).forEach(([key, plan]) => {
        allResolvedPlans["Budget_" + key] = plan;
    });
    lifecycleWarnings.push(...budgetRes.lifecycleWarnings);

    // Run for each brand
    uniqueBrands.forEach(brand => {
       const brandRes = resolveProducts(config, req, catalog, brand);
       Object.entries(brandRes.plans).forEach(([key, plan]) => {
           allResolvedPlans[brand + "_" + key] = plan;
       });
       lifecycleWarnings.push(...brandRes.lifecycleWarnings);
    });

    // 5. Resolved Hardware -> Pricing
    const quotePlans: Record<string, any> = {};
    for (const [key, resolvedSystem] of Object.entries(allResolvedPlans)) {
       quotePlans[key] = generatePricingSnapshot(
         resolvedSystem,
         req,
         addons,
         [],
         settings
       );
    }
`;

content = content.replace(
  /\/\/ 3\. Configuration -> Resolved Hardware[^]*\/\/ 5\. Construct final response/,
  replacement + "\n    // 5. Construct final response"
);

fs.writeFileSync("app/api/quote/generate/route.ts", content);
console.log("Updated route.ts to loop brands");
