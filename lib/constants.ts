/**
 * @file lib/constants.ts
 * @description Shared constants for both client and server sides.
 * This file must NOT import any Firebase SDKs to avoid side effects.
 */

export const COLLECTIONS = {
  USERS: "users",
  LEADS: "leads",
  PRODUCTS: "products",
  ADDONS: "addons",
  ADDON_RULES: "addon_rules",
  WIZARD_STEPS: "wizard_steps",
  PROMOTERS: "promoters",
  COMMISSION_RULES: "commission_rules",
  COMMISSION_RECORDS: "commission_records",
  COMMISSION_PAYOUTS: "commission_payouts",
  OTP_VERIFICATIONS: "otp_verifications",
  PARTNER_OTP_VERIFICATIONS: "partner_otp_verifications",
  SITE_VISIT_BOOKINGS: "site_visit_bookings",
  SETTINGS: "settings",
  RECOMMENDATION_RULES: "recommendation_rules",
} as const;


/** Subcollection name constants */
export const SUBCOLLECTIONS = {
  QUOTES: "quotes",
  QUESTIONS: "questions",
  OPTIONS: "options",
} as const;

/** The single settings document ID */
export const SETTINGS_DOC_ID = "app_config";
