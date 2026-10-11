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
    expect(res.labor_cost).toBe(2000);
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
    expect(res.labor_cost).toBe(1500);
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
    expect(res.labor_cost).toBe(1300);
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
    expect(res.labor_cost).toBe(1100);
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
    expect(res.labor_cost).toBe(1000);
    // Flat travel fee is added as a line item
    const travelItem = res.items.find(i => i.product_id === "travel_fee");
    expect(travelItem).toBeDefined();
    expect(travelItem?.line_total).toBe(1000);
  });

});
