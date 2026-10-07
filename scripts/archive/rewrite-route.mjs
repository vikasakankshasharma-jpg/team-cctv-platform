import fs from "fs";

let content = fs.readFileSync("app/api/quote/generate/route.ts", "utf8");

content = content.replace(
  /\/\/ 3\. Configuration -> Resolved Hardware[\s\S]*\}\);/,
  `// 3. Configuration -> Resolved Hardware (Dynamic Tech+MP Combinations)
    const { plans: resolvedPlans, lifecycleWarnings } = resolveProducts(config, req, catalog);

    // 4. Resolved Hardware -> Pricing
    const quotePlans: Record<string, any> = {};
    for (const [key, resolvedSystem] of Object.entries(resolvedPlans)) {
       quotePlans[key] = generatePricingSnapshot(
         resolvedSystem,
         req,
         addons,
         [],
         settings
       );
    }

    // 5. Construct final response
    return NextResponse.json({
      success: true,
      requirement: req,
      configuration: config,
      plans: quotePlans,
      lifecycleWarnings
    });`
);

fs.writeFileSync("app/api/quote/generate/route.ts", content);
console.log("Rewrote route.ts to support dynamic plans");
