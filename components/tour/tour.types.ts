"use client";

import type { ReactNode } from "react";

export type TourTextResolverContext = {
  pageId: string;
  activeStep?: number | string;
  stepId: string;
  index: number;
  totalSteps: number;
};

export type TourText =
  | string
  | ((context: TourTextResolverContext) => string);

export type TourTranslationResolver = (
  key: string,
  context?: TourTextResolverContext,
) => string;

export type TourLocalizedText =
  | string
  | {
      key: string;
      fallback?: string;
      values?: Record<string, unknown>;
    }
  | ((context: TourTextResolverContext) => string);

export type TourStep = {
  id: string;
  /**
   * DOM selector for the target element.
   * Recommended: [data-tour="camera-count"]
   */
  target: string;
  title: TourLocalizedText;
  description: TourLocalizedText;
  actionPrompt?: TourLocalizedText;
  nextLabel?: TourLocalizedText;
  optional?: boolean;
  activeStep?: number | string;
};

export type PageTourConfig = {
  pageId: string;
  title?: TourLocalizedText;
  autoStart?: boolean;
  steps: TourStep[];
  translate?: TourTranslationResolver;
};

export type TourPosition = "top" | "bottom";

export type TourState =
  | "idle"
  | "running"
  | "completed"
  | "skipped";

export type TourTriggerRenderer = (
  openTour: () => void,
) => ReactNode;

export type TourAnalyticsEvent =
  | {
      type: "tour_started";
      pageId: string;
      contextKey?: string;
      stepId?: string;
    }
  | {
      type: "tour_step_viewed";
      pageId: string;
      contextKey?: string;
      stepId: string;
      stepIndex: number;
      totalSteps: number;
    }
  | {
      type: "tour_completed";
      pageId: string;
      contextKey?: string;
      totalSteps: number;
    }
  | {
      type: "tour_skipped";
      pageId: string;
      contextKey?: string;
      stepId?: string;
      stepIndex?: number;
      totalSteps?: number;
    }
  | {
      type: "tour_skip_all";
      pageId: string;
      contextKey?: string;
      stepId?: string;
    };

export type TourAnalyticsCallback = (
  event: TourAnalyticsEvent,
) => void;

export type UsePageTourOptions = {
  config: PageTourConfig;
  activeStep?: number | string;
  stepKey?: string;
  translate?: TourTranslationResolver;
};
