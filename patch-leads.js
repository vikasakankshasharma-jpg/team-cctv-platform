const fs = require('fs');

const path = 'app/(admin)/admin/leads/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The safest way to pass complex data from Server to Client component in Next.js 14+ is to JSON clone it
content = content.replace(
  'initialLeads={leads}',
  'initialLeads={JSON.parse(JSON.stringify(leads))}'
);

content = content.replace(
  'industrialLeads={industrialLeads as any[]}',
  'industrialLeads={JSON.parse(JSON.stringify(industrialLeads))}'
);

fs.writeFileSync(path, content);
console.log("Patched leads page.tsx for serialization");
