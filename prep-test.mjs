// Let's modify test-e2e.mjs temporarily to test No Recording and Motion Recording
import fs from "fs";
let content = fs.readFileSync("test-e2e.mjs", "utf8");

content = content.replace(
  /"recording_days": 15,/,
  `"recording_days": 0,`
);

content = content.replace(
  /"recording_mode": "continuous",/,
  `"recording_mode": "motion",`
);
fs.writeFileSync("test-e2e.mjs", content);
