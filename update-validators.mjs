import fs from "fs";

// 1. types/index.ts
let typesContent = fs.readFileSync("types/index.ts", "utf8");
// We don't strictly need to update types/index.ts since CCTVRequirement has an index signature,
// but let's check lib/validators.ts
let valContent = fs.readFileSync("lib/validators.ts", "utf8");

// Add new fields to CreateLeadSchema
valContent = valContent.replace(
  /camera_count: z\.number\(\)\.int\(\)\.nonnegative\(\)\.optional\(\),/,
  `camera_count: z.number().int().nonnegative().optional(),
    installation_type: z.enum(["new", "addon", "replacement"]).optional(),
    existing_system_known: z.boolean().optional(),
    existing_technology: z.enum(["HD", "IP"]).optional(),
    existing_recorder_channels: z.number().optional(),
    existing_working_cameras: z.number().optional(),
    retain_existing_storage: z.boolean().optional(),`
);

fs.writeFileSync("lib/validators.ts", valContent);
console.log("Updated validators.ts");
