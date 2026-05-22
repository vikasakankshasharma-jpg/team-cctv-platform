export interface OperatingHours {
  start_time: string; // "10:00"
  end_time: string;   // "18:00"
  days_off: number[]; // 0=Sunday, 1=Monday, etc.
}

/**
 * Calculates the SLA deadline taking into account business operating hours and days off.
 * 
 * @param createdAt The ISO timestamp when the lead was created
 * @param slaDurationHours The number of hours for the SLA (e.g., 2)
 * @param operatingHours The franchise or global operating hours
 * @returns ISO timestamp of the SLA deadline
 */
export function calculateSlaDeadline(
  createdAt: string | Date,
  slaDurationHours: number = 2,
  operatingHours?: OperatingHours
): string {
  // Default to 10:00 AM - 6:00 PM, Sunday Off if not provided
  const ops = operatingHours || {
    start_time: "10:00",
    end_time: "18:00",
    days_off: [0]
  };

  const [startHour, startMin] = ops.start_time.split(":").map(Number);
  const [endHour, endMin] = ops.end_time.split(":").map(Number);

  let current = new Date(createdAt);
  let remainingMs = slaDurationHours * 60 * 60 * 1000;

  // Maximum loop safeguard (prevent infinite loops if all days are off)
  let loopCount = 0;
  
  while (remainingMs > 0 && loopCount < 30) {
    loopCount++;
    
    // Check if current day is a day off
    if (ops.days_off.includes(current.getDay())) {
      // Fast forward to next day at start time
      current.setDate(current.getDate() + 1);
      current.setHours(startHour, startMin, 0, 0);
      continue;
    }

    // Define business open and close times for the current date
    const openTime = new Date(current);
    openTime.setHours(startHour, startMin, 0, 0);

    const closeTime = new Date(current);
    closeTime.setHours(endHour, endMin, 0, 0);

    // If current time is before open time, fast forward to open time
    if (current.getTime() < openTime.getTime()) {
      current = new Date(openTime);
    }

    // If current time is after close time, fast forward to next day's open time
    if (current.getTime() >= closeTime.getTime()) {
      current.setDate(current.getDate() + 1);
      current.setHours(startHour, startMin, 0, 0);
      continue;
    }

    // We are within business hours. Calculate time left in today's shift.
    const timeToCloseMs = closeTime.getTime() - current.getTime();

    if (remainingMs <= timeToCloseMs) {
      // We can finish the SLA within today's shift
      current.setTime(current.getTime() + remainingMs);
      remainingMs = 0; // Done
    } else {
      // We hit closing time, subtract the time used today, push to tomorrow
      remainingMs -= timeToCloseMs;
      current.setDate(current.getDate() + 1);
      current.setHours(startHour, startMin, 0, 0);
    }
  }

  return current.toISOString();
}
