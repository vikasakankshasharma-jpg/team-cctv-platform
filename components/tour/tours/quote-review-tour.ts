import type { PageTourConfig } from "../tour.types";

export const quoteReviewTour: PageTourConfig = {
  pageId: "quote-review",
  autoStart: true,
  steps: [
    {
      id: "review-gst-summary",
      target: '[data-tour="review-gst-summary"]',
      title: {
        key: "tour_rev_gst_title",
        fallback: "1. 100% GST-Paid Commercial Invariant",
      },
      description: {
        key: "tour_rev_gst_desc",
        fallback:
          "The gross price you see includes 18% GST and installation. Taxable Base + 18% GST reconciles mathematically to ₹0.00 drift—no hidden taxes or added fees at checkout.",
      },
      actionPrompt: {
        key: "tour_rev_gst_action",
        fallback: "Review your transparent tax breakdown.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: Hardware BOM",
      },
    },
    {
      id: "review-bom-breakdown",
      target: '[data-tour="review-bom-breakdown"]',
      title: {
        key: "tour_rev_bom_title",
        fallback: "2. Detailed Bill of Materials (BOM)",
      },
      description: {
        key: "tour_rev_bom_desc",
        fallback:
          "Check every item in your installation: camera models, DVR/NVR recorder, dedicated surveillance hard drive, power supplies, weatherproof junction boxes, and cabling.",
      },
      actionPrompt: {
        key: "tour_rev_bom_action",
        fallback: "Verify your authentic hardware list.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: WhatsApp Delivery",
      },
    },
    {
      id: "review-whatsapp-action",
      target: '[data-tour="review-whatsapp-action"]',
      title: {
        key: "tour_rev_wa_title",
        fallback: "3. Instant WhatsApp PDF Quote",
      },
      description: {
        key: "tour_rev_wa_desc",
        fallback:
          "Tap the WhatsApp button to instantly receive your formal GST quotation and technical specification PDF directly on your smartphone.",
      },
      actionPrompt: {
        key: "tour_rev_wa_action",
        fallback: "Tap to send quotation to your WhatsApp.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: Booking Survey",
      },
    },
    {
      id: "review-book-survey",
      target: '[data-tour="review-book-survey"]',
      title: {
        key: "tour_rev_book_title",
        fallback: "4. Book Site Survey & Installation",
      },
      description: {
        key: "tour_rev_book_desc",
        fallback:
          "Book your physical site survey with our verified CCTV engineer. We verify cable routes, test power points, and confirm camera angles before final mounting.",
      },
      actionPrompt: {
        key: "tour_rev_book_action",
        fallback: "Tap to schedule your site visit.",
      },
      nextLabel: {
        key: "tour_common_done",
        fallback: "Got It",
      },
    },
  ],
};
