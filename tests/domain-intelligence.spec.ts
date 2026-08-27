import { expect, test } from '@playwright/test';
import { generateConfiguration } from '../lib/configuration-engine';
import { resolveProducts } from '../lib/product-resolver';
import { CCTVRequirement, Product } from '../types';

test.describe('Configuration Engine', () => {
  test('8 IP cameras for 30 days generates correct storage and 8CH NVR requirement', () => {
    const req = {
      camera_count: 8,
      recording_mode: 'continuous',
      recording_days: 30,
      technology_preference: 'IP',
      wants_remote_viewing: true,
      cable_length_meters: 20
    } as CCTVRequirement;

    const config = generateConfiguration(req);

    expect(config.total_cameras).toBe(8);
    expect(config.wired_cameras).toBe(8);
    expect(config.recorder_channels).toBe(8);
    // 8 cameras * 40GB * 30 days = 9600 GB
    expect(config.storage_gb).toBe(9600);
    expect(config.cable_meters).toBe(160); // 8 * 20
    expect(config.connector_type).toBe('RJ45');
    expect(config.industrial_threshold_exceeded).toBe(false);
  });

  test('live_only recording mode outputs 0 storage', () => {
    const req = {
      camera_count: 4,
      recording_mode: 'live_only',
      recording_days: 0,
      technology_preference: 'HD',
      wants_remote_viewing: false
    } as CCTVRequirement;

    const config = generateConfiguration(req);

    expect(config.storage_gb).toBe(0);
    expect(config.recorder_channels).toBe(4);
  });

  test('wireless cameras generate correct outputs', () => {
    const req = {
      camera_count: 2,
      recording_mode: 'continuous',
      recording_days: 15,
      technology_preference: 'WiFi',
      wants_remote_viewing: true
    } as CCTVRequirement;

    const config = generateConfiguration(req);

    expect(config.wired_cameras).toBe(0);
    expect(config.wireless_cameras).toBe(2);
    expect(config.recorder_channels).toBeUndefined();
    expect(config.cable_meters).toBe(0);
  });
});

test.describe('Product Resolver', () => {
  const mockCatalog: Product[] = [
    {
      id: 'cam-1',
      technical_name: '2MP IP Dome',
      display_name: 'Budget 2MP Camera',
      category: 'cctv_camera',
      technologies: ['IP'],
      unit_price: 1500,
      is_active: true,
      is_quotation_eligible: true
    },
    {
      id: 'cam-2',
      technical_name: '5MP IP Bullet',
      display_name: 'Standard 5MP Camera',
      category: 'cctv_camera',
      technologies: ['IP'],
      unit_price: 2500,
      is_active: true,
      is_quotation_eligible: true
    },
    {
      id: 'cam-3',
      technical_name: '8MP IP ColorVu',
      display_name: 'Premium 8MP Camera',
      category: 'cctv_camera',
      technologies: ['IP'],
      unit_price: 4500,
      is_active: true,
      is_quotation_eligible: true
    },
    {
      id: 'nvr-8',
      technical_name: '8CH NVR',
      display_name: '8 Channel NVR',
      category: 'recorder',
      channels: 8,
      technologies: ['IP'],
      unit_price: 5000,
      is_active: true,
      is_quotation_eligible: true
    },
    {
      id: 'hdd-4tb',
      technical_name: '4TB HDD',
      display_name: '4TB Surveillance HDD',
      category: 'storage',
      technologies: [],
      storage_capacity_tb: 4,
      unit_price: 8000,
      is_active: true,
      is_quotation_eligible: true
    }
  ];

  test('resolves to correct budget, recommended, and premium tiers', () => {
    const req = {
      camera_count: 8,
      recording_mode: 'continuous',
      recording_days: 15, // Approx 4800GB
      technology_preference: 'IP',
      wants_remote_viewing: true
    } as CCTVRequirement;

    const config = generateConfiguration(req);
    const resolved = resolveProducts(config, req, mockCatalog);

    expect(resolved.budget.cameras[0].product.id).toBe('cam-1');
    expect(resolved.recommended.cameras[0].product.id).toBe('cam-2');
    expect(resolved.premium.cameras[0].product.id).toBe('cam-3');

    expect(resolved.budget.recorder?.id).toBe('nvr-8');
    
    // We mocked a 4TB HDD, config needs 4800GB (approx 4.8TB), so our mock 4TB will be selected because it's the only one (in a real scenario, we'd need an 8TB drive)
    // Actually our resolver logic: `p.storage_capacity_tb * 1024 >= config.storage_gb` 
    // 4 * 1024 = 4096. config is 4800. So it will return undefined for budget/rec/premium storage in this basic mock.
    expect(resolved.budget.storage).toBeUndefined(); 
  });
});
