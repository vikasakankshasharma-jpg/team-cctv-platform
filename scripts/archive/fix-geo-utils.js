const fs = require('fs');
const path = 'lib/geo-utils.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'allAreas: Array.from(data.areas),\\n        quadrants: data.quadrants,',
  'allAreas: Array.from(data.areas),\n        quadrants: data.quadrants,'
);

// Also add quadrants to PincodeGroupedData interface
if (!code.includes('quadrants?: any[];')) {
  code = code.replace(
    '  allAreas: string[];',
    '  allAreas: string[];\n  quadrants?: any[];'
  );
}

// Add it to the map
if (!code.includes('quadrants?: any[];\\n    validCoords:')) {
  code = code.replace(
    'areas: Set<string>;\n    validCoords: { lat: number; lng: number; isMain: boolean }[];',
    'areas: Set<string>;\n    quadrants?: any[];\n    validCoords: { lat: number; lng: number; isMain: boolean }[];'
  );
}

// Populate quadrants in the loop
if (!code.includes('if (o.quadrants) {')) {
  code = code.replace(
    'if (!pincodeMap.has(o.pincode)) {\n      pincodeMap.set(o.pincode, { areas: new Set(), validCoords: [] });\n    }',
    'if (!pincodeMap.has(o.pincode)) {\n      pincodeMap.set(o.pincode, { areas: new Set(), validCoords: [] });\n    }\n    if (o.quadrants) {\n      pincodeMap.get(o.pincode)!.quadrants = o.quadrants;\n    }'
  );
}

fs.writeFileSync(path, code);
console.log('Fixed geo-utils.ts');
