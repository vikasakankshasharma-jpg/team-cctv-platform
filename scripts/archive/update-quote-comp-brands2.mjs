import fs from "fs";

let content = fs.readFileSync("components/QuoteComparison.tsx", "utf8");

const oldCode = `  const brands = useMemo(() => {
     const bSet = new Set<string>();
     Object.values(plans).forEach(plan => {
        plan.items.filter(i => i.product_id.includes("cctv_camera") || i.product_id.includes("camera")).forEach(item => {
           // We'll approximate brand from display name if brand isn't explicitly in PricingResult
           if (item.display_name.toLowerCase().includes("cp plus")) bSet.add("CP Plus");
           else if (item.display_name.toLowerCase().includes("budget")) bSet.add("Budget Brand");
           else if (item.display_name.toLowerCase().includes("prama")) bSet.add("Prama");
        });
     });
     return ["Budget", ...Array.from(bSet).filter(b => b !== "Budget" && b !== "Budget Brand")];
  }, [plans]);`;

const newCode = `  const brands = useMemo(() => {
     const bSet = new Set<string>();
     Object.keys(plans).forEach(key => {
        const parts = key.split("_");
        if (parts.length >= 3) {
           bSet.add(parts[0]);
        }
     });
     return ["Budget", ...Array.from(bSet).filter(b => b !== "Budget")];
  }, [plans]);`;

content = content.replace(oldCode, newCode);

fs.writeFileSync("components/QuoteComparison.tsx", content);
console.log("Updated brand extraction precisely");
