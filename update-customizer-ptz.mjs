import fs from "fs";
let content = fs.readFileSync("components/CameraCustomizer.tsx", "utf8");

content = content.replace(
  /\.filter\(a => a\.category === "upgrade_camera" && a\.stock_quantity !== 0 && a\.stock_quantity !== -1\)/,
  `.filter(a => a.category === "upgrade_camera" && a.stock_quantity !== 0 && a.stock_quantity !== -1)
        .filter(a => !a.technology || a.technology === "BOTH" || a.technology === selectedPlan.technology || (selectedPlan.technology && a.technology.includes(selectedPlan.technology)))`
);

fs.writeFileSync("components/CameraCustomizer.tsx", content);
console.log("Updated CameraCustomizer.tsx");
