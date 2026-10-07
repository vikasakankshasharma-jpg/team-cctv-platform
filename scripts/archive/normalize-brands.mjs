import fs from "fs";

function normalizeBrandLogic() {
  return `          let pBrand = p.brand;
          if (!pBrand) {
             if (p.display_name.toLowerCase().includes("cp plus")) pBrand = "CP Plus";
             else if (p.display_name.toLowerCase().includes("hikvision")) pBrand = "Hikvision";
             else if (p.display_name.toLowerCase().includes("prama")) pBrand = "Prama";
             else if (p.display_name.toLowerCase().includes("dahua")) pBrand = "Dahua";
          }
          if (pBrand) {
             const lower = pBrand.toLowerCase().replace(/\\s+/g, "");
             if (lower === "cpplus") pBrand = "CP Plus";
             else if (lower.includes("budget")) pBrand = "";
             else if (lower === "prama") pBrand = "Prama";
             else if (lower === "hikvision") pBrand = "Hikvision";
             else if (lower === "dahua") pBrand = "Dahua";
          }`;
}

let contentResolver = fs.readFileSync("lib/product-resolver.ts", "utf8");
contentResolver = contentResolver.replace(
  /let pBrand = p\.brand;\n\s*if \(\!pBrand\) \{[^}]+\}/,
  normalizeBrandLogic()
);
fs.writeFileSync("lib/product-resolver.ts", contentResolver);

let contentRoute = fs.readFileSync("app/api/quote/generate/route.ts", "utf8");
// In route.ts it was:
/*
          if (p.brand) brands.add(p.brand);
          else if (p.display_name.toLowerCase().includes("cp plus")) brands.add("CP Plus");
          else if (p.display_name.toLowerCase().includes("hikvision")) brands.add("Hikvision");
          else if (p.display_name.toLowerCase().includes("prama")) brands.add("Prama");
          else if (p.display_name.toLowerCase().includes("dahua")) brands.add("Dahua");
*/
const routeReplacement = normalizeBrandLogic().replace(/pBrand/g, "b") + `\n          if (b) brands.add(b);`;

contentRoute = contentRoute.replace(
  /if \(p\.brand\) brands\.add\(p\.brand\);\n\s*else if \([^}]+\) brands\.add\("Dahua"\);/,
  routeReplacement
);
fs.writeFileSync("app/api/quote/generate/route.ts", contentRoute);

console.log("Normalized brands in both files.");
