import { test, expect } from '@playwright/test';
import { calculatePricing } from '../lib/pricing-engine';

test.describe('Phase 2: Geo-Pricing Waterfall', () => {

  const mockProduct = {
    id: "cam_01",
    category: "cctv_camera",
    technologies: ["HD"],
    unit_price: 1000,
    base_cost: 500,
    stock_quantity: 10,
    is_active: true
  };

  const mockSettings = {
    labor_hd_per_camera: 500,
    visit_charge: 300,
    gst_rate: 18
  };

  const baseParams = {
    selection: {
      camera_count: 2,
      technology: "HD",
      selected_camera_id: "cam_01"
    },
    products: [mockProduct as any],
    addons: [],
    settings: mockSettings as any,
    cablingDone: true, // simplified calculation
  };

  test('Should resolve SURGE over Pincode/City/State', () => {
    const res = calculatePricing({
      ...baseParams,
      geoRules: [
        { level: "state", target_value: "Rajasthan", labor_multiplier: 1.1, priority: 1, is_active: true },
        { level: "surge", target_value: "FESTIVAL", labor_multiplier: 2.0, priority: 0, is_active: true }
      ],
      locationParams: { state: "Rajasthan" }
    });

    // Labor for 2 HD cameras = 2 * 500 = 1000
    // Surge multiplier = 2.0 -> 2000
    // Base Hardware = (1000 * 2) + 2000 + 140 (connectors) = 4140
    expect(res.base_hardware_cost).toBe(4140);
  });

  test('Should resolve PINCODE over CITY', () => {
    const res = calculatePricing({
      ...baseParams,
      geoRules: [
        { level: "city", target_value: "Jaipur", labor_multiplier: 1.2, priority: 1, is_active: true },
        { level: "pincode", target_value: "302001", labor_multiplier: 1.5, priority: 0, is_active: true }
      ],
      locationParams: { city: "Jaipur", pincode: "302001" }
    });

    // Labor: 1000 * 1.5 = 1500
    // Hardware: 2000 + 1500 + 140 = 3640
    expect(res.base_hardware_cost).toBe(3640);
  });

  test('Should resolve CITY over STATE', () => {
    const res = calculatePricing({
      ...baseParams,
      geoRules: [
        { level: "state", target_value: "Rajasthan", labor_multiplier: 1.1, priority: 1, is_active: true },
        { level: "city", target_value: "Udaipur", labor_multiplier: 1.3, priority: 0, is_active: true }
      ],
      locationParams: { state: "Rajasthan", city: "Udaipur" }
    });

    // Labor: 1000 * 1.3 = 1300
    // Hardware: 2000 + 1300 + 140 = 3440
    expect(res.base_hardware_cost).toBe(3440);
  });

  test('Should fallback to STATE if no other match', () => {
    const res = calculatePricing({
      ...baseParams,
      geoRules: [
        { level: "state", target_value: "Rajasthan", labor_multiplier: 1.1, priority: 1, is_active: true },
        { level: "city", target_value: "Jaipur", labor_multiplier: 1.3, priority: 0, is_active: true } // Non-matching city
      ],
      locationParams: { state: "Rajasthan", city: "Bikaner" }
    });

    // Labor: 1000 * 1.1 = 1100
    // Hardware: 2000 + 1100 + 140 = 3240
    expect(res.base_hardware_cost).toBe(3240);
  });

  test('Should apply flat travel fee from Geo Rule', () => {
    const res = calculatePricing({
      ...baseParams,
      geoRules: [
        { level: "pincode", target_value: "999999", flat_travel_fee: 1000, priority: 0, is_active: true }
      ],
      locationParams: { pincode: "999999" }
    });

    // Labor: 1000 * 1.0 (default) = 1000
    // Travel fee = 1000
    // Cameras: 2000
    // Connectors: 140
    // Total = 4140
    expect(res.base_hardware_cost).toBe(4140);
  });

});
