// components/tour/tours/admin-deal-tour.ts

import type { PageTourConfig } from "../tour.types";

export const adminDealTour: PageTourConfig = {
  pageId: "admin-lead-deal",
  autoStart: true,

  steps: [
    {
      id: "deal-price-breakup",
      target: '[data-tour="deal-price-breakup"]',

      title: {
        key: "tour.adminDeal.priceBreakup.title",
        fallback: "Selling Price & GST Breakup",
      },

      description: {
        key: "tour.adminDeal.priceBreakup.description",
        fallback:
          "Yahan customer se liya gaya total selling price clearly dikh raha hai. Is total mein taxable base aur 18% GST ka breakup alag se samajh sakte hain. GST ko dobara add nahi kiya jata.",
      },

      actionPrompt: {
        key: "tour.adminDeal.priceBreakup.action",
        fallback:
          "Gross selling price aur GST breakup ko verify karein before closing the deal.",
      },

      nextLabel: {
        key: "tour.common.tryIt",
        fallback: "Try It",
      },
    },

    {
      id: "deal-commission-bucket",
      target: '[data-tour="deal-commission-bucket"]',

      title: {
        key: "tour.adminDeal.commission.title",
        fallback: "Services & Referral Commissions",
      },

      description: {
        key: "tour.adminDeal.commission.description",
        fallback:
          "Is section mein deal se related service charges, referral commission aur applicable partner payouts alag buckets mein dikhte hain. Isse har earning aur payout ko trace karna easy hota hai.",
      },

      actionPrompt: {
        key: "tour.adminDeal.commission.action",
        fallback:
          "Har commission bucket ko check karein aur dekhein ki payout kis reason se create hua hai.",
      },

      nextLabel: {
        key: "tour.common.tryIt",
        fallback: "Try It",
      },
    },

    {
      id: "deal-profit-waterfall",
      target: '[data-tour="deal-profit-waterfall"]',

      title: {
        key: "tour.adminDeal.profitWaterfall.title",
        fallback: "Where Does the Profit Go?",
      },

      description: {
        key: "tour.adminDeal.profitWaterfall.description",
        fallback:
          "Yahan selling price se step-by-step samajh sakte hain ki product cost, services, commissions aur reserves ke baad business ke paas actual net pocket profit kitna bachta hai.",
      },

      actionPrompt: {
        key: "tour.adminDeal.profitWaterfall.action",
        fallback:
          "Profit ka detailed breakup dekhne ke liye is section ko tap karke expand karein.",
      },

      nextLabel: {
        key: "tour.common.tryIt",
        fallback: "Try It",
      },
    },

    {
      id: "deal-send-customer",
      target: '[data-tour="deal-send-customer"]',

      title: {
        key: "tour.adminDeal.sendCustomer.title",
        fallback: "Send Revised Quote to Customer",
      },

      description: {
        key: "tour.adminDeal.sendCustomer.description",
        fallback:
          "Discount verify karne aur target margins check karne ke baad yahan se revised quote customer ko instant approval ke liye share karein.",
      },

      actionPrompt: {
        key: "tour.adminDeal.sendCustomer.action",
        fallback:
          "Discount final hone par customer approval link generate ya send karein.",
      },

      nextLabel: {
        key: "tour.common.done",
        fallback: "Done",
      },
    },
  ],
};
