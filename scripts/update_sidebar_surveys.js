const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\components\\admin\\Sidebar.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const surveyLink = `
        {canAccess(["operations"]) && (
          <SidebarItem href="/admin/surveys" icon={<MapPin />} label="Site Surveys" isActive={pathname === "/admin/surveys"} />
        )}
`;

// Wait, I need to make sure MapPin is imported
if (!content.includes('MapPin')) {
  content = content.replace(/import {/, 'import { MapPin,');
}

// I'll prepend it right before the support link block we added earlier
content = content.replace(/\{canAccess\(\\["operations"\\]\) && \(\s*<SidebarItem href="\/admin\/support"/, (match) => {
  return surveyLink + '\n        ' + match;
});

fs.writeFileSync(filePath, content);
console.log("Added Survey link to Sidebar");
