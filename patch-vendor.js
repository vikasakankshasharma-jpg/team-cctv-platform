const fs = require('fs');

let content = fs.readFileSync('app/(admin)/admin/vendor-import/VendorImportClient.tsx', 'utf8');

content = content.replace(
  /key=\{tech\.id\}/g,
  `key={tech as string}`
);

content = content.replace(
  />\{tech\.id\}<\/span>/g,
  `>{tech as string}</span>`
);

fs.writeFileSync('app/(admin)/admin/vendor-import/VendorImportClient.tsx', content);
console.log("Patched VendorImportClient.tsx");
