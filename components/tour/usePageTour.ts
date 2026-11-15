"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  PageTourConfig,
  TourLocalizedText,
  TourState,
  TourStep,
  TourTextResolverContext,
  TourTranslationResolver,
  UsePageTourOptions,
} from "./tour.types";

import {
  isTourSkipAllEnabled,
  setTourSkipAll,
  isPageTourSkipped,
  setPageTourSkipped,
} from "@/lib/tour/tour-storage";

export function resolveTourText(
  value: TourLocalizedText | undefined,
  context: TourTextResolverContext,
  translate?: TourTranslationResolver,
): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "function") {
    return value(context);
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "key" in value) {
    if (!translate) {
      return value.fallback || value.key;
    }
    const translated = translate(value.key, context);
    if (!translated || translated === value.key) {
      return value.fallback || value.key;
    }
    return translated;
  }

  return "";
}

function stepMatchesActiveStep(
  step: TourStep,
  activeStep?: number | string,
  stepKey?: string,
): boolean {
  if (step.activeStep === undefined) {
    return true;
  }
  if (activeStep !== undefined && step.activeStep === activeStep) {
    return true;
  }
  if (stepKey !== undefined && String(step.activeStep) === stepKey) {
    return true;
  }
  return false;
}

function getApplicableSteps(
  config: PageTourConfig,
  activeStep?: number | string,
  stepKey?: string,
): TourStep[] {
  return config.steps.filter((step) =>
    stepMatchesActiveStep(step, activeStep, stepKey),
  );
}

export function usePageTour({
  config,
  activeStep,
  stepKey,
  translate,
}: UsePageTourOptions) {
  const [state, setState] = useState<TourState>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);

  const seenContextsRef = useRef<Set<string>>(new Set());

  const applicableSteps = useMemo(
    () => getApplicableSteps(config, activeStep, stepKey),
    [config, activeStep, stepKey],
  );

  const currentStep = applicableSteps[currentIndex] ?? null;
  const isRunning = state === "running";

  const contextKey = useMemo(() => {
    const stepIdentity = stepKey ?? String(activeStep ?? "page");
    return `${config.pageId}:${stepIdentity}`;
  }, [config.pageId, activeStep, stepKey]);

  useEffect(() => {
    if (!config.autoStart) return;
    if (typeof window === "undefined") return;
    if (isTourSkipAllEnabled()) return;
    if (isPageTourSkipped(config.pageId)) return;
    if (applicableSteps.length === 0) return;

    if (seenContextsRef.current.has(contextKey)) {
      return;
    }

    seenContextsRef.current.add(contextKey);
    setCurrentIndex(0);
    setState("running");
  }, [
    config.autoStart,
    config.pageId,
    applicableSteps.length,
    contextKey,
  ]);

  const previousContextRef = useRef(contextKey);

  useEffect(() => {
    if (previousContextRef.current === contextKey) {
      return;
    }
    previousContextRef.current = contextKey;

    if (!isRunning || applicableSteps.length === 0) {
      return;
    }

    setCurrentIndex(0);
  }, [contextKey, isRunning, applicableSteps.length]);

  const start = useCallback(() => {
    if (applicableSteps.length === 0) return;
    setCurrentIndex(0);
    setState("running");
  }, [applicableSteps.length]);

  const openManually = useCallback(() => {
    if (applicableSteps.length === 0) return;
    setCurrentIndex(0);
    setState("running");
  }, [applicableSteps.length]);

  const skipPage = useCallback(() => {
    setPageTourSkipped(config.pageId, true);
    setState("skipped");
  }, [config.pageId]);

  const skipAll = useCallback(() => {
    setTourSkipAll(true);
    setState("skipped");
  }, []);

  const next = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= applicableSteps.length) {
      setState("completed");
      return;
    }
    setCurrentIndex(nextIndex);
  }, [currentIndex, applicableSteps.length]);

  const previous = useCallback(() => {
    if (currentIndex === 0) return;
    setCurrentIndex((index) => index - 1);
  }, [currentIndex]);

  const progress = useMemo(() => {
    if (applicableSteps.length === 0) return 0;
    return ((currentIndex + 1) / applicableSteps.length) * 100;
  }, [currentIndex, applicableSteps.length]);

  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === applicableSteps.length - 1;

  const textContext: TourTextResolverContext = useMemo(
    () => ({
      pageId: config.pageId,
      activeStep,
      stepId: currentStep?.id ?? "",
      index: currentIndex,
      totalSteps: applicableSteps.length,
    }),
    [
      config.pageId,
      activeStep,
      currentStep?.id,
      currentIndex,
      applicableSteps.length,
    ],
  );

  const resolveText = useCallback(
    (value: TourLocalizedText | undefined) =>
      resolveTourText(value, textContext, translate ?? config.translate),
    [textContext, translate, config.translate],
  );

  return {
    state,
    isRunning,
    activeStep,
    stepKey,
    applicableSteps,
    currentStep,
    currentIndex,
    progress,
    isFirstStep,
    isLastStep,
    textContext,
    resolveText,
    start,
    openManually,
    next,
    previous,
    skipPage,
    skipAll,
  };
}
