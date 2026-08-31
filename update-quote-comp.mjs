import fs from "fs";

let content = fs.readFileSync("components/QuoteComparison.tsx", "utf8");

content = content.replace(
  /const \[activeBrand, setActiveBrand\] = useState<string>\("All"\);/,
  `const [activeBrand, setActiveBrand] = useState<string>("Budget");`
);

content = content.replace(
  /return \["All", \.\.\.Array\.from\(bSet\)\];/,
  `return ["Budget", ...Array.from(bSet).filter(b => b !== "Budget" && b !== "Budget Brand")];`
);

content = content.replace(
  /const hasBrand = plan\.items\.some\(i => i\.display_name\.toLowerCase\(\)\.includes\(activeBrand\.toLowerCase\(\)\)\);\n           return hasBrand;/,
  `return key.startsWith(activeBrand + "_");`
);

content = content.replace(
  /let result = Object\.entries\(plans\)\.filter\(\(\[key, plan\]\) => key\.startsWith\(activeTech \+ "_"\)\);/,
  `let result = Object.entries(plans).filter(([key, plan]) => key.includes("_" + activeTech + "_"));`
);

fs.writeFileSync("components/QuoteComparison.tsx", content);
console.log("Updated QuoteComparison to support prefix brand keys");
