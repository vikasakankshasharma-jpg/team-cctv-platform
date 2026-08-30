const fs = require('fs');
let code = fs.readFileSync('types/index.ts', 'utf8');

const newTypes = `
// ============================================================
// Phase 2B: Differential Margin Engine Types
// ============================================================
export interface TieredMargin {
  budget: number;
  recommended: number;
  premium: number;
}

export interface MarginPolicyConfig {
  anchor_margin: TieredMargin;      // e.g. 10% to 15%
  accessory_margin: TieredMargin;   // e.g. 50% to 80%
  cable_margin: number;             // e.g. 40%
  cable_wastage_factor: number;     // e.g. 1.10 (10% wastage)
  labor_margin: number;             // e.g. 20%
  gst_rate: number;                 // e.g. 0.18
  rounding_mode: 'nearest_10' | 'nearest_1' | 'exact';
}
`;

if (!code.includes('MarginPolicyConfig')) {
  code += '\n' + newTypes;
  fs.writeFileSync('types/index.ts', code);
}
