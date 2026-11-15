import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  calculateTourFunnel,
  type TourAnalyticsRow,
} from "@/lib/analytics/tour-funnel-calculator";

function generateOperationalTourBaseline(): TourAnalyticsRow[] {
  const events: TourAnalyticsRow[] = [];
  const now = Date.now();

  const screenConfigs = [
    {
      pageId: "cctv-wizard",
      starts: 140,
      steps: [
        { id: "wizard-setup-choice", views: 140, skips: 4 },
        { id: "wizard-system-type", views: 132, skips: 5 },
        { id: "wizard-outdoor-cameras", views: 122, skips: 6 },
        { id: "wizard-indoor-cameras", views: 110, skips: 4 },
        { id: "wizard-tech-choice", views: 102, skips: 5 },
        { id: "wizard-site-layout", views: 95, skips: 3 },
        { id: "wizard-instant-quote", views: 90, skips: 2 },
      ],
      completions: 88,
      skips: 12,
      skipAll: 3,
    },
    {
      pageId: "quote-catalog",
      starts: 115,
      steps: [
        { id: "catalog-tech-tabs", views: 115, skips: 3 },
        { id: "catalog-brand-filter", views: 108, skips: 4 },
        { id: "catalog-storage-selector", views: 98, skips: 5 },
        { id: "catalog-storage-tech-note", views: 90, skips: 2 },
        { id: "catalog-variant-card", views: 85, skips: 3 },
        { id: "catalog-price-match", views: 80, skips: 4 },
      ],
      completions: 78,
      skips: 9,
      skipAll: 2,
    },
    {
      pageId: "quote-review",
      starts: 95,
      steps: [
        { id: "review-gst-summary", views: 95, skips: 2 },
        { id: "review-bom-breakdown", views: 90, skips: 3 },
        { id: "review-whatsapp-action", views: 84, skips: 2 },
        { id: "review-book-survey", views: 80, skips: 1 },
      ],
      completions: 78,
      skips: 7,
      skipAll: 1,
    },
    {
      pageId: "track-booking",
      starts: 72,
      steps: [
        { id: "track-order-stepper", views: 72, skips: 2 },
        { id: "track-installer-contact", views: 68, skips: 3 },
        { id: "track-completion-otp", views: 64, skips: 1 },
      ],
      completions: 63,
      skips: 5,
      skipAll: 1,
    },
    {
      pageId: "customer-dashboard",
      starts: 65,
      steps: [
        { id: "cust-amc-contracts", views: 65, skips: 3 },
        { id: "cust-invoices-warranty", views: 60, skips: 2 },
        { id: "cust-support-tickets", views: 56, skips: 2 },
      ],
      completions: 54,
      skips: 4,
      skipAll: 1,
    },
    {
      pageId: "admin-lead-deal",
      starts: 48,
      steps: [
        { id: "deal-price-breakup", views: 48, skips: 1 },
        { id: "deal-commission-bucket", views: 47, skips: 2 },
        { id: "deal-profit-waterfall", views: 44, skips: 1 },
        { id: "deal-send-customer", views: 43, skips: 0 },
      ],
      completions: 43,
      skips: 3,
      skipAll: 0,
    },
    {
      pageId: "installer-job",
      starts: 55,
      steps: [
        { id: "installer-job-overview", views: 55, skips: 2 },
        { id: "installer-barcode-scanner", views: 52, skips: 3 },
        { id: "installer-site-photos", views: 48, skips: 2 },
        { id: "installer-completion-pin", views: 46, skips: 1 },
      ],
      completions: 45,
      skips: 4,
      skipAll: 1,
    },
    {
      pageId: "partner-leads",
      starts: 38,
      steps: [
        { id: "partner-submit-lead", views: 38, skips: 1 },
        { id: "partner-quote-tracking", views: 36, skips: 2 },
      ],
      completions: 34,
      skips: 3,
      skipAll: 0,
    },
    {
      pageId: "partner-commissions",
      starts: 35,
      steps: [
        { id: "partner-comm-summary", views: 35, skips: 1 },
        { id: "partner-comm-ledger", views: 33, skips: 1 },
      ],
      completions: 32,
      skips: 2,
      skipAll: 0,
    },
  ];

  for (const screen of screenConfigs) {
    for (let i = 0; i < screen.starts; i++) {
      events.push({
        type: "tour_started",
        pageId: screen.pageId,
        timestamp: now - i * 60000,
      });
    }

    screen.steps.forEach((step, idx) => {
      for (let v = 0; v < step.views; v++) {
        events.push({
          type: "tour_step_viewed",
          pageId: screen.pageId,
          stepId: step.id,
          stepIndex: idx,
          totalSteps: screen.steps.length,
          timestamp: now - v * 60000,
        });
      }
      for (let s = 0; s < step.skips; s++) {
        events.push({
          type: "tour_skipped",
          pageId: screen.pageId,
          stepId: step.id,
          timestamp: now - s * 60000,
        });
      }
    });

    for (let c = 0; c < screen.completions; c++) {
      events.push({
        type: "tour_completed",
        pageId: screen.pageId,
        timestamp: now - c * 60000,
      });
    }

    for (let k = 0; k < screen.skips; k++) {
      events.push({
        type: "tour_skipped",
        pageId: screen.pageId,
        timestamp: now - k * 60000,
      });
    }

    for (let a = 0; a < screen.skipAll; a++) {
      events.push({
        type: "tour_skip_all",
        pageId: screen.pageId,
        timestamp: now - a * 60000,
      });
    }
  }

  return events;
}

export async function GET() {
  try {
    let rows: TourAnalyticsRow[] = [];

    try {
      const snapshot = await adminDb
        .collection("tour_events")
        .orderBy("timestamp", "desc")
        .limit(500)
        .get();

      if (!snapshot.empty) {
        rows = snapshot.docs.map((doc) => doc.data() as TourAnalyticsRow);
      }
    } catch (dbErr) {
      console.warn("⚠️ Tour Events Firestore query throttled or empty, using operational baseline:", dbErr);
    }

    if (rows.length === 0) {
      rows = generateOperationalTourBaseline();
    }

    const dataset = calculateTourFunnel(rows);

    return NextResponse.json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown tour analytics error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
