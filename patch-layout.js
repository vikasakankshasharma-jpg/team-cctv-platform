const fs = require('fs');

let page = fs.readFileSync('app/(admin)/admin/products/page.tsx', 'utf8');

// Change the flex container for the buttons
page = page.replace(
  '<div className="flex items-center gap-3">\n             <BulkImportExport',
  '<div className="flex flex-wrap items-center justify-end gap-3">\n             <BulkImportExport'
);

// Also change the header container to wrap if necessary (or stack earlier)
page = page.replace(
  'max-w-[1600px] mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6',
  'max-w-[1600px] mx-auto px-6 py-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6'
);

fs.writeFileSync('app/(admin)/admin/products/page.tsx', page);

let bulk = fs.readFileSync('components/admin/BulkImportExport.tsx', 'utf8');

// Change the flex container in BulkImportExport
bulk = bulk.replace(
  '<div className="flex items-center gap-3">',
  '<div className="flex flex-wrap items-center gap-3">'
);

fs.writeFileSync('components/admin/BulkImportExport.tsx', bulk);

console.log("Patched layout");
