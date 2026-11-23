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

/**
 * Returns today's date in YYYY-MM-DD formatted specifically in Indian Standard Time (Asia/Kolkata).
 * Eliminates UTC day boundary shifts.
 */
export function getTodayIST(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  } catch {
    const d = new Date();
    const istMs = d.getTime() + (5.5 * 60 * 60 * 1000);
    return new Date(istMs).toISOString().split("T")[0];
  }
}

/**
 * Returns current hour (0-23) in Indian Standard Time (Asia/Kolkata).
 */
export function getCurrentHourIST(): number {
  try {
    const str = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(new Date());
    return parseInt(str, 10);
  } catch {
    const d = new Date();
    const istMs = d.getTime() + (5.5 * 60 * 60 * 1000);
    return new Date(istMs).getUTCHours();
  }
}

/**
 * Returns tomorrow's date in YYYY-MM-DD formatted in Indian Standard Time (Asia/Kolkata).
 */
export function getTomorrowIST(): string {
  try {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(today);
  } catch {
    const d = new Date();
    const istMs = d.getTime() + (5.5 * 60 * 60 * 1000) + (24 * 60 * 60 * 1000);
    return new Date(istMs).toISOString().split("T")[0];
  }
}

/**
 * Checks whether a date string (YYYY-MM-DD or ISO) is strictly before today in IST.
 */
export function isPastDateIST(val: any): boolean {
  if (!val) return false;
  const todayStr = getTodayIST();
  let dateStr = "";
  if (typeof val === "string") {
    dateStr = val.split("T")[0];
  } else {
    const parsed = parseDateSafe(val);
    if (!parsed) return false;
    dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(parsed);
  }
  return Boolean(dateStr && dateStr < todayStr);
}

/**
 * Checks whether a scheduled time slot on a given date is already in the past in IST.
 */
export function isPastSlotIST(dateStr: string, slotStr?: string): boolean {
  if (isPastDateIST(dateStr)) return true;
  if (!dateStr || dateStr !== getTodayIST() || !slotStr) return false;
  const hour = getCurrentHourIST();
  const lower = slotStr.toLowerCase();
  if (lower.includes("morning") || lower.includes("10:00 am") || lower.includes("10_1")) {
    return hour >= 13;
  }
  if (lower.includes("afternoon") || lower.includes("01:00 pm") || lower.includes("2_5")) {
    return hour >= 17;
  }
  if (lower.includes("evening") || lower.includes("05:00 pm") || lower.includes("5_7")) {
    return hour >= 20;
  }
  return false;
}
