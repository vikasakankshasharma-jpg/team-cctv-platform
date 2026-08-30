const fs = require('fs');
let matrix = fs.readFileSync('C:/Users/hp/.gemini/antigravity/brain/8f16bd2c-2d82-4fa6-ac3d-a27b2e12acd3/evidence_matrix.md', 'utf8');
if (!matrix.includes('Operations Job State Machine')) {
  matrix += '\n| 9 | P0 | Operations Job State Machine | Lifecycle (Pending \u2192 Assigned \u2192 In Progress) \u2192 RBAC Isolation | Full E2E | ✅ PASS | ✅ DONE | Ops / Fulfillment |';
}
fs.writeFileSync('C:/Users/hp/.gemini/antigravity/brain/8f16bd2c-2d82-4fa6-ac3d-a27b2e12acd3/evidence_matrix.md', matrix);
