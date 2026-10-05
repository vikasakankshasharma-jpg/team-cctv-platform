const fs = require("fs");
let content = fs.readFileSync("lib/pricing-engine.ts", "utf8");

content = content.replace(
  /const baseRate = isIP\s*\?\s*\(settings\.labor_ip_per_camera \|\| settings\.labor_full_installation_rate \|\| 500\)\s*\:\s*\(settings\.labor_hd_per_camera \|\| settings\.labor_full_installation_rate \|\| 400\);/,
  `const baseRate = req.cabling_done 
        ? (settings.labor_fitting_only_rate || 300)
        : (isIP 
          ? (settings.labor_ip_per_camera || settings.labor_full_installation_rate || 500)
          : (settings.labor_hd_per_camera || settings.labor_full_installation_rate || 400));`
);

content = content.replace(
  /const baseRate = tech === "IP" \? \(settings\.labor_ip_per_camera \|\| 500\) \: \(settings\.labor_hd_per_camera \|\| 400\);/,
  `const baseRate = selection.cabling_done 
      ? (settings.labor_fitting_only_rate || 300)
      : (tech === "IP" ? (settings.labor_ip_per_camera || settings.labor_full_installation_rate || 500) : (settings.labor_hd_per_camera || settings.labor_full_installation_rate || 400));`
);

fs.writeFileSync("lib/pricing-engine.ts", content);

