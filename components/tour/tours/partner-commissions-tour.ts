// components/tour/tours/partner-commissions-tour.ts

import type { PageTourConfig } from "../tour.types";

export const partnerCommissionsTour: PageTourConfig = {
  pageId: "partner-commissions",
  autoStart: true,

  steps: [
    {
      id: "partner-commission-summary",
      target: '[data-tour="partner-commission-summary"]',

      title: {
        key: "tour.partnerCommissions.summary.title",
        fallback: "Total Earnings & Payout Status",
      },

      description: {
        key: "tour.partnerCommissions.summary.description",
        fallback:
          "Yahan total earned, pending payout aur paid commission clearly segregated hai. B2C referrals par ₹500 fixed reward aur B2B projects par slab-based earnings yahan calculate hoti hain.",
      },

      actionPrompt: {
        key: "tour.partnerCommissions.summary.action",
        fallback:
          "Pending aur Paid amounts ko verify karein.",
      },

      nextLabel: {
        key: "tour.common.tryIt",
        fallback: "Try It",
      },
    },

    {
      id: "partner-payout-ledger",
      target: '[data-tour="partner-payout-ledger"]',

      title: {
        key: "tour.partnerCommissions.ledger.title",
        fallback: "Commission Ledger & TDS Details",
      },

      description: {
        key: "tour.partnerCommissions.ledger.description",
        fallback:
          "Har deal ke against gross commission amount, applicable 5% TDS deduction aur bank transfer status transparently line-by-line track kiya jata hai.",
      },

      actionPrompt: {
        key: "tour.partnerCommissions.ledger.action",
        fallback:
          "Order reference aur payment settlement date check karein.",
      },

      nextLabel: {
        key: "tour.common.done",
        fallback: "Done",
      },
    },
  ],
};
