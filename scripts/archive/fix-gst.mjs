import fs from "fs";

let content = fs.readFileSync("components/CameraCustomizer.tsx", "utf8");

// Change UPGRADES mapping
content = content.replace(
  /priceExTax: a.unit_price \|\| a.price \|\| 0,/,
  `priceExTax: (a.unit_price || a.price || 0) / 1.18,\n          priceIncGst: a.unit_price || a.price || 0,`
);

// Change UI rendering of price on the card
content = content.replace(
  /{upg\.priceExTax < 0 \? 'Save ' : '\+ '}{formatPrice\(Math\.abs\(upg\.priceExTax\)\)} per camera/,
  `{upg.priceIncGst < 0 ? 'Save ' : '+ '}{formatPrice(Math.abs(upg.priceIncGst))} per camera`
);
content = content.replace(
  /upg\.priceExTax < 0 \? 'text-green-600' : 'text-gray-700'/,
  `upg.priceIncGst < 0 ? 'text-green-600' : 'text-gray-700'`
);

// We already have `const amount = upg.priceExTax * qty * 1.18;` which perfectly matches `priceIncGst * qty`.
// Let's just double check the amount calculation just in case of rounding errors.
content = content.replace(
  /const amount = upg.priceExTax \* qty \* 1\.18; \/\/ Inc GST/,
  `const amount = upg.priceIncGst * qty;`
);

fs.writeFileSync("components/CameraCustomizer.tsx", content);
console.log("Updated CameraCustomizer for GST inclusive prices");
