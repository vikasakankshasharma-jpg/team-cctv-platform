/**
 * Inactivity Aging & Omnichannel Touchpoint Engine
 * Evaluates relationship health for Customer Leads and B2B Promoters.
 */

export type InactivityHealth = "active" | "due" | "overdue" | "never";

export interface InactivityResult {
  days_inactive: number | null;
  health: InactivityHealth;
  badge_text: string;
  badge_color: string;
  is_overdue: boolean;
  last_touch_formatted: string;
}

/**
 * Calculates inactivity aging relative to a target cadence (default 14 days)
 */
export function calculateInactivityAging(
  lastTouchpoint: string | null | undefined,
  frequencyDays: number = 14
): InactivityResult {
  if (!lastTouchpoint) {
    return {
      days_inactive: null,
      health: "never",
      badge_text: "⚠️ Never Contacted",
      badge_color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
      is_overdue: true,
      last_touch_formatted: "Never",
    };
  }

  const touchDate = new Date(lastTouchpoint);
  if (isNaN(touchDate.getTime())) {
    return {
      days_inactive: null,
      health: "never",
      badge_text: "⚠️ Unknown",
      badge_color: "bg-zinc-100 text-zinc-600 border-zinc-200",
      is_overdue: false,
      last_touch_formatted: "Invalid date",
    };
  }

  const diffMs = Date.now() - touchDate.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  let health: InactivityHealth = "active";
  let badge_text = `🟢 ${days}d ago`;
  let badge_color = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800";
  let is_overdue = false;

  if (days === 0) {
    badge_text = "🟢 Today";
  } else if (days === 1) {
    badge_text = "🟢 Yesterday";
  } else if (days >= frequencyDays) {
    health = "overdue";
    badge_text = `🔴 ${days}d Inactive`;
    badge_color = "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-300 dark:border-red-800 font-bold";
    is_overdue = true;
  } else if (days >= Math.floor(frequencyDays / 2)) {
    health = "due";
    badge_text = `🟡 Due (${days}d)`;
    badge_color = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800";
    is_overdue = false;
  }

  return {
    days_inactive: days,
    health,
    badge_text,
    badge_color,
    is_overdue,
    last_touch_formatted: touchDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  };
}

/**
 * Returns the latest timestamp among multiple touchpoint channels
 */
export function getLatestTouchpointDate(data: {
  last_visited_at?: string | null;
  last_called_at?: string | null;
  last_whatsapp_at?: string | null;
  last_contacted_at?: string | null;
  created_at?: any;
}): string | null {
  const dates: number[] = [];

  const addIfValid = (val: any) => {
    if (!val) return;
    const str = typeof val?.toDate === "function" ? val.toDate().toISOString() : typeof val === "string" ? val : null;
    if (str) {
      const ms = new Date(str).getTime();
      if (!isNaN(ms)) dates.push(ms);
    }
  };

  addIfValid(data.last_visited_at);
  addIfValid(data.last_called_at);
  addIfValid(data.last_whatsapp_at);
  addIfValid(data.last_contacted_at);

  if (dates.length === 0) {
    addIfValid(data.created_at);
  }

  if (dates.length === 0) return null;
  const maxMs = Math.max(...dates);
  return new Date(maxMs).toISOString();
}
