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
        fallback: "Welcome to CCTV Planning",
      },
      description: {
        key: "tour_wz_setup_desc",
        fallback:
          "Choose Guided Setup to build an authentic quotation with genuine hardware and instant GST pricing in just a few clicks.",
      },
      actionPrompt: {
        key: "tour_wz_setup_action",
        fallback: "Tap Guided Setup to get started.",
      },
      nextLabel: {
        key: "tour_common_tryIt",
        fallback: "Next",
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
          "Wired (HD/IP) runs heavy-duty cables for 24x7 uninterrupted surveillance with DVR/NVR hard disk storage. Wireless uses Wi-Fi with local SD card backup.",
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
      id: "technology-preference",
      activeStep: 3,
      target: "[data-tour='technology-preference']",
      title: {
        key: "tour_wz_tech_title",
        fallback: "Standard HD vs Digital IP",
      },
      description: {
        key: "tour_wz_tech_desc",
        fallback:
          "Standard HD offers best budget value over copper cable. Digital IP provides future-proof 4K digital clarity with PoE network wiring.",
      },
      actionPrompt: {
        key: "tour_wz_tech_action",
        fallback: "Pick your preferred technology to see live quotation options.",
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
          "Specifying your building type and floor layout ensures we calculate the exact cabling length and mounting accessories with zero hidden costs.",
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
      id: "generate-quote",
      activeStep: 5,
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
