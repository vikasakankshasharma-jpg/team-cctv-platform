/**
 * @file lib/support/ticket-service.ts
 * @description Phase 8 Customer Support & SLA Tracking Service.
 * Provides deterministic incident categorization, ownership assignment,
 * SLA breach detection, and resolution tracking for Jaipur pilot operations.
 */

export type SupportCategory =
  | "PAYMENT"
  | "QUOTATION"
  | "INSTALLATION"
  | "DELIVERY"
  | "HARDWARE"
  | "WARRANTY"
  | "AMC"
  | "REFUND"
  | "OTHER";

export type SupportPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type SupportStatus = "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface SupportTicket {
  id: string;
  customerName: string;
  customerMobile: string;
  quoteId?: string;
  orderId?: string;
  jobId?: string;
  category: SupportCategory;
  priority: SupportPriority;
  subject: string;
  description: string;
  owner: string; // e.g. "founder", "tech_lead", "support_rep"
  status: SupportStatus;
  createdAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  targetFirstResponseMinutes: number;
  targetResolutionHours: number;
  isFirstResponseSlaMet?: boolean;
  isResolutionSlaMet?: boolean;
  resolutionNotes?: string;
}

export const SLA_TARGETS: Record<SupportCategory, { responseMinutes: number; resolutionHours: number }> = {
  PAYMENT: { responseMinutes: 15, resolutionHours: 2 },
  QUOTATION: { responseMinutes: 30, resolutionHours: 4 },
  INSTALLATION: { responseMinutes: 30, resolutionHours: 2 },
  DELIVERY: { responseMinutes: 30, resolutionHours: 4 },
  HARDWARE: { responseMinutes: 120, resolutionHours: 24 },
  WARRANTY: { responseMinutes: 120, resolutionHours: 24 },
  AMC: { responseMinutes: 120, resolutionHours: 24 },
  REFUND: { responseMinutes: 30, resolutionHours: 48 },
  OTHER: { responseMinutes: 60, resolutionHours: 24 },
};

/**
 * Creates a new Support Ticket with SLA targets automatically resolved by category.
 */
export function createSupportTicket(params: {
  id: string;
  customerName: string;
  customerMobile: string;
  quoteId?: string;
  orderId?: string;
  jobId?: string;
  category: SupportCategory;
  priority?: SupportPriority;
  subject: string;
  description: string;
  owner?: string;
  now?: Date;
}): SupportTicket {
  const now = params.now || new Date();
  const sla = SLA_TARGETS[params.category] || SLA_TARGETS.OTHER;

  return {
    id: params.id,
    customerName: params.customerName.trim(),
    customerMobile: params.customerMobile.trim(),
    quoteId: params.quoteId,
    orderId: params.orderId,
    jobId: params.jobId,
    category: params.category,
    priority: params.priority || (params.category === "PAYMENT" ? "CRITICAL" : "MEDIUM"),
    subject: params.subject.trim(),
    description: params.description.trim(),
    owner: params.owner || "founder",
    status: "OPEN",
    createdAt: now.toISOString(),
    targetFirstResponseMinutes: sla.responseMinutes,
    targetResolutionHours: sla.resolutionHours,
  };
}

/**
 * Acknowledges a support ticket and marks First Response SLA.
 */
export function acknowledgeTicket(ticket: SupportTicket, responder: string, now?: Date): SupportTicket {
  if (ticket.status !== "OPEN") {
    return ticket; // Idempotent
  }
  const timestamp = now || new Date();
  const createdTime = new Date(ticket.createdAt).getTime();
  const responseTimeMs = timestamp.getTime() - createdTime;
  const targetMs = ticket.targetFirstResponseMinutes * 60 * 1000;

  return {
    ...ticket,
    owner: responder || ticket.owner,
    status: "ACKNOWLEDGED",
    firstResponseAt: timestamp.toISOString(),
    isFirstResponseSlaMet: responseTimeMs <= targetMs,
  };
}

/**
 * Resolves a ticket with notes and verifies Resolution SLA.
 */
export function resolveTicket(ticket: SupportTicket, resolutionNotes: string, now?: Date): SupportTicket {
  if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
    return ticket; // Idempotent
  }
  const timestamp = now || new Date();
  const createdTime = new Date(ticket.createdAt).getTime();
  const resolutionTimeMs = timestamp.getTime() - createdTime;
  const targetMs = ticket.targetResolutionHours * 60 * 60 * 1000;

  return {
    ...ticket,
    status: "RESOLVED",
    resolvedAt: timestamp.toISOString(),
    resolutionNotes: resolutionNotes.trim(),
    isResolutionSlaMet: resolutionTimeMs <= targetMs,
  };
}

/**
 * Computes support KPI scorecard from a list of tickets.
 */
export function computeSupportMetrics(tickets: SupportTicket[]) {
  if (tickets.length === 0) {
    return {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      firstResponseSlaRate: 100,
      resolutionSlaRate: 100,
      unresolvedOver24Hours: 0,
    };
  }

  const openTickets = tickets.filter((t) => t.status === "OPEN" || t.status === "ACKNOWLEDGED" || t.status === "IN_PROGRESS");
  const respondedTickets = tickets.filter((t) => t.firstResponseAt !== undefined);
  const resolvedTickets = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");

  const responseMet = respondedTickets.filter((t) => t.isFirstResponseSlaMet === true).length;
  const resolutionMet = resolvedTickets.filter((t) => t.isResolutionSlaMet === true).length;

  const nowMs = Date.now();
  const unresolvedOver24h = openTickets.filter((t) => {
    const ageMs = nowMs - new Date(t.createdAt).getTime();
    return ageMs > 24 * 60 * 60 * 1000;
  }).length;

  return {
    totalTickets: tickets.length,
    openTickets: openTickets.length,
    resolvedTickets: resolvedTickets.length,
    firstResponseSlaRate: respondedTickets.length > 0 ? (responseMet / respondedTickets.length) * 100 : 100,
    resolutionSlaRate: resolvedTickets.length > 0 ? (resolutionMet / resolvedTickets.length) * 100 : 100,
    unresolvedOver24Hours: unresolvedOver24h,
  };
}
