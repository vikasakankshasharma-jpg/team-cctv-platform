import { test, expect } from '@playwright/test';
import { generateConfiguration } from '../lib/configuration-engine';
import { resolveProducts } from '../lib/product-resolver';
import { calculatePricingV2 } from '../lib/pricing-engine-v2';
import { CCTVRequirement, AppSettings, Product } from '../types';

test.describe('Site Preparation & Logistics (Wizard -> Config -> Pricing)', () => {

  const baseSettings: AppSettings = {
    tier_multipliers: { budget: 1, recommended: 1.2, premium: 1.5 },
    site_preparation: {
      ladderArrangementFee: 500,
      marbleLaborSurcharge: 400,
      metalInstallationSurcharge: 200,
      furnishedSiteSurcharge: 300,
      heavyWallDrillingSurcharge: 600,
    }
  } as any;

  const mockCatalog: Product[] = [
    { id: '1', display_name: 'Budget Dome', brand: 'Budget Brand', category: 'cctv_camera', unit_price: 1000, specifications: { formFactor: 'DOME' }, is_active: true },
    { id: '2', display_name: 'Premium Dome', brand: 'CP Plus', category: 'cctv_camera', unit_price: 2000, specifications: { formFactor: 'DOME' }, is_active: true },
    { id: '3', display_name: 'Budget Bullet', brand: 'Budget Brand', category: 'cctv_camera', unit_price: 1200, specifications: { formFactor: 'BULLET' }, is_active: true },
    { id: '4', display_name: 'Premium Bullet', brand: 'CP Plus', category: 'cctv_camera', unit_price: 2500, specifications: { formFactor: 'BULLET' }, is_active: true },
  ];

  test('1. High height + installer ladder → ladder fee applied', () => {
    const req: CCTVRequirement = {
      property_type: 'home', setup_type: 'new', technology_preference: 'IP', resolution_preference: '2MP',
      indoor_camera_count: 2, recording_days: 15, recording_mode: 'continuous', special_features: [],
      wants_remote_viewing: false, broadband_status: 'no', addons: [], is_wired: true,
      timeline: 'week', brand_preference: 'cpplus', wants_amc: false,
      mounting_height: 'high',
      ladder_available: 'installer_brings'
    };

    const config = generateConfiguration(req);
    expect(config.site_surcharge_flags?.requiresLadderFee).toBe(true);
    expect(config.installer_requirements).toContain('15ft Ladder');

    const resolved = resolveProducts(config, req, mockCatalog);
    const pricing = calculatePricingV2({ resolvedSystem: (resolved.recommended as any), req, settings: baseSettings, addons: [] });
    
    const ladderItem = pricing.items.find(i => i.product_id === 'surcharge_ladder');
    expect(ladderItem).toBeTruthy();
    expect(ladderItem?.line_total).toBe(500);
  });

  test('2. High height + customer ladder → no ladder fee', () => {
    const req: CCTVRequirement = {
      property_type: 'home', setup_type: 'new', technology_preference: 'IP', resolution_preference: '2MP',
      indoor_camera_count: 2, recording_days: 15, recording_mode: 'continuous', special_features: [],
      wants_remote_viewing: false, broadband_status: 'no', addons: [], is_wired: true,
      timeline: 'week', brand_preference: 'cpplus', wants_amc: false,
      mounting_height: 'high',
      ladder_available: 'customer_provided'
    };

    const config = generateConfiguration(req);
    expect(config.site_surcharge_flags?.requiresLadderFee).toBe(false);
    expect(config.installer_requirements?.some(r => r.includes('Ladder'))).toBe(false);

    const resolved = resolveProducts(config, req, mockCatalog);
    const pricing = calculatePricingV2({ resolvedSystem: (resolved.recommended as any), req, settings: baseSettings, addons: [] });
    
    expect(pricing.items.find(i => i.product_id === 'surcharge_ladder')).toBeUndefined();
  });

  test('3. Marble → correct labor surcharge + diamond-bit requirement', () => {
    const req: CCTVRequirement = {
      property_type: 'home', setup_type: 'new', technology_preference: 'IP', resolution_preference: '2MP',
      indoor_camera_count: 2, recording_days: 15, recording_mode: 'continuous', special_features: [],
      wants_remote_viewing: false, broadband_status: 'no', addons: [], is_wired: true,
      timeline: 'week', brand_preference: 'cpplus', wants_amc: false,
      surface_types: ['marble']
    };

    const config = generateConfiguration(req);
    expect(config.site_surcharge_flags?.requiresMarbleSurcharge).toBe(true);
    expect(config.installer_requirements).toContain('Diamond core drill bits (Marble/Stone)');

    const resolved = resolveProducts(config, req, mockCatalog);
    const pricing = calculatePricingV2({ resolvedSystem: (resolved.recommended as any), req, settings: baseSettings, addons: [] });
    
    expect(pricing.items.find(i => i.product_id === 'surcharge_marble')?.line_total).toBe(400);
  });

  test('4. Metal/Pole → correct material/labor adjustment', () => {
    const req: CCTVRequirement = {
      property_type: 'home', setup_type: 'new', technology_preference: 'IP', resolution_preference: '2MP',
      indoor_camera_count: 2, recording_days: 15, recording_mode: 'continuous', special_features: [],
      wants_remote_viewing: false, broadband_status: 'no', addons: [], is_wired: true,
      timeline: 'week', brand_preference: 'cpplus', wants_amc: false,
      surface_types: ['metal']
    };

    const config = generateConfiguration(req);
    expect(config.site_surcharge_flags?.requiresMetalSurcharge).toBe(true);
    expect(config.installer_requirements).toContain('Metal drill bits & self-tapping screws');

    const resolved = resolveProducts(config, req, mockCatalog);
    const pricing = calculatePricingV2({ resolvedSystem: (resolved.recommended as any), req, settings: baseSettings, addons: [] });
    
    expect(pricing.items.find(i => i.product_id === 'surcharge_metal')?.line_total).toBe(200);
  });

  test('5. Furnished → cleanup/labor premium', () => {
    const req: CCTVRequirement = {
      property_type: 'home', setup_type: 'new', technology_preference: 'IP', resolution_preference: '2MP',
      indoor_camera_count: 2, recording_days: 15, recording_mode: 'continuous', special_features: [],
      wants_remote_viewing: false, broadband_status: 'no', addons: [], is_wired: true,
      timeline: 'week', brand_preference: 'cpplus', wants_amc: false,
      site_condition: 'furnished'
    };

    const config = generateConfiguration(req);
    expect(config.site_surcharge_flags?.requiresFurnishedSurcharge).toBe(true);
    expect(config.installer_requirements).toContain('Drop cloths, dust-covers, and vacuum for clean drilling');

    const resolved = resolveProducts(config, req, mockCatalog);
    const pricing = calculatePricingV2({ resolvedSystem: (resolved.recommended as any), req, settings: baseSettings, addons: [] });
    
    expect(pricing.items.find(i => i.product_id === 'surcharge_furnished')?.line_total).toBe(300);
  });

  test('6. Under Construction → standard/discounted labor', () => {
    const req: CCTVRequirement = {
      property_type: 'home', setup_type: 'new', technology_preference: 'IP', resolution_preference: '2MP',
      indoor_camera_count: 2, recording_days: 15, recording_mode: 'continuous', special_features: [],
      wants_remote_viewing: false, broadband_status: 'no', addons: [], is_wired: true,
      timeline: 'week', brand_preference: 'cpplus', wants_amc: false,
      site_condition: 'under_construction'
    };

    const config = generateConfiguration(req);
    expect(config.site_surcharge_flags?.requiresFurnishedSurcharge).toBe(false);
    
    const resolved = resolveProducts(config, req, mockCatalog);
    const pricing = calculatePricingV2({ resolvedSystem: (resolved.recommended as any), req, settings: baseSettings, addons: [] });
    
    expect(pricing.items.find(i => i.product_id === 'surcharge_furnished')).toBeUndefined();
  });

  test('7. Thick wall/floor → drilling surcharge + installer requirement', () => {
    const req: CCTVRequirement = {
      property_type: 'home', setup_type: 'new', technology_preference: 'IP', resolution_preference: '2MP',
      indoor_camera_count: 2, recording_days: 15, recording_mode: 'continuous', special_features: [],
      wants_remote_viewing: false, broadband_status: 'no', addons: [], is_wired: true,
      timeline: 'week', brand_preference: 'cpplus', wants_amc: false,
      wall_penetration: 'thick_drilling'
    };

    const config = generateConfiguration(req);
    expect(config.site_surcharge_flags?.requiresHeavyDrillingSurcharge).toBe(true);
    expect(config.installer_requirements).toContain('Heavy duty hammer drill & 1.5ft+ long masonry bits');

    const resolved = resolveProducts(config, req, mockCatalog);
    const pricing = calculatePricingV2({ resolvedSystem: (resolved.recommended as any), req, settings: baseSettings, addons: [] });
    
    expect(pricing.items.find(i => i.product_id === 'surcharge_wall_drilling')?.line_total).toBe(600);
  });

  test('8. Indoor/outdoor counts → Dome/Bullet quantities सही', () => {
    const req: CCTVRequirement = {
      property_type: 'home', setup_type: 'new', technology_preference: 'IP', resolution_preference: '2MP',
      indoor_camera_count: 3, 
      outdoor_camera_count: 2, 
      recording_days: 15, recording_mode: 'continuous', special_features: [],
      wants_remote_viewing: false, broadband_status: 'no', addons: [], is_wired: true,
      timeline: 'week', brand_preference: 'recommend', wants_amc: false,
    };

    const config = generateConfiguration(req);
    expect(config.total_cameras).toBe(5);
    expect(config.indoor_cameras).toBe(3);
    expect(config.outdoor_cameras).toBe(2);

    const resolved = resolveProducts(config, req, mockCatalog);
    
    // We expect 3 Dome cameras and 2 Bullet cameras
    const cameras = resolved.recommended.cameras;
    expect(cameras.length).toBe(2); // Two line items
    
    const domeItem = cameras.find(c => (c.product.specifications as any)?.formFactor === 'DOME');
    const bulletItem = cameras.find(c => (c.product.specifications as any)?.formFactor === 'BULLET');
    
    expect(domeItem?.qty).toBe(3);
    expect(bulletItem?.qty).toBe(2);
  });

});
