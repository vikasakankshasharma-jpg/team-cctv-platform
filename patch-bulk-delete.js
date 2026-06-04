const fs = require('fs');

let content = fs.readFileSync('app/(admin)/api/admin/products/bulk/route.ts', 'utf8');

content = content.replace(
  'const docRef = db.collection("products").doc(id);\n        chunkBatch.delete(docRef);',
  'chunkBatch.delete(db.collection("products").doc(id));\n        chunkBatch.delete(db.collection("addons").doc(id));'
);

fs.writeFileSync('app/(admin)/api/admin/products/bulk/route.ts', content);
console.log('Patched bulk delete API to delete from both products and addons collections');
