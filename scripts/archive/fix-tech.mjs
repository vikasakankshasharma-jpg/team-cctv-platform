import fs from "fs";
let content = fs.readFileSync("components/CameraCustomizer.tsx", "utf8");

content = content.replace(
  /\.filter\(a => !a\.technology \|\| a\.technology === "BOTH" \|\| a\.technology === selectedPlan\.technology \|\| \(selectedPlan\.technology && a\.technology\.includes\(selectedPlan\.technology\)\)\)/,
  `.filter(a => {
          const tech = basePlanId.split("_")[1];
          return !a.technology || a.technology === "BOTH" || a.technology === tech || a.technology.includes(tech);
        })`
);

fs.writeFileSync("components/CameraCustomizer.tsx", content);
console.log("Updated CameraCustomizer.tsx with correct basePlanId derived technology");
