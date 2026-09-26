/**
 * Centralized payment and lead status constants.
 * Replaces all magic strings throughout the codebase.
 */

export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  ADVANCE_PAID: "advance_paid",
  DELIVERY_PAID: "delivery_paid",
  PAID: "paid",
  CAPTURED: "captured",
  REFUNDED: "refunded",
} as const;

export const LEAD_STATUS = {
  NEW: "new",
  CONTACTED: "contacted",
  SITE_VISIT: "site_visit",
  QUOTED: "quoted",
  NEGOTIATION: "negotiation",
  WON: "won",
  LOST: "lost",
} as const;

export const DELIVERY_STATUS = {
  PENDING: "PENDING",
  DISPATCHED: "DISPATCHED",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
} as const;

export const INSTALL_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  BLOCKED: "BLOCKED",
} as const;

export const JOB_STATUS = {
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  BLOCKED: "BLOCKED",
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type LeadStatus = typeof LEAD_STATUS[keyof typeof LEAD_STATUS];
export type DeliveryStatus = typeof DELIVERY_STATUS[keyof typeof DELIVERY_STATUS];
export type InstallStatus = typeof INSTALL_STATUS[keyof typeof INSTALL_STATUS];
export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];
