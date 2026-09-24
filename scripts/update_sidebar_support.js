const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\components\\admin\\Sidebar.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The Sidebar contains an array of routes or JSX blocks. Let's look for "Logistics Hub" or "Finance Hub"
const supportLink = `
        {canAccess(["operations"]) && (
          <SidebarItem href="/admin/support" icon={<ShieldCheck />} label="Support & AMC" isActive={pathname === "/admin/support"} badge="New" />
        )}
`;

// Wait, I need to make sure ShieldCheck is imported
if (!content.includes('ShieldCheck')) {
  content = content.replace(/import {/, 'import { ShieldCheck,');
}

// I'll replace `Finance Hub` block by prepending the support link to it
content = content.replace(/\{canAccess\(\["finance"\]\) && \(\s*<SidebarItem href="\/admin\/finance\/exports"/, (match) => {
  return supportLink + '\n        ' + match;
});

fs.writeFileSync(filePath, content);
console.log("Added Support link to Sidebar");
