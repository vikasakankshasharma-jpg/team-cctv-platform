const fs = require('fs');

const files = [
  'app/(admin)/api/admin/vendor/categories/route.ts',
  'app/(admin)/api/admin/vendor/staged-products/route.ts'
];

files.forEach(file => {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/import\s*\{\s*getDb\s*\}\s*from\s*"@\/lib\/firebase-admin";/g, 'import { adminDb } from "@/lib/firebase-admin";');
  c = c.replace(/const\s+db\s*=\s*getDb\(\);/g, 'const db = adminDb;');
  fs.writeFileSync(file, c);
});
console.log("Patched API routes to use adminDb");
