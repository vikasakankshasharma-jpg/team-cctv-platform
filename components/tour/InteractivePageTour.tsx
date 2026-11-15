"use client";

import {
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
} from "./tour.types";

import { usePageTour } from "./usePageTour";

type InteractivePageTourProps = {
  config: PageTourConfig;
  activeStep?: number | string;
  stepKey?: string;
  translate?: TourTranslationResolver;
  renderTrigger?: TourTriggerRenderer;
  showDefaultTrigger?: boolean;
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
}: InteractivePageTourProps) {
  const tour = usePageTour({
    config,
    activeStep,
    stepKey,
    translate,
  });

  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [position, setPosition] = useState<TourPosition>("bottom");
  const targetRef = useRef<HTMLElement | null>(null);

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
        tour.skipPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tour.isRunning, tour.skipPage]);

  // Target Resolution & Measurement
  useLayoutEffect(() => {
    if (!tour.isRunning || !tour.currentStep) {
      setTargetRect(null);
      targetRef.current = null;
      return;
    }

    let cancelled = false;

    const resolveTarget = () => {
      const element = document.querySelector(
        tour.currentStep!.target,
      ) as HTMLElement | null;

      if (!element) {
        if (tour.currentStep!.optional) {
          tour.next();
        }
        return;
      }

      targetRef.current = element;

      if (cancelled) return;

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      requestAnimationFrame(() => {
        if (cancelled) return;
        updateTargetRect(element, setTargetRect, setPosition);
      });
    };

    const timer = window.setTimeout(resolveTarget, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [tour.isRunning, tour.currentStep, tour.next]);

  // Window Resize & Orientation Change tracking
  useEffect(() => {
    if (!tour.isRunning) return;

    const update = () => {
      const element = targetRef.current;
      if (!element) return;
      updateTargetRect(element, setTargetRect, setPosition);
    };

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
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
        className="fixed inset-0 z-[9997] bg-black/60 backdrop-blur-[1px] pointer-events-auto"
        aria-hidden="true"
        onClick={tour.skipPage}
      />

      {/* Spotlight cutout */}
      <div
        className="fixed z-[9998] rounded-xl ring-4 ring-blue-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.60)] pointer-events-none transition-all duration-200"
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
        }}
        aria-hidden="true"
      />

      {/* Explanation Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed left-4 right-4 z-[9999] rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-2xl transition-all duration-200 sm:left-auto sm:right-6 sm:w-[380px] ${
          position === "bottom"
            ? "bottom-[calc(1rem+env(safe-area-inset-bottom))]"
            : "top-4"
        }`}
      >
        {/* Progress & Skip */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Step {tour.currentIndex + 1} of {tour.applicableSteps.length}
          </span>

          <button
            type="button"
            onClick={tour.skipPage}
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
            onClick={tour.next}
            className="min-h-[44px] flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] px-4 text-xs sm:text-sm font-bold text-white shadow-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {nextLabel}
          </button>
        </div>

        {/* Skip All (Global) */}
        <button
          type="button"
          onClick={tour.skipAll}
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
  const viewportHeight = window.innerHeight;
  const center = rect.top + rect.height / 2;

  // If target center is in top half of screen, show card at bottom.
  // If target center is in bottom half, show card at top.
  setPosition(center < viewportHeight / 2 ? "bottom" : "top");

  const padding = 6;
  setTargetRect({
    top: Math.max(0, rect.top - padding),
    left: Math.max(0, rect.left - padding),
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  });
}
