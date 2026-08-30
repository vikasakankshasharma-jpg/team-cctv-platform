const fs = require('fs');
let c = fs.readFileSync('scripts/reconcile-inventory.ts', 'utf8');
c = c.replace(/import \* as admin from "firebase-admin";[\s\S]*?const db = admin.firestore\(\);/, 
'require("dotenv").config({ path: ".env.local" });\nimport { adminDb as db } from "../lib/firebase-admin";');
fs.writeFileSync('scripts/reconcile-inventory.ts', c);
console.log('done');
