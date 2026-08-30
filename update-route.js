const fs = require('fs');

let code = fs.readFileSync('app/api/quote/generate/route.ts', 'utf8');

// 1. Fix getActiveProducts to NOT filter by is_quotation_eligible in the DB query
code = code.replace(
  '    .where("is_active", "==", true)\n    .where("is_quotation_eligible", "==", true)\n    .get();\n\n  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));',
  '    .where("is_active", "==", true)\n    .get();\n\n  return snap.docs\n    .filter(doc => doc.data().is_quotation_eligible !== false)\n    .map(doc => ({ id: doc.id, ...doc.data() } as Product));'
);

// 2. Add lifecycleWarnings to the response
code = code.replace(
  '      configuration: config,\n      plans: {',
  '      configuration: config,\n      lifecycleWarnings: resolvedSystems.lifecycleWarnings,\n      plans: {'
);

fs.writeFileSync('app/api/quote/generate/route.ts', code);
