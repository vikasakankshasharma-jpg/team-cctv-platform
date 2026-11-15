// lib/analytics/tour-funnel-calculator.ts
// Pure calculation engine for Guided Tour Telemetry & Drop-Off Funnels

import type {
  TourFunnelDataset,
  TourFunnelSummary,
  TourStepFunnel,
} from "./tour-funnel-types";

export interface TourAnalyticsRow {
  type:
    | "tour_started"
    | "tour_step_viewed"
    | "tour_completed"
    | "tour_skipped"
    | "tour_skip_all";

  pageId: string;

  contextKey?: string;
  stepId?: string;

  stepIndex?: number;
  totalSteps?: number;

  /**
   * Anonymous session identifier (NEVER PII: no phone, email, customerId, quoteId, orderId).
   */
  sessionKey?: string;

  timestamp: number;
}

function percentage(numerator: number, denominator: number): number {
  if (denominator <= 0 || !Number.isFinite(denominator)) {
    return 0;
  }
  const result = (numerator / denominator) * 100;
  return Number(result.toFixed(1));
}

export function calculateTourFunnel(
  events: readonly TourAnalyticsRow[],
): TourFunnelDataset {
  const pageMap = new Map<string, TourFunnelSummary>();

  let totalStarted = 0;
  let totalCompleted = 0;
  let totalSkipped = 0;
  let totalSkipAll = 0;

  const getPage = (pageId: string): TourFunnelSummary => {
    let page = pageMap.get(pageId);
    if (!page) {
      page = {
        pageId,
        starts: 0,
        completions: 0,
        skips: 0,
        skipAll: 0,
        completionRate: 0,
        skipRate: 0,
        steps: [],
      };
      pageMap.set(pageId, page);
    }
    return page;
  };

  // 1. Process overall page-level events
  for (const event of events) {
    const page = getPage(event.pageId);

    switch (event.type) {
      case "tour_started":
        page.starts += 1;
        totalStarted += 1;
        break;

      case "tour_completed":
        page.completions += 1;
        totalCompleted += 1;
        break;

      case "tour_skipped":
        page.skips += 1;
        totalSkipped += 1;
        break;

      case "tour_skip_all":
        page.skipAll += 1;
        totalSkipAll += 1;
        break;

      default:
        break;
    }
  }

  // 2. Build step-level views and skips
  interface StepAccumulator extends TourStepFunnel {
    firstIndex: number;
  }

  const stepMap = new Map<string, Map<string, StepAccumulator>>();

  for (const event of events) {
    if (!event.stepId) {
      continue;
    }

    let pageSteps = stepMap.get(event.pageId);
    if (!pageSteps) {
      pageSteps = new Map();
      stepMap.set(event.pageId, pageSteps);
    }

    let step = pageSteps.get(event.stepId);
    if (!step) {
      step = {
        stepId: event.stepId,
        label: event.stepId,
        viewed: 0,
        skipped: 0,
        dropOff: 0,
        skipRate: 0,
        dropOffRate: 0,
        firstIndex: event.stepIndex ?? pageSteps.size,
      };
      pageSteps.set(event.stepId, step);
    }

    if (event.type === "tour_step_viewed") {
      step.viewed += 1;
    }

    if (event.type === "tour_skipped") {
      step.skipped += 1;
    }
  }

  // 3. Calculate step drop-offs and rates
  for (const [pageId, pageSteps] of stepMap) {
    const page = getPage(pageId);
    // Sort steps by their natural execution sequence
    const sortedSteps = [...pageSteps.values()].sort(
      (a, b) => a.firstIndex - b.firstIndex,
    );

    for (let i = 0; i < sortedSteps.length; i++) {
      const current = sortedSteps[i];
      current.skipRate = percentage(current.skipped, current.viewed);

      // Drop-off between current step and next step / completion
      const nextStep = sortedSteps[i + 1];
      const subsequentViewed = nextStep ? nextStep.viewed : page.completions;
      current.dropOff = Math.max(0, current.viewed - subsequentViewed);
      current.dropOffRate = percentage(current.dropOff, current.viewed);
    }

    page.steps = sortedSteps.map(({ firstIndex: _, ...rest }) => rest);
  }

  // 4. Calculate page rates
  for (const page of pageMap.values()) {
    page.completionRate = percentage(page.completions, page.starts);
    page.skipRate = percentage(page.skips, page.starts);
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      started: totalStarted,
      completed: totalCompleted,
      skipped: totalSkipped,
      skipAll: totalSkipAll,
    },
    pages: [...pageMap.values()],
  };
}
