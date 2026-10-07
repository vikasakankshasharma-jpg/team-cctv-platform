import fs from "fs";

let content = fs.readFileSync("lib/product-resolver.ts", "utf8");

content = content.replace(
  /export function resolveProducts\(\n  config: CCTVConfiguration,\n  req: CCTVRequirement,\n  catalog: Product\[\]\n\): \{ plans: Record<string, ResolvedSystem>; lifecycleWarnings: string\[\] \} \{/,
  `export function resolveProducts(
  config: CCTVConfiguration,
  req: CCTVRequirement,
  catalog: Product[],
  brandFilter?: string
): { plans: Record<string, ResolvedSystem>; lifecycleWarnings: string[] } {`
);

content = content.replace(
  /const pool = catalog\.filter\(p => \{/,
  `const pool = catalog.filter(p => {
    if (brandFilter) {
       // Only filter cameras and recorders by brand
       const isCamOrDvr = p.category === "cctv_camera" || p.category === "recorder" || p.category === "CAMERA_HD" || p.category === "CAMERA_IP";
       if (isCamOrDvr) {
          let pBrand = p.brand;
          if (!pBrand) {
             if (p.display_name.toLowerCase().includes("cp plus")) pBrand = "CP Plus";
             else if (p.display_name.toLowerCase().includes("hikvision")) pBrand = "Hikvision";
             else if (p.display_name.toLowerCase().includes("prama")) pBrand = "Prama";
             else if (p.display_name.toLowerCase().includes("dahua")) pBrand = "Dahua";
          }
          if (pBrand !== brandFilter) return false;
       }
    }`
);

fs.writeFileSync("lib/product-resolver.ts", content);
console.log("Updated product-resolver with brandFilter");
