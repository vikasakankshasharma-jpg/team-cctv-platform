import fs from "fs";

let content = fs.readFileSync("components/CameraCustomizer.tsx", "utf8");

const oldStr = `{upg.stock !== Infinity && <span className="text-xs text-gray-400 ml-2 font-normal">({upg.stock} in stock)</span>}`;

if (content.includes(oldStr)) {
   content = content.replace(oldStr, "");
   fs.writeFileSync("components/CameraCustomizer.tsx", content);
   console.log("Successfully removed in-stock badge");
} else {
   console.log("Could not find the exact string.");
}
