import type { PageTourConfig } from "../tour.types";

export const cctvWizardTour: PageTourConfig = {
  pageId: "cctv-quotation-wizard",
  autoStart: true,
  steps: [
    {
      id: "setup-choice",
      activeStep: 0,
      target: "[data-tour='setup-choice']",
      title: {
        key: "tour_wz_setup_title",
        fallback: "1. Easy Guided Setup (Recommended)",
      },
      description: {
        key: "tour_wz_setup_desc",
        fallback:
          "Answer 4 simple questions about your property and camera counts. Our AI automatically builds a 100% compatible package with genuine hardware and 18% GST.",
      },
      actionPrompt: {
        key: "tour_wz_setup_action",
        fallback: "Tap Guided Setup to start, or tap Next to see Custom Build.",
      },
      nextLabel: {
        key: "tour_wz_next_custom",
        fallback: "Next: Custom Build",
      },
    },
    {
      id: "setup-custom-choice",
      activeStep: 0,
      target: "[data-tour='setup-custom-choice']",
      title: {
        key: "tour_wz_custom_title",
        fallback: "2. Custom Build (Advanced Pro)",
      },
      description: {
        key: "tour_wz_custom_desc",
        fallback:
          "Already know your exact brands (CP Plus, Hikvision, Dahua) and specifications? Custom Build lets you directly customize every camera, brand, and storage drive in our open catalog.",
      },
      actionPrompt: {
        key: "tour_wz_custom_action",
        fallback: "Tap Custom Build if you prefer picking your own hardware.",
      },
      nextLabel: {
        key: "tour_common_done",
        fallback: "Got It",
      },
    },
    {
      id: "installation-type",
      activeStep: 1,
      target: "[data-tour='installation-type']",
      title: {
        key: "tour_wz_type_title",
        fallback: "Choose Wiring Architecture",
      },
      description: {
        key: "tour_wz_type_desc",
        fallback:
          "Wired (HD/IP) runs heavy-duty cables for 24x7 uninterrupted surveillance with DVR/NVR hard disk storage. Wireless uses Wi-Fi with local SD card backup. 4G SIM works for remote sites.",
      },
      actionPrompt: {
        key: "tour_wz_type_action",
        fallback: "Select Wired Setup for top reliability, or Wireless for zero cabling.",
      },
      nextLabel: {
        key: "tour_common_tryIt",
        fallback: "Next",
      },
    },
    {
      id: "outdoor-cameras",
      activeStep: 2,
      target: "[data-tour='outdoor-cameras']",
      title: {
        key: "tour_wz_out_title",
        fallback: "Outdoor Weatherproof Bullets",
      },
      description: {
        key: "tour_wz_out_desc",
        fallback:
          "Outdoor bullet cameras feature IP67 weatherproof metal/ABS housings to withstand heavy rain, direct sunlight, and dust.",
      },
      actionPrompt: {
        key: "tour_wz_out_action",
        fallback: "Use '+' or '-' to count your boundary walls, gates, and parking areas.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: Indoor Cameras",
      },
    },
    {
      id: "indoor-cameras",
      activeStep: 2,
      target: "[data-tour='indoor-cameras']",
      title: {
        key: "tour_wz_in_title",
        fallback: "Indoor Compact Domes",
      },
      description: {
        key: "tour_wz_in_desc",
        fallback:
          "Indoor dome cameras mount flush on ceilings for sleek aesthetics in living rooms, bedrooms, offices, and billing counters.",
      },
      actionPrompt: {
        key: "tour_wz_in_action",
        fallback: "Adjust the count for your rooms and internal coverage areas.",
      },
      nextLabel: {
        key: "tour_common_done",
        fallback: "Got It",
      },
    },
    {
      id: "wizard-storage-days",
      activeStep: 3,
      target: "[data-tour='wizard-storage-days']",
      title: {
        key: "tour_wz_storage_title",
        fallback: "Surveillance Recording Days",
      },
      description: {
        key: "tour_wz_storage_desc",
        fallback:
          "Choose how many days of continuous recording you need (7, 15, 30, or 60 days). We pair authentic surveillance drives (WD Purple / Seagate SkyHawk) engineered for continuous video write.",
      },
      actionPrompt: {
        key: "tour_wz_storage_action",
        fallback: "Pick your desired recording retention.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next",
      },
      optional: true,
    },
    {
      id: "site-conditions",
      activeStep: 4,
      target: "[data-tour='site-conditions']",
      title: {
        key: "tour_wz_site_title",
        fallback: "Site Layout & Wiring Scope",
      },
      description: {
        key: "tour_wz_site_desc",
        fallback:
          "Specifying your building type and ceiling height ensures we calculate the exact cabling length and mounting accessories with zero hidden costs.",
      },
      actionPrompt: {
        key: "tour_wz_site_action",
        fallback: "Select your property conditions.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next",
      },
      optional: true,
    },
    {
      id: "wizard-remote-viewing",
      activeStep: 5,
      target: "[data-tour='wizard-remote-viewing']",
      title: {
        key: "tour_wz_app_title",
        fallback: "Free Mobile App & Remote Viewing",
      },
      description: {
        key: "tour_wz_app_desc",
        fallback:
          "All packages include lifetime free mobile app setup for Android and iOS with multi-phone access for your family or staff.",
      },
      actionPrompt: {
        key: "tour_wz_app_action",
        fallback: "Review your remote phone viewing options.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next",
      },
      optional: true,
    },
    {
      id: "generate-quote",
      activeStep: 6,
      target: "[data-tour='generate-quote']",
      title: {
        key: "tour_wz_quote_title",
        fallback: "Instant All-Inclusive Quote",
      },
      description: {
        key: "tour_wz_quote_desc",
        fallback:
          "Every quotation is 100% GST-paid (18% inclusive standard) with installation included. You will see authentic Brand & Resolution packages instantly.",
      },
      actionPrompt: {
        key: "tour_wz_quote_action",
        fallback: "Tap to unlock your instant quotation packages.",
      },
      nextLabel: {
        key: "tour_common_viewQuote",
        fallback: "View Quotes",
      },
      optional: true,
    },
  ],
};
