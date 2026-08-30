const fs = require('fs');
let task = fs.readFileSync('C:/Users/hp/.gemini/antigravity/brain/8f16bd2c-2d82-4fa6-ac3d-a27b2e12acd3/task.md', 'utf8');
task += '\n\n### Phase 4C: Operations / Installer API\n- `[x]` 1. Unified Job Types & `SiteSurveySnapshot`\n- `[x]` 2. Strict State Machine Engine (`JobEngine`)\n- `[x]` 3. `GET /api/operations/jobs` (RBAC Filtered)\n- `[x]` 4. `POST /api/operations/jobs/[jobId]/transition` (Validated transitions)\n- `[x]` 5. API Authorization & Transition Tests Passed';
fs.writeFileSync('C:/Users/hp/.gemini/antigravity/brain/8f16bd2c-2d82-4fa6-ac3d-a27b2e12acd3/task.md', task);
