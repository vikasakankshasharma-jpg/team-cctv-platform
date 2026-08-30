import { test, expect } from '@playwright/test';
import { calculateSlaDeadline, OperatingHours } from '../lib/sla-engine';

test.describe('SLA Engine Business Logic', () => {
  const standardOps: OperatingHours = {
    start_time: "10:00",
    end_time: "18:00",
    days_off: [0] // Sunday
  };

  test('should calculate deadline within the same business day', () => {
    // Monday, 11:00 AM
    const createdAt = new Date('2023-10-09T11:00:00').toISOString();
    // 2 hours SLA
    const deadline = calculateSlaDeadline(createdAt, 2, standardOps);
    
    // Expect Monday, 13:00 (1:00 PM)
    expect(new Date(deadline).toISOString()).toBe(new Date('2023-10-09T13:00:00').toISOString());
  });

  test('should push deadline to next day if created near closing time', () => {
    // Monday, 17:00 (5:00 PM)
    const createdAt = new Date('2023-10-09T17:00:00').toISOString();
    // 2 hours SLA
    const deadline = calculateSlaDeadline(createdAt, 2, standardOps);
    
    // 1 hour used today (until 18:00). 1 hour remains for tomorrow.
    // Tomorrow (Tuesday) starts at 10:00 AM. Deadline = 11:00 AM Tuesday.
    expect(new Date(deadline).toISOString()).toBe(new Date('2023-10-10T11:00:00').toISOString());
  });

  test('should skip Sunday entirely', () => {
    // Saturday, 17:00 (5:00 PM)
    const createdAt = new Date('2023-10-14T17:00:00').toISOString();
    // 2 hours SLA
    const deadline = calculateSlaDeadline(createdAt, 2, standardOps);
    
    // 1 hour used Saturday. 1 hour remains.
    // Skips Sunday (day 0).
    // Monday starts at 10:00 AM. Deadline = 11:00 AM Monday.
    expect(new Date(deadline).toISOString()).toBe(new Date('2023-10-16T11:00:00').toISOString());
  });

  test('should fast-forward if created before working hours', () => {
    // Monday, 07:00 AM
    const createdAt = new Date('2023-10-09T07:00:00').toISOString();
    // 2 hours SLA
    const deadline = calculateSlaDeadline(createdAt, 2, standardOps);
    
    // Starts counting at 10:00 AM. Deadline = 12:00 PM.
    expect(new Date(deadline).toISOString()).toBe(new Date('2023-10-09T12:00:00').toISOString());
  });

  test('should fast-forward if created after working hours', () => {
    // Monday, 20:00 (8:00 PM)
    const createdAt = new Date('2023-10-09T20:00:00').toISOString();
    // 2 hours SLA
    const deadline = calculateSlaDeadline(createdAt, 2, standardOps);
    
    // Starts counting Tuesday 10:00 AM. Deadline = 12:00 PM.
    expect(new Date(deadline).toISOString()).toBe(new Date('2023-10-10T12:00:00').toISOString());
  });

  test('should calculate correctly for multi-day SLAs', () => {
    // Monday, 11:00 AM
    const createdAt = new Date('2023-10-09T11:00:00').toISOString();
    // 24 hours SLA (requires 3 full 8-hour working days)
    const deadline = calculateSlaDeadline(createdAt, 24, standardOps);
    
    // Mon: 7 hrs (11-18)
    // Tue: 8 hrs (10-18)
    // Wed: 8 hrs (10-18)
    // Thu: 1 hr (10-11)
    expect(new Date(deadline).toISOString()).toBe(new Date('2023-10-12T11:00:00').toISOString());
  });
});
