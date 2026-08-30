import { test, expect } from '@playwright/test';
import { calculateCommission, validateSlabs } from '../lib/commission';
import type { CommissionSlab } from '../types';

test.describe('Commission Engine Business Logic', () => {
  
  test.describe('validateSlabs()', () => {
    test('should pass valid slabs', () => {
      const validSlabs: CommissionSlab[] = [
        { from: 0, to: 50000, type: 'percent', value: 5 },
        { from: 50000, to: null, type: 'percent', value: 7 }
      ];
      expect(validateSlabs(validSlabs)).toBeNull();
    });

    test('should reject if first slab does not start at 0', () => {
      const invalidSlabs: CommissionSlab[] = [
        { from: 1000, to: 50000, type: 'percent', value: 5 },
        { from: 50000, to: null, type: 'percent', value: 7 }
      ];
      expect(validateSlabs(invalidSlabs)).toBe('The first slab must start from 0.');
    });

    test('should reject if there is a gap between slabs', () => {
      const invalidSlabs: CommissionSlab[] = [
        { from: 0, to: 40000, type: 'percent', value: 5 },
        { from: 50000, to: null, type: 'percent', value: 7 }
      ];
      expect(validateSlabs(invalidSlabs)).toContain('Gap or overlap detected');
    });

    test('should reject if intermediate slab has no upper limit', () => {
      const invalidSlabs: CommissionSlab[] = [
        { from: 0, to: null, type: 'percent', value: 5 },
        { from: 50000, to: null, type: 'percent', value: 7 }
      ];
      expect(validateSlabs(invalidSlabs)).toBe('Only the last slab can have no upper limit.');
    });
  });

  test.describe('calculateCommission()', () => {
    const slabs: CommissionSlab[] = [
      { from: 0, to: 50000, type: 'percent', value: 5 }, // 0 to 49,999.99
      { from: 50000, to: 100000, type: 'flat', value: 3000 }, // 50k to 99,999.99
      { from: 100000, to: null, type: 'percent', value: 10 } // 100k+
    ];

    test('should calculate percentage commission for first tier', () => {
      const amount = 40000;
      // 5% of 40000 = 2000
      expect(calculateCommission(amount, slabs)).toBe(2000);
    });

    test('should calculate flat commission for second tier', () => {
      const amount = 75000;
      // Flat 3000
      expect(calculateCommission(amount, slabs)).toBe(3000);
    });

    test('should calculate percentage commission for infinite top tier', () => {
      const amount = 150000;
      // 10% of 150000 = 15000
      expect(calculateCommission(amount, slabs)).toBe(15000);
    });

    test('should handle edge case matching exact threshold boundaries', () => {
      const amount = 50000;
      // Should fall into second tier (flat 3000) because condition is >= from
      expect(calculateCommission(amount, slabs)).toBe(3000);
    });

    test('should return 0 for negative or zero amounts', () => {
      expect(calculateCommission(0, slabs)).toBe(0);
      expect(calculateCommission(-5000, slabs)).toBe(0);
    });
    
    test('should round to 2 decimal places', () => {
      const precisionSlabs: CommissionSlab[] = [
        { from: 0, to: null, type: 'percent', value: 3.33 }
      ];
      const amount = 1000;
      // 3.33% of 1000 = 33.3
      expect(calculateCommission(amount, precisionSlabs)).toBe(33.3);
      
      const amount2 = 1234.56;
      // 3.33% of 1234.56 = 41.110848 -> 41.11
      expect(calculateCommission(amount2, precisionSlabs)).toBe(41.11);
    });
  });
});
