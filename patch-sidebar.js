const fs = require('fs');
let c = fs.readFileSync('components/admin/Sidebar.tsx', 'utf8');

const target = `{ name: "Hardware Inventory", href: "/admin/products",          icon: Package },`;
const replacement = `{ name: "Hardware Inventory", href: "/admin/products",          icon: Package },
      { name: "Vendor Import Engine", href: "/admin/vendor-import",       icon: Package },`;

c = c.replace(target, replacement);
fs.writeFileSync('components/admin/Sidebar.tsx', c);
console.log("Patched sidebar successfully");
