const fs = require('fs');
const files = [
  'scripts/test-profitability-golden-path.ts',
  'scripts/test-finance-reconciliation.ts',
  'scripts/test-inventory-dashboard-reconciliation.ts',
  'scripts/test-service-amc-reconciliation.ts',
  'scripts/run-phase12-acceptance.ts'
];

const replacement = `require("dotenv").config({ path: ".env.local" });
import { adminDb as db } from "../lib/firebase-admin";`;

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/import \* as admin from "firebase-admin";[\s\S]*?const db = admin.firestore\(\);/, replacement);
  fs.writeFileSync(f, c);
});
console.log('done');
