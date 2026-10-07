import fs from "fs";
let content = fs.readFileSync("components/CameraCustomizer.tsx", "utf8");
content = content.replace(
  /import \{ CCTVRequirement, PricingResult, Addon, Product \} from "@\/types";/,
  `import { CCTVRequirement, PricingResult, Addon, Product } from "@/types";`
);
if (!content.includes("Product } from")) {
    content = content.replace(
      /import \{ CCTVRequirement, PricingResult, Addon \} from "@\/types";/,
      `import { CCTVRequirement, PricingResult, Addon, Product } from "@/types";`
    );
}
fs.writeFileSync("components/CameraCustomizer.tsx", content);
