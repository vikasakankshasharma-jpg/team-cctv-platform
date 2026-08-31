import fs from "fs";
let content = fs.readFileSync("components/CameraCustomizer.tsx", "utf8");
content = content.replace(
  /import \{ PricingResult, CCTVRequirement, Addon \} from "@\/types";/,
  `import { PricingResult, CCTVRequirement, Addon, Product } from "@/types";`
);
fs.writeFileSync("components/CameraCustomizer.tsx", content);
