"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type {
  PageTourConfig,
  TourPosition,
  TourTriggerRenderer,
  TourTranslationResolver,
  TourAnalyticsCallback,
} from "./tour.types";

import { usePageTour } from "./usePageTour";
import { useI18nStore } from "@/lib/i18n/store";
import { useTourDictionary } from "@/lib/i18n/tour-translations";

type InteractivePageTourProps = {
  config: PageTourConfig;
  activeStep?: number | string;
  stepKey?: string;
  translate?: TourTranslationResolver;
  renderTrigger?: TourTriggerRenderer;
  showDefaultTrigger?: boolean;
  onTourEvent?: TourAnalyticsCallback;
};

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function InteractivePageTour({
  config,
  activeStep,
  stepKey,
  translate,
  renderTrigger,
  showDefaultTrigger = true,
  onTourEvent,
}: InteractivePageTourProps) {
  const { locale } = useI18nStore();
  const tourDict = useTourDictionary(locale);

  const activeTranslate = useCallback<TourTranslationResolver>(
    (key, context) => {
      if (translate) {
        const custom = translate(key, context);
        if (custom && custom !== key) return custom;
      }
      if (tourDict && tourDict[key]) {
        return tourDict[key];
      }
      return key;
    },
    [translate, tourDict],
  );

  const tour = usePageTour({
    config,
    activeStep,
    stepKey,
    translate: activeTranslate,
  });

  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [position, setPosition] = useState<TourPosition>("bottom");
  const targetRef = useRef<HTMLElement | null>(null);

  const contextKey = stepKey ?? (activeStep !== undefined ? String(activeStep) : undefined);

  const emitTourEvent = useCallback(
    (event: Parameters<NonNullable<typeof onTourEvent>>[0]) => {
      onTourEvent?.(event);
    },
    [onTourEvent],
  );

  const prevIsRunningRef = useRef(false);
  const prevStepIdRef = useRef<string | null>(null);

  // Emit tour_started
  useEffect(() => {
    if (tour.isRunning && !prevIsRunningRef.current) {
      emitTourEvent({
        type: "tour_started",
        pageId: config.pageId,
        contextKey,
        stepId: tour.currentStep?.id,
      });
    }
    prevIsRunningRef.current = tour.isRunning;
  }, [tour.isRunning, tour.currentStep?.id, config.pageId, contextKey, emitTourEvent]);

  // Emit tour_step_viewed on step transition
  useEffect(() => {
    if (tour.isRunning && tour.currentStep && tour.currentStep.id !== prevStepIdRef.current) {
      prevStepIdRef.current = tour.currentStep.id;
      emitTourEvent({
        type: "tour_step_viewed",
        pageId: config.pageId,
        contextKey,
        stepId: tour.currentStep.id,
        stepIndex: tour.currentIndex,
        totalSteps: tour.applicableSteps.length,
      });
    }
    if (!tour.isRunning) {
      prevStepIdRef.current = null;
    }
  }, [tour.isRunning, tour.currentStep, tour.currentIndex, tour.applicableSteps.length, config.pageId, contextKey, emitTourEvent]);

  const handleNext = useCallback(() => {
    if (tour.isLastStep) {
      emitTourEvent({
        type: "tour_completed",
        pageId: config.pageId,
        contextKey,
        totalSteps: tour.applicableSteps.length,
      });
    }
    tour.next();
  }, [tour, config.pageId, contextKey, emitTourEvent]);

  const handleSkipPage = useCallback(() => {
    emitTourEvent({
      type: "tour_skipped",
      pageId: config.pageId,
      contextKey,
      stepId: tour.currentStep?.id,
      stepIndex: tour.currentIndex,
      totalSteps: tour.applicableSteps.length,
    });
    tour.skipPage();
  }, [tour, config.pageId, contextKey, emitTourEvent]);

  const handleSkipAll = useCallback(() => {
    emitTourEvent({
      type: "tour_skip_all",
      pageId: config.pageId,
      contextKey,
      stepId: tour.currentStep?.id,
    });
    tour.skipAll();
  }, [tour, config.pageId, contextKey, emitTourEvent]);

  // Body Scroll Lock during active tour
  useEffect(() => {
    if (!tour.isRunning) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [tour.isRunning]);

  // Keyboard navigation (Escape to skip)
  useEffect(() => {
    if (!tour.isRunning) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkipPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tour.isRunning, handleSkipPage]);

  // Target Resolution & Measurement
  useLayoutEffect(() => {
    if (!tour.isRunning || !tour.currentStep) {
      setTargetRect(null);
      targetRef.current = null;
      return;
    }

    let cancelled = false;

    let attempts = 0;
    const tryResolve = () => {
      if (cancelled) return;
      const element = document.querySelector(
        tour.currentStep!.target,
      ) as HTMLElement | null;

      if (element) {
        targetRef.current = element;
        element.scrollIntoView({
          behavior: "auto",
          block: "center",
          inline: "nearest",
        });
        updateTargetRect(element, setTargetRect, setPosition);

        requestAnimationFrame(() => {
          if (cancelled) return;
          updateTargetRect(element, setTargetRect, setPosition);
        });
        return;
      }

      attempts++;
      if (attempts < 10) {
        requestAnimationFrame(tryResolve);
      } else if (tour.currentStep!.optional) {
        tour.next();
      }
    };

    tryResolve();

    return () => {
      cancelled = true;
    };
  }, [tour.isRunning, tour.currentStep, tour.next]);

  // Window Resize, Scroll & Orientation Change tracking
  useEffect(() => {
    if (!tour.isRunning) return;

    const update = () => {
      const element = targetRef.current;
      if (!element) return;
      updateTargetRect(element, setTargetRect, setPosition);
    };

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [tour.isRunning]);

  // Persistent Trigger when tour is not running
  if (!tour.isRunning) {
    if (renderTrigger) {
      return <>{renderTrigger(tour.openManually)}</>;
    }

    if (!showDefaultTrigger) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={tour.openManually}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-[9990] min-h-[44px] rounded-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm font-medium text-slate-700 dark:text-zinc-200 shadow-lg transition hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        aria-label="How this page works"
      >
        <span aria-hidden="true">💡</span>{" "}
        <span className="sm:hidden">Guide</span>
        <span className="hidden sm:inline">How this page works</span>
      </button>
    );
  }

  if (!targetRect || !tour.currentStep) {
    return null;
  }

  const title = tour.resolveText(tour.currentStep.title);
  const description = tour.resolveText(tour.currentStep.description);
  const actionPrompt = tour.resolveText(tour.currentStep.actionPrompt);
  const nextLabel =
    tour.resolveText(tour.currentStep.nextLabel) ||
    (tour.isLastStep ? "Done" : "Next / Try It");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9990] bg-black/50 supports-[backdrop-filter]:backdrop-blur-[1px] pointer-events-auto touch-none"
        aria-hidden="true"
        onClick={handleSkipPage}
      />

      {/* Spotlight cutout */}
      <div
        className="fixed z-[9991] rounded-xl ring-4 ring-blue-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.60)] pointer-events-none transition-[top,left,width,height] duration-200 ease-out"
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
        }}
        aria-hidden="true"
      />

      {/* Pulsing spotlight ring (compositor-friendly, ring-only scale) */}
      <div
        className="pointer-events-none fixed z-[9992] rounded-xl border-2 border-white/80 shadow-[0_0_0_3px_rgba(255,255,255,0.12)] animate-tour-pulse"
        style={{
          top: Math.max(0, targetRect.top - 4),
          left: Math.max(0, targetRect.left - 4),
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
        aria-hidden="true"
      />

      {/* Explanation Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed left-3 right-3 sm:left-auto sm:right-6 sm:w-[380px] max-h-[85vh] max-h-[85dvh] overflow-y-auto z-[9999] rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-2xl animate-tour-card-enter transition-all duration-200 ${
          position === "bottom"
            ? "bottom-[calc(1rem+env(safe-area-inset-bottom))]"
            : "top-[calc(1rem+env(safe-area-inset-top))]"
        }`}
      >
        {/* Progress & Skip */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Step {tour.currentIndex + 1} of {tour.applicableSteps.length}
          </span>

          <button
            type="button"
            onClick={handleSkipPage}
            className="min-h-[44px] px-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            Skip
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-3.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${tour.progress}%` }}
          />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
          {title}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
          {description}
        </p>

        {/* Action Prompt */}
        {actionPrompt && (
          <div className="mt-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 px-3 py-2 text-xs font-medium text-blue-800 dark:text-blue-300">
            👉 {actionPrompt}
          </div>
        )}

        {/* Next / Back Buttons */}
        <div className="mt-4 flex items-center gap-2">
          {!tour.isFirstStep && (
            <button
              type="button"
              onClick={tour.previous}
              className="min-h-[44px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="min-h-[44px] flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] px-4 text-xs sm:text-sm font-bold text-white shadow-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {nextLabel}
          </button>
        </div>

        {/* Skip All (Global) */}
        <button
          type="button"
          onClick={handleSkipAll}
          className="mt-2.5 min-h-[40px] w-full text-center text-[11px] font-medium text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
        >
          Don't show guides automatically again
        </button>
      </div>
    </>
  );
}

function updateTargetRect(
  element: HTMLElement,
  setTargetRect: (rect: Rect | null) => void,
  setPosition: (position: TourPosition) => void,
) {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;

  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const center = rect.top + rect.height / 2;

  // Smart Mobile Inversion:
  // Tour cards are ~320-380px tall. If target is in the lower 55% of the screen,
  // dock the card at top to prevent covering the spotlighted element on mobile.
  const threshold = viewportHeight * 0.45;
  setPosition(center > threshold ? "top" : "bottom");

  const padding = 6;
  const left = Math.max(0, rect.left - padding);
  const top = Math.max(0, rect.top - padding);
  const maxW = Math.max(0, viewportWidth - left);
  const maxH = Math.max(0, viewportHeight - top);

  setTargetRect({
    top,
    left,
    width: Math.min(rect.width + padding * 2, maxW),
    height: Math.min(rect.height + padding * 2, maxH),
  });
}
