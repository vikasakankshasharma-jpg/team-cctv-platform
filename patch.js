const fs = require('fs');
let content = fs.readFileSync('lib/validators.ts', 'utf8');
// Remove all occurrences of total_cable_length_meters
const lines = content.split('\n');
const filtered = lines.filter(line => !line.includes('total_cable_length_meters'));
// Add it back once
const result = filtered.map(line => {
  if (line.includes('cable_length_meters:')) {
    return line + '\n  total_cable_length_meters: z.coerce.number().nullable().optional(),';
  }
  return line;
});
fs.writeFileSync('lib/validators.ts', result.join('\n'));
console.log("Patched validators.ts correctly");
