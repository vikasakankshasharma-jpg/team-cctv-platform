// components/tour/tours/partner-leads-tour.ts

import type { PageTourConfig } from "../tour.types";

export const partnerLeadsTour: PageTourConfig = {
  pageId: "partner-leads",
  autoStart: true,

  steps: [
    {
      id: "partner-lead-submit",
      target: '[data-tour="partner-lead-submit"]',

      title: {
        key: "tour.partnerLeads.submit.title",
        fallback: "Register a New Customer",
      },

      description: {
        key: "tour.partnerLeads.submit.description",
        fallback:
          "Yahan se apne reference ke new customer details register karein. Register hote hi automatic quote tracking start ho jati hai.",
      },

      actionPrompt: {
        key: "tour.partnerLeads.submit.action",
        fallback:
          "Customer ka naam, mobile number aur property type enter karein.",
      },

      nextLabel: {
        key: "tour.common.tryIt",
        fallback: "Try It",
      },
    },

    {
      id: "partner-lead-list",
      target: '[data-tour="partner-lead-list"]',

      title: {
        key: "tour.partnerLeads.list.title",
        fallback: "Track Live Quotations & Status",
      },

      description: {
        key: "tour.partnerLeads.list.description",
        fallback:
          "Apne register kiye gaye sabhi customers ka live quote status, payable amount aur installation progress yahan real-time dekh sakte hain.",
      },

      actionPrompt: {
        key: "tour.partnerLeads.list.action",
        fallback:
          "Customer status (Quoted, Site Visit, Won) check karein.",
      },

      nextLabel: {
        key: "tour.common.done",
        fallback: "Done",
      },
    },
  ],
};
