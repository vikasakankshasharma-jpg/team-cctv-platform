const fs = require('fs');

const filesToFix = [
  './app/(admin)/admin/inventory/purchase/page.tsx',
  './app/(admin)/admin/pricing/page.tsx',
  './app/(admin)/ai-dashboard/page.tsx',
  './app/sys-admin/pricing/page.tsx',
  './components/admin/AnalyticsClient.tsx',
  './components/admin/BulkImportExport.tsx',
  './components/admin/ExpansionClient.tsx',
  './components/admin/ManualEnrichmentClient.tsx',
  './components/admin/ReviewImportModal.tsx',
  './components/admin/RulesClient.tsx'
];

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace <table...> with <div className="overflow-x-auto w-full"><table...>
    content = content.replace(/(<table\b[^>]*>)/g, '<div className="overflow-x-auto w-full">\n$1');
    
    // Replace </table> with </table></div>
    content = content.replace(/(<\/table>)/g, '$1\n</div>');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Wrapped tables in ' + file);
  }
});
