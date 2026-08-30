import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';
import { MarginEngine, DEFAULT_MARGIN_POLICY } from '../lib/margin-engine';
import { generateConfiguration } from '../lib/configuration-engine';
import { resolveProducts } from '../lib/product-resolver';
import { generatePricingSnapshot } from '../lib/pricing-engine-v2';

const TEST_ID = Date.now().toString();

test.describe.serial('Phase 2B: Differential Margin Engine & Canonical Contract', () => {

  const req: any = { 
    camera_count: 2, 
    indoor_camera_count: 1, 
    outdoor_camera_count: 1, 
    technology_preference: 'IP',
    recording_days: 15,
    mounting_height: 'high',
    ladder_available: 'installer_brings', 
    surface_types: ['marble'],            
    timeline: 'immediately'
  };

  const settings: any = {
    site_preparation: {
      ladderArrangementFee: 500,
      marbleLaborSurcharge: 400
    },
    geo_multiplier: 1.0,
    margin_policy: DEFAULT_MARGIN_POLICY
  };

  test('1. Tiers, Categories, Surcharges & Profitability Parity', async () => {
    const camDoc = await adminDb.collection('products').doc('CPPLUS-CAMERA_IP-5MP-COLOR-AUDIO-DOME').get();
    const dvrDoc = await adminDb.collection('products').doc('CPPLUS-NVR-4CH-1SATA').get();
    
    const catalog = [
      camDoc.exists ? { id: camDoc.id, ...camDoc.data() } : { id: 'cam1', category: 'CAMERA_IP', baseCost: 1500, is_active: true, stock_status: 'in_stock', specifications: { formFactor: 'DOME' } },
      dvrDoc.exists ? { id: dvrDoc.id, ...dvrDoc.data() } : { id: 'dvr1', category: 'NVR', baseCost: 4000, is_active: true, stock_status: 'in_stock', channels: 4 }
    ] as any[];

    const config = generateConfiguration(req);
    const resolved = resolveProducts(config, req, catalog);

    expect(resolved.recommended.site_surcharge_flags?.requiresLadderFee).toBe(true);
    expect(resolved.recommended.site_surcharge_flags?.requiresMarbleSurcharge).toBe(true);

    const snapshot = generatePricingSnapshot(resolved.recommended, req, [], [], settings);

    const camCost = catalog[0].baseCost;
    const anchorMarginRec = DEFAULT_MARGIN_POLICY.anchor_margin.recommended;
    
    const camUnitCalc = MarginEngine.calculateUnitPricing(camCost, 'CAMERA_IP', 'recommended', DEFAULT_MARGIN_POLICY);
    expect(camUnitCalc.marginPercent).toBe(anchorMarginRec);
    expect(camUnitCalc.sellingPriceExTax).toBeCloseTo(camCost * (1 + anchorMarginRec), 2);

    const camItem = snapshot.items.find((i: any) => i.product_id === catalog[0].id);
    expect(camItem).toBeDefined();
    expect(camItem.unit_price).toBeCloseTo(camUnitCalc.sellingPriceExTax, 2);

    const ladderItem = snapshot.items.find((i: any) => i.product_id === 'surcharge_ladder');
    expect(ladderItem).toBeDefined();
    expect(ladderItem.base_cost_at_quote).toBe(500);
    expect(ladderItem.unit_price).toBe(500 * (1 + DEFAULT_MARGIN_POLICY.labor_margin));

    expect(snapshot.total_payable % 10).toBe(0);

    const derivedExTax = snapshot.total_payable / (1 + DEFAULT_MARGIN_POLICY.gst_rate);
    expect(Math.abs(snapshot.net_taxable_amount - derivedExTax)).toBeLessThan(0.01);

    const expectedGrossProfit = snapshot.net_taxable_amount - snapshot.total_purchase_cost;
    expect(Math.abs(snapshot.gross_profit_value - expectedGrossProfit)).toBeLessThan(0.01);
  });

  test('2. Cables apply wastage and specific margin', () => {
     const cableCost = 25; 
     const calc = MarginEngine.calculateUnitPricing(cableCost, 'cable', 'recommended', DEFAULT_MARGIN_POLICY);
     
     const expectedWorkingCost = cableCost * 1.10; 
     const expectedMarginPercent = 0.40; 
     
     expect(calc.workingCost).toBeCloseTo(expectedWorkingCost, 2);
     expect(calc.marginPercent).toBe(expectedMarginPercent);
     expect(calc.sellingPriceExTax).toBeCloseTo(expectedWorkingCost * (1 + expectedMarginPercent), 2);
  });

  test('3. Geo Multiplier applies correctly on totals', () => {
    const lineItems = [
      { sellingPriceExTax: 1000, qty: 1 }
    ];
    
    const surgeCalc = MarginEngine.calculateDocumentTotals(lineItems, 0, 1.2, DEFAULT_MARGIN_POLICY);
    
    expect(surgeCalc.rawSubtotal).toBe(1000);
    
    const expectedPayable = Math.round(1000 * 1.2 * 1.18 / 10) * 10;
    expect(surgeCalc.finalExTax).toBeCloseTo(expectedPayable / 1.18, 2);
    expect(surgeCalc.totalPayable).toBe(expectedPayable);
  });
  
});
