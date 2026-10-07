import fs from "fs";
const lines = fs.readFileSync("lib/product-resolver.ts", "utf8").split("\n");
const start = lines.findIndex(l => l.includes("function resolveCamerasForPermutation"));
const block = lines.slice(start, start + 30);
console.log(block.join("\n"));
