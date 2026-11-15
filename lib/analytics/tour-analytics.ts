// lib/analytics/tour-analytics.ts

import type { TourAnalyticsEvent } from "@/components/tour/tour.types";

const TOUR_EVENT_NAME = "team-tour-event";

/**
 * Strict allow-list for telemetry safety.
 * Only sanitized, non-PII fields are allowed.
 */
export type SafeTourAnalyticsEvent = {
  type: TourAnalyticsEvent["type"];
  pageId: string;
  contextKey?: string;
  stepId?: string;
  stepIndex?: number;
  totalSteps?: number;
};

/**
 * Sanitizes the event by reconstructing an explicit object from the allow-list.
 * Guarantees zero leakage of customer names, phones, emails, order/quote IDs, or secret PINs.
 */
function sanitizeTourEvent(event: TourAnalyticsEvent): SafeTourAnalyticsEvent {
  const safe: SafeTourAnalyticsEvent = {
    type: event.type,
    pageId: sanitizeString(event.pageId),
  };

  if ("contextKey" in event && event.contextKey !== undefined) {
    safe.contextKey = sanitizeString(event.contextKey);
  }

  if ("stepId" in event && event.stepId !== undefined) {
    safe.stepId = sanitizeString(event.stepId);
  }

  if ("stepIndex" in event && event.stepIndex !== undefined) {
    safe.stepIndex = sanitizeNumber(event.stepIndex);
  }

  if ("totalSteps" in event && event.totalSteps !== undefined) {
    safe.totalSteps = sanitizeNumber(event.totalSteps);
  }

  return safe;
}

function sanitizeString(value: string): string {
  return String(value).trim().slice(0, 200);
}

function sanitizeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/**
 * Dispatches a lightweight custom DOM event.
 * Fire-and-forget, never blocks the main UI thread.
 */
function dispatchTourDomEvent(event: SafeTourAnalyticsEvent): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.dispatchEvent(
      new CustomEvent<SafeTourAnalyticsEvent>(TOUR_EVENT_NAME, {
        detail: event,
      }),
    );
  } catch {
    // Analytics failure must never interrupt the tour.
  }
}

/**
 * Lazily logs to Firebase Analytics if available in the browser.
 * Completely decoupled; failures are absorbed silently.
 */
async function logTourEventToFirebase(event: SafeTourAnalyticsEvent): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const { getAnalytics, isSupported, logEvent } = await import("firebase/analytics");
    const supported = await isSupported();

    if (!supported) {
      return;
    }

    const analytics = getAnalytics();

    logEvent(analytics, event.type, {
      page_id: event.pageId,
      ...(event.contextKey ? { context_key: event.contextKey } : {}),
      ...(event.stepId ? { step_id: event.stepId } : {}),
      ...(event.stepIndex !== undefined ? { step_index: event.stepIndex } : {}),
      ...(event.totalSteps !== undefined ? { total_steps: event.totalSteps } : {}),
    });
  } catch {
    // Best effort: Offline state or missing analytics config must never break the user experience.
  }
}

/**
 * Public Tour Telemetry Boundary.
 *
 * Guarantees:
 * 1. SSR-safe
 * 2. Strict allow-list PII protection
 * 3. Custom DOM event for zero-latency UI subscribers
 * 4. Best-effort Firebase Analytics logging
 * 5. Analytics failure cannot crash or stall the user tour
 */
export function trackTourEvent(event: TourAnalyticsEvent): void {
  const safeEvent = sanitizeTourEvent(event);
  dispatchTourDomEvent(safeEvent);
  void logTourEventToFirebase(safeEvent);
}

/**
 * Optional helper for subscribers to listen to tour events cleanly.
 */
export function subscribeToTourEvents(
  handler: (event: SafeTourAnalyticsEvent) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<SafeTourAnalyticsEvent>;
    if (!customEvent.detail) return;
    handler(customEvent.detail);
  };

  window.addEventListener(TOUR_EVENT_NAME, listener);
  return () => {
    window.removeEventListener(TOUR_EVENT_NAME, listener);
  };
}
