import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { cctvWizardTour } from "../../../components/tour/tours/cctv-wizard-tour.ts";
import { quoteCatalogTour } from "../../../components/tour/tours/quote-catalog-tour.ts";
import { quoteReviewTour } from "../../../components/tour/tours/quote-review-tour.ts";
import { trackBookingTour } from "../../../components/tour/tours/track-booking-tour.ts";
import { customerDashboardTour } from "../../../components/tour/tours/customer-dashboard-tour.ts";
import { loadTourDictionary } from "../../../lib/i18n/tour-translations.ts";
import type { LocaleCode } from "../../../lib/i18n/mapping.ts";

test("cctvWizardTour covers both Guided Setup and Custom Build on Step 0", () => {
  const step0Steps = cctvWizardTour.steps.filter((s) => s.activeStep === 0);
  assert.equal(step0Steps.length, 2, "Step 0 must have exactly 2 steps (Guided Setup and Custom Build)");

  assert.equal(step0Steps[0].id, "setup-choice");
  assert.equal(step0Steps[0].target, "[data-tour='setup-choice']");

  assert.equal(step0Steps[1].id, "setup-custom-choice");
  assert.equal(step0Steps[1].target, "[data-tour='setup-custom-choice']");
});

test("cctvWizardTour covers all 7 wizard steps without gaps", () => {
  const steps = cctvWizardTour.steps;
  const activeSteps = new Set(steps.map((s) => s.activeStep));

  for (let i = 0; i <= 6; i++) {
    assert.ok(activeSteps.has(i), `Wizard tour must have steps for activeStep: ${i}`);
  }

  // Verify storage days is on activeStep 3
  const storageStep = steps.find((s) => s.id === "wizard-storage-days");
  assert.ok(storageStep, "wizard-storage-days step must exist");
  assert.equal(storageStep?.activeStep, 3);
  assert.equal(storageStep?.target, "[data-tour='wizard-storage-days']");

  // Verify remote viewing is on activeStep 5
  const remoteStep = steps.find((s) => s.id === "wizard-remote-viewing");
  assert.ok(remoteStep, "wizard-remote-viewing step must exist");
  assert.equal(remoteStep?.activeStep, 5);

  // Verify quote unlock is on activeStep 6
  const quoteStep = steps.find((s) => s.id === "generate-quote");
  assert.ok(quoteStep, "generate-quote step must exist");
  assert.equal(quoteStep?.activeStep, 6);
  assert.equal(quoteStep?.target, "[data-tour='generate-quote']");
});

test("quoteCatalogTour covers all 6 key catalog options", () => {
  const targets = quoteCatalogTour.steps.map((s) => s.target);
  assert.ok(targets.includes('[data-tour="catalog-tech-selector"]'), "Tech selector target must exist");
  assert.ok(targets.includes('[data-tour="catalog-brand-selector"]'), "Brand selector target must exist");
  assert.ok(targets.includes('[data-tour="catalog-storage-retention"]'), "Storage retention target must exist");
  assert.ok(targets.includes('[data-tour="catalog-storage-brand"]'), "Storage brand target must exist");
  assert.ok(targets.includes('[data-tour="catalog-package-card"]'), "Package card target must exist");
  assert.ok(targets.includes('[data-tour="catalog-match-price"]'), "Match price target must exist");
});

test("quoteReviewTour covers all 4 quotation review checkpoints", () => {
  const targets = quoteReviewTour.steps.map((s) => s.target);
  assert.ok(targets.includes('[data-tour="review-gst-summary"]'), "18% GST summary target must exist");
  assert.ok(targets.includes('[data-tour="review-bom-breakdown"]'), "BOM breakdown target must exist");
  assert.ok(targets.includes('[data-tour="review-whatsapp-action"]'), "WhatsApp delivery target must exist");
  assert.ok(targets.includes('[data-tour="review-book-survey"]'), "Book survey target must exist");
});

test("trackBookingTour covers milestone tracking, technician contact, and completion OTP", () => {
  const targets = trackBookingTour.steps.map((s) => s.target);
  assert.ok(targets.includes('[data-tour="track-stage-stepper"]'), "Track stage stepper target must exist");
  assert.ok(targets.includes('[data-tour="track-technician-contact"]'), "Technician contact target must exist");
  assert.ok(targets.includes('[data-tour="track-otp-signoff"]'), "Completion OTP target must exist");
});

test("customerDashboardTour covers AMC, invoices, and support tickets", () => {
  const targets = customerDashboardTour.steps.map((s) => s.target);
  assert.ok(targets.includes('[data-tour="cust-amc-contracts"]'), "AMC contracts target must exist");
  assert.ok(targets.includes('[data-tour="cust-invoices"]'), "Invoices target must exist");
  assert.ok(targets.includes('[data-tour="cust-support-tickets"]'), "Support tickets target must exist");
});

