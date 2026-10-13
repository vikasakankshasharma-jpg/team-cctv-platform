const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/geo/jaipurQuadrants.ts');
let code = fs.readFileSync(filePath, 'utf8');

// Replace QuadrantDefinition interface
code = code.replace(
  /export interface QuadrantDefinition {[\s\S]*?}/,
  `export interface DeliveryHubDefinition {
  zone: string;
  anchor: string;
  coverage: string;
  compassZone?: "North-West" | "North-East" | "South-West" | "South-East";
}

// Retain QuadrantDefinition alias for backwards compatibility
export type QuadrantDefinition = DeliveryHubDefinition;`
);

// In JAIPUR_VERIFIED_QUADRANTS, for each object:
// transform compass zone to local communicating name as zone
const pattern = /\{\s*zone:\s*"([^"]+)",\s*anchor:\s*"([^"]+)",\s*coverage:\s*"([^"]+)"\s*\}/g;

code = code.replace(pattern, (match, compass, anchor, coverage) => {
  return `{ zone: ${JSON.stringify(anchor)}, anchor: ${JSON.stringify(anchor)}, coverage: ${JSON.stringify(coverage)}, compassZone: ${JSON.stringify(compass)} }`;
});

// Update export helper
if (!code.includes('export const getVerifiedHubs')) {
  code = code.replace(
    'export function getVerifiedQuadrants',
    'export const getVerifiedHubs = getVerifiedQuadrants;\nexport function getVerifiedQuadrants'
  );
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated lib/geo/jaipurQuadrants.ts with local communicating names!');
