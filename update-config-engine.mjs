import fs from "fs";

let content = fs.readFileSync("lib/configuration-engine.ts", "utf8");

const oldLogic = `  // Calculate Storage (Simplified assumption: 40GB per camera per day at 1080p H.265)
  // E.g. 2MP ~ 20-30GB/day. 5MP ~ 40-50GB/day. We'll use 40GB average for now.
  let storageGb = 0;
  if (!isLiveOnly) {
    storageGb = totalCameras * 40 * (req.recording_days || 15);
  }`;

const newLogic = `  // Calculate Storage (Simplified assumption: 40GB per camera per day at 1080p H.265)
  // E.g. 2MP ~ 20-30GB/day. 5MP ~ 40-50GB/day. We'll use 40GB average for now.
  let storageGb = 0;
  if (!isLiveOnly) {
    const days = req.recording_days !== undefined ? req.recording_days : 15;
    const gbPerDay = req.recording_mode === "motion" ? 20 : 40;
    storageGb = totalCameras * gbPerDay * days;
  }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync("lib/configuration-engine.ts", content);
console.log("Updated storage logic in configuration-engine");
