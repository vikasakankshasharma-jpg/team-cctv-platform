import type { PageTourConfig } from "../tour.types";

export const customerDashboardTour: PageTourConfig = {
  pageId: "customer-dashboard",
  autoStart: true,
  steps: [
    {
      id: "cust-amc-contracts",
      target: '[data-tour="cust-amc-contracts"]',
      title: {
        key: "tour_cust_amc_title",
        fallback: "1. Annual Maintenance (AMC) & Health",
      },
      description: {
        key: "tour_cust_amc_desc",
        fallback:
          "View your active AMC coverage, scheduled technician preventive maintenance (PM) visits, and renewal dates to keep your CCTV running 24x7 without downtime.",
      },
      actionPrompt: {
        key: "tour_cust_amc_action",
        fallback: "Manage or renew your AMC contracts.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: Invoices & Bills",
      },
      optional: true,
    },
    {
      id: "cust-invoices",
      target: '[data-tour="cust-invoices"]',
      title: {
        key: "tour_cust_inv_title",
        fallback: "2. Official GST Invoices & Warranty",
      },
      description: {
        key: "tour_cust_inv_desc",
        fallback:
          "Download formal tax invoices with statutory GSTIN breakdown, serial numbers, and 1 to 3-year manufacturer warranty certificates anytime.",
      },
      actionPrompt: {
        key: "tour_cust_inv_action",
        fallback: "Access your billing and warranty records.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: Service & Support",
      },
      optional: true,
    },
    {
      id: "cust-support-tickets",
      target: '[data-tour="cust-support-tickets"]',
      title: {
        key: "tour_cust_ticket_title",
        fallback: "3. Quick Service & Support Tickets",
      },
      description: {
        key: "tour_cust_ticket_desc",
        fallback:
          "Experiencing offline cameras, blurry night vision, or need mobile app reconfiguration? Raise a priority support ticket for technician dispatch within 4 hours.",
      },
      actionPrompt: {
        key: "tour_cust_ticket_action",
        fallback: "Tap to raise a service request.",
      },
      nextLabel: {
        key: "tour_common_done",
        fallback: "Got It",
      },
      optional: true,
    },
  ],
};
