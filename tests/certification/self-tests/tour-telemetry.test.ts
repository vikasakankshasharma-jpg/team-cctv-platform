import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateTourFunnel,
  type TourAnalyticsRow,
} from "../../../lib/analytics/tour-funnel-calculator.ts";
import {
  loadTourDictionary,
  getTourTranslation,
} from "../../../lib/i18n/tour-translations.ts";

test("calculateTourFunnel handles empty events array without throwing", () => {
  const dataset = calculateTourFunnel([]);
  assert.equal(dataset.totals.started, 0);
  assert.equal(dataset.totals.completed, 0);
  assert.equal(dataset.totals.skipped, 0);
  assert.equal(dataset.totals.skipAll, 0);
  assert.equal(dataset.pages.length, 0);
  assert.ok(typeof dataset.generatedAt === "string");
});

test("calculateTourFunnel correctly computes completion, skip and drop-off rates", () => {
  const now = Date.now();
  const sampleEvents: TourAnalyticsRow[] = [
    // Page 1: quote-review (Starts: 10, Completions: 8, Skips: 2, SkipAll: 1)
    ...Array.from({ length: 10 }, (_, i) => ({
      type: "tour_started" as const,
      pageId: "quote-review",
      timestamp: now + i,
    })),
    // Step 1: 10 views, 1 skip
    ...Array.from({ length: 10 }, (_, i) => ({
      type: "tour_step_viewed" as const,
      pageId: "quote-review",
      stepId: "step-1",
      stepIndex: 0,
      timestamp: now + 10 + i,
    })),
    {
      type: "tour_skipped" as const,
      pageId: "quote-review",
      stepId: "step-1",
      timestamp: now + 20,
    },
    // Step 2: 8 views, 1 skip
    ...Array.from({ length: 8 }, (_, i) => ({
      type: "tour_step_viewed" as const,
      pageId: "quote-review",
      stepId: "step-2",
      stepIndex: 1,
      timestamp: now + 30 + i,
    })),
    {
      type: "tour_skipped" as const,
      pageId: "quote-review",
      stepId: "step-2",
      timestamp: now + 40,
    },
    // Completions: 8
    ...Array.from({ length: 8 }, (_, i) => ({
      type: "tour_completed" as const,
      pageId: "quote-review",
      timestamp: now + 50 + i,
    })),
    // Page skips: 2
    {
      type: "tour_skipped" as const,
      pageId: "quote-review",
      timestamp: now + 60,
    },
    {
      type: "tour_skipped" as const,
      pageId: "quote-review",
      timestamp: now + 61,
    },
    // Global skip all: 1
    {
      type: "tour_skip_all" as const,
      pageId: "quote-review",
      timestamp: now + 70,
    },
  ];

  const dataset = calculateTourFunnel(sampleEvents);

  assert.equal(dataset.totals.started, 10);
  assert.equal(dataset.totals.completed, 8);
  assert.equal(dataset.totals.skipAll, 1);

  const reviewPage = dataset.pages.find((p) => p.pageId === "quote-review");
  assert.ok(reviewPage, "quote-review page summary must exist");
  assert.equal(reviewPage.starts, 10);
  assert.equal(reviewPage.completions, 8);
  assert.equal(reviewPage.completionRate, 80.0);
  assert.equal(reviewPage.steps.length, 2);

  // Step 1: 10 views -> 8 transitioned to Step 2 -> Drop-off = 2 (20.0%)
  const step1 = reviewPage.steps[0];
  assert.equal(step1.stepId, "step-1");
  assert.equal(step1.viewed, 10);
  assert.equal(step1.skipped, 1);
  assert.equal(step1.skipRate, 10.0);
  assert.equal(step1.dropOff, 2);
  assert.equal(step1.dropOffRate, 20.0);

  // Step 2: 8 views -> 8 completed -> Drop-off = 0 (0.0%)
  const step2 = reviewPage.steps[1];
  assert.equal(step2.stepId, "step-2");
  assert.equal(step2.viewed, 8);
  assert.equal(step2.dropOff, 0);
  assert.equal(step2.dropOffRate, 0.0);
});

test("tour translation dictionaries load correctly for English and Hindi", async () => {
  const enDict = await loadTourDictionary("en");
  assert.ok(Object.keys(enDict).length > 30, "English tour dictionary must contain entries");
  assert.ok(enDict["tour.adminDeal.priceBreakup.title"], "Admin deal title key must exist in English");

  const hiDict = await loadTourDictionary("hi");
  assert.ok(Object.keys(hiDict).length > 30, "Hindi tour dictionary must contain entries");
  assert.ok(hiDict["tour.adminDeal.priceBreakup.title"], "Admin deal title key must exist in Hindi");

  // Verify layman phrasing in Hindi (तार वाला)
  const wzTypeDesc = hiDict["tour_wz_type_desc"];
  assert.ok(wzTypeDesc.includes("तार वाला"), "Wizard type desc must use colloquial layman phrasing 'तार वाला'");

  // Verify getTourTranslation resolver
  const resolvedEn = getTourTranslation("en", "tour.common.tryIt");
  assert.equal(resolvedEn, "Try It");

  const resolvedHi = getTourTranslation("hi", "tour.common.tryIt");
  assert.equal(resolvedHi, "इसे आज़माएं");
});
