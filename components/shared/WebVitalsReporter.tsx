"use client";

import { useReportWebVitals } from "next/dist/client/web-vitals";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * WebVitalsReporter — App Router Web Vitals → GA4
 *
 * Uses Next.js 15's `useReportWebVitals` hook (App Router native).
 * Reports LCP, CLS, INP, FCP, TTFB as GA4 custom events.
 *
 * Renders nothing — purely a measurement side-effect component.
 * Mount it once inside the root layout (inside ThemeProvider).
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (typeof window === "undefined") return;
    if (!window.gtag || !GA_ID) return;

    window.gtag("event", metric.name, {
      event_category:  "Web Vitals",
      event_label:     metric.id,
      // CLS is a 0-1 float; GA4 requires integers, so ×1000
      value:           Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      non_interaction: true,
      metric_rating:   metric.rating,
      metric_delta:    Math.round(metric.delta),
    });
  });

  return null;
}
