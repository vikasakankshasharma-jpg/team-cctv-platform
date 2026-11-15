import type { PageTourConfig } from "../tour.types";

export const quoteCatalogTour: PageTourConfig = {
  pageId: "quote-catalog",
  autoStart: true,
  steps: [
    {
      id: "catalog-tech-selector",
      target: '[data-tour="catalog-tech-selector"]',
      title: {
        key: "tour_cat_tech_title",
        fallback: "1. Choose CCTV Technology",
      },
      description: {
        key: "tour_cat_tech_desc",
        fallback:
          "Switch between Standard HD (copper wiring for best budget value), Digital IP (Cat6 network cable for 4K digital crispness), Smart Wi-Fi (no video cables), or Hybrid Pro (mixed setup).",
      },
      actionPrompt: {
        key: "tour_cat_tech_action",
        fallback: "Tap any technology tab to see how package hardware and pricing update live.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: Brand Filter",
      },
    },
    {
      id: "catalog-brand-selector",
      target: '[data-tour="catalog-brand-selector"]',
      title: {
        key: "tour_cat_brand_title",
        fallback: "2. Filter By Brand",
      },
      description: {
        key: "tour_cat_brand_desc",
        fallback:
          "Select genuine brands like CP Plus, Hikvision, Dahua, or Trueview. We never mix unbranded hardware—every camera is authentic with official brand warranty.",
      },
      actionPrompt: {
        key: "tour_cat_brand_action",
        fallback: "Use the dropdown to filter by your preferred brand.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: Storage Days",
      },
    },
    {
      id: "catalog-storage-retention",
      target: '[data-tour="catalog-storage-retention"]',
      title: {
        key: "tour_cat_storage_title",
        fallback: "3. Recording Backup Days",
      },
      description: {
        key: "tour_cat_storage_desc",
        fallback:
          "Choose how many days of continuous 24x7 video you need (7, 15, 30, or 60 days). We automatically calculate the correct hard drive capacity with auto-overwrite.",
      },
      actionPrompt: {
        key: "tour_cat_storage_action",
        fallback: "Select your desired retention days.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: Storage Drive",
      },
    },
    {
      id: "catalog-storage-brand",
      target: '[data-tour="catalog-storage-brand"]',
      title: {
        key: "tour_cat_drive_title",
        fallback: "4. Genuine Surveillance Drives",
      },
      description: {
        key: "tour_cat_drive_desc",
        fallback:
          "CCTV requires dedicated surveillance hard drives (WD Purple or Seagate SkyHawk) engineered for continuous 24/7 video write cycles, not ordinary PC drives.",
      },
      actionPrompt: {
        key: "tour_cat_drive_action",
        fallback: "Check your surveillance hard disk specifications.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: Package Cards",
      },
      optional: true,
    },
    {
      id: "catalog-package-card",
      target: '[data-tour="catalog-package-card"]',
      title: {
        key: "tour_cat_card_title",
        fallback: "5. Authentic Package & GST-Paid Price",
      },
      description: {
        key: "tour_cat_card_desc",
        fallback:
          "Every card represents a real hardware package derived from Brand + Resolution + Technology. The price displayed includes 18% GST and installation—zero hidden surprises.",
      },
      actionPrompt: {
        key: "tour_cat_card_action",
        fallback: "Tap 'Select & Proceed' to review the complete Bill of Materials.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: Price Match",
      },
    },
    {
      id: "catalog-match-price",
      target: '[data-tour="catalog-match-price"]',
      title: {
        key: "tour_cat_match_title",
        fallback: "6. Price Match Guarantee",
      },
      description: {
        key: "tour_cat_match_desc",
        fallback:
          "Have an offline or competitor quotation? Tap 'Match Price' on any package to submit it. We guarantee to match or beat genuine authorized dealer pricing.",
      },
      actionPrompt: {
        key: "tour_cat_match_action",
        fallback: "Tap to upload or share any competitor quote.",
      },
      nextLabel: {
        key: "tour_common_done",
        fallback: "Got It",
      },
      optional: true,
    },
  ],
};