test("DOM target anchors exist in TSX component source files", () => {
  const wizardSource = fs.readFileSync(
    path.join(process.cwd(), "components/wizard/WizardClientV2.tsx"),
    "utf8"
  );
  assert.ok(wizardSource.includes('data-tour="setup-choice"'), "setup-choice must exist in WizardClientV2");
  assert.ok(wizardSource.includes('data-tour="setup-custom-choice"'), "setup-custom-choice must exist in WizardClientV2");
  assert.ok(wizardSource.includes('data-tour="installation-type"'), "installation-type must exist in WizardClientV2");
  assert.ok(wizardSource.includes('data-tour="outdoor-cameras"'), "outdoor-cameras must exist in WizardClientV2");
  assert.ok(wizardSource.includes('data-tour="indoor-cameras"'), "indoor-cameras must exist in WizardClientV2");
  assert.ok(wizardSource.includes('data-tour="wizard-storage-days"'), "wizard-storage-days must exist in WizardClientV2");
  assert.ok(wizardSource.includes('data-tour="site-conditions"'), "site-conditions must exist in WizardClientV2");
  assert.ok(wizardSource.includes('data-tour="wizard-remote-viewing"'), "wizard-remote-viewing must exist in WizardClientV2");
  assert.ok(wizardSource.includes('data-tour="generate-quote"'), "generate-quote must exist in WizardClientV2");

  const catalogSource = fs.readFileSync(
    path.join(process.cwd(), "components/quotation/DynamicVariantGenerator.tsx"),
    "utf8"
  );
  assert.ok(catalogSource.includes('data-tour="catalog-tech-selector"'));
  assert.ok(catalogSource.includes('data-tour="catalog-brand-selector"'));
  assert.ok(catalogSource.includes('data-tour="catalog-storage-retention"'));
  assert.ok(catalogSource.includes('data-tour="catalog-storage-brand"'));
  assert.ok(catalogSource.includes('data-tour={idx === 0 ? "catalog-package-card" : undefined}'));
  assert.ok(catalogSource.includes('data-tour={idx === 0 ? "catalog-match-price" : undefined}'));

  const reviewSource = fs.readFileSync(
    path.join(process.cwd(), "components/quotation/InstantQuotationReview.tsx"),
    "utf8"
  );
  assert.ok(reviewSource.includes('data-tour="review-gst-summary"'));
  assert.ok(reviewSource.includes('data-tour="review-bom-breakdown"'));
  assert.ok(reviewSource.includes('data-tour="review-whatsapp-action"'));
  assert.ok(reviewSource.includes('data-tour="review-book-survey"'));

  const trackSource = fs.readFileSync(
    path.join(process.cwd(), "app/(customer)/track/[id]/TrackingClient.tsx"),
    "utf8"
  );
  assert.ok(trackSource.includes('data-tour="track-stage-stepper"'));
  assert.ok(trackSource.includes('data-tour="track-technician-contact"'));
  assert.ok(trackSource.includes('data-tour="track-otp-signoff"'));
});

test("all 11 languages contain complete translations for wizard and customer tours", async () => {
  const languages: LocaleCode[] = ["en", "hi", "mr", "gu", "ta", "te", "kn", "bn", "ml", "pa", "or"];
  const requiredKeys = [
    "tour_wz_setup_title",
    "tour_wz_setup_desc",
    "tour_wz_setup_action",
    "tour_wz_next_custom",
    "tour_wz_custom_title",
    "tour_wz_custom_desc",
    "tour_wz_custom_action",
    "tour_wz_type_title",
    "tour_wz_type_desc",
    "tour_wz_type_action",
    "tour_wz_out_title",
    "tour_wz_out_desc",
    "tour_wz_out_action",
    "tour_wz_in_title",
    "tour_wz_in_desc",
    "tour_wz_in_action",
    "tour_wz_storage_title",
    "tour_wz_storage_desc",
    "tour_wz_storage_action",
    "tour_wz_site_title",
    "tour_wz_site_desc",
    "tour_wz_site_action",
    "tour_wz_app_title",
    "tour_wz_app_desc",
    "tour_wz_app_action",
    "tour_wz_quote_title",
    "tour_wz_quote_desc",
    "tour_wz_quote_action",
    "tour_cat_tech_title",
    "tour_cat_brand_title",
    "tour_cat_card_title",
    "tour_rev_gst_title",
    "tour_rev_bom_title",
    "tour_track_stage_title",
    "tour_cust_amc_title",
  ];

  for (const lang of languages) {
    const dict = await loadTourDictionary(lang);
    for (const key of requiredKeys) {
      assert.ok(
        dict[key] && dict[key].trim().length > 0,
        `Language "${lang}" must have non-empty translation for key "${key}"`
      );
    }
  }
});
