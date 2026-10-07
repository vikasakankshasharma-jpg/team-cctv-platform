import fs from "fs";
let content = fs.readFileSync("components/admin/AddonModal.tsx", "utf8");
content = content.replace(
  /price: 0,\n          is_active: true,/,
  `price: 0,\n          stock_quantity: 1,\n          is_active: true,`
);
fs.writeFileSync("components/admin/AddonModal.tsx", content);
console.log("Fixed AddonModal else branch");
