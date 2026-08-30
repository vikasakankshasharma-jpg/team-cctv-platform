const fs = require('fs');
let matrix = fs.readFileSync('C:/Users/hp/.gemini/antigravity/brain/8f16bd2c-2d82-4fa6-ac3d-a27b2e12acd3/evidence_matrix.md', 'utf8');
if (!matrix.includes('Sales CRM API Authorization')) {
  matrix += '\n| 8 | P0 | Sales CRM API Authorization | Role isolation \u2192 360 view \u2192 Action endpoints | Full E2E | ✅ PASS | ✅ DONE | CRM / Operations |';
}
fs.writeFileSync('C:/Users/hp/.gemini/antigravity/brain/8f16bd2c-2d82-4fa6-ac3d-a27b2e12acd3/evidence_matrix.md', matrix);
