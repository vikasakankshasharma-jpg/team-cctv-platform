import * as fs from 'fs';
import * as path from 'path';

const logPath = `C:/Users/hp/.gemini/antigravity/brain/a98849d2-f5cb-4300-a6a9-7c54429b3258/.system_generated/logs/transcript.jsonl`;
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i]) continue;
  try {
    const entry = JSON.parse(lines[i]);
    if (entry.tool_calls) {
      for (const call of entry.tool_calls) {
        if (
          (call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') &&
          call.args.TargetFile &&
          call.args.TargetFile.includes('WizardClient.tsx') &&
          call.args.ReplacementContent &&
          call.args.ReplacementContent.includes('removeBucket')
        ) {
          console.log(JSON.stringify(call.args, null, 2));
          process.exit(0);
        }
      }
    }
  } catch (e) {
    // ignore parse errors
  }
}
console.log("Not found.");
