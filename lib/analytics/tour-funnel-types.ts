// lib/analytics/tour-funnel-types.ts
// Strict Read-Only Observer Contract for Guided Tour Telemetry

export interface TourStepFunnel {
  stepId: string;
  label: string;

  viewed: number;
  skipped: number;

  /**
   * Users who reached this step but did not advance to the next step or completion.
   */
  dropOff: number;

  skipRate: number;
  dropOffRate: number;
}

export interface TourFunnelSummary {
  pageId: string;

  starts: number;
  completions: number;
  skips: number;
  skipAll: number;

  completionRate: number;
  skipRate: number;

  steps: TourStepFunnel[];
}

export interface TourFunnelDataset {
  generatedAt: string;

  totals: {
    started: number;
    completed: number;
    skipped: number;
    skipAll: number;
  };

  pages: TourFunnelSummary[];
}
