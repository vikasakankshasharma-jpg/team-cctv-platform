import { format } from "date-fns";

/**
 * Safely parses any date representation (ISO string, JS Date, Firestore Timestamp, Unix ms/sec) into a Date object.
 * Returns null if the value cannot be parsed or is invalid.
 */
export function parseDateSafe(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === "object") {
    if (typeof val.toDate === "function") {
      try {
        const d = val.toDate();
        return isNaN(d.getTime()) ? null : d;
      } catch {
        return null;
      }
    }
    const sec = val._seconds ?? val.seconds;
    if (typeof sec === "number") {
      const d = new Date(sec * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Safely converts any date value to an ISO 8601 string.
 */
export function toIsoStringSafe(val: any): string | null {
  const d = parseDateSafe(val);
  return d ? d.toISOString() : null;
}

/**
 * Safely formats any date value with date-fns format.
 * Returns the fallback string if the date is null or invalid. Never throws RangeError: Invalid time value.
 */
export function safeFormatDate(val: any, fmt: string = "dd MMM yyyy, hh:mm a", fallback: string = "—"): string {
  const d = parseDateSafe(val);
  if (!d) return fallback;
  try {
    return format(d, fmt);
  } catch {
    return fallback;
  }
}
