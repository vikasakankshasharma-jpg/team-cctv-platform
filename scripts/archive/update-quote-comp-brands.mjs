import fs from "fs";

let content = fs.readFileSync("components/QuoteComparison.tsx", "utf8");

content = content.replace(
  /\/\/ Extract available brands[^]*?return \["Budget"[^]*?\n    }, \[plans\]\);/m,
  `  // Extract available brands from plan keys
  const brands = useMemo(() => {
     const bSet = new Set<string>();
     Object.keys(plans).forEach(key => {
        const parts = key.split("_");
        if (parts.length >= 3) {
           bSet.add(parts[0]);
        }
     });
     return ["Budget", ...Array.from(bSet).filter(b => b !== "Budget")];
  }, [plans]);`
);

fs.writeFileSync("components/QuoteComparison.tsx", content);
console.log("Updated brand extraction");
