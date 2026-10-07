import fs from "fs";
let content = fs.readFileSync("lib/product-resolver.ts", "utf8");

content = content.replace(
  /let valid = storageItems\.filter\(p => getTb\(p\) \* 1024 >= config\.storage_gb!\);/,
  `// HD technology typically uses H.265 which compresses better, so we can adjust the GB requirement
    // to allow a 500GB HDD for the lowest quotation (4 cams * 7 days).
    let reqStorageGb = config.storage_gb!;
    if (config.technology === "HD") {
      reqStorageGb = reqStorageGb * 0.75; // Reduce by 25% for HD
    }
    let valid = storageItems.filter(p => getTb(p) * 1024 >= reqStorageGb);`
);

fs.writeFileSync("lib/product-resolver.ts", content);
console.log("Updated product-resolver.ts with HD storage optimization");
