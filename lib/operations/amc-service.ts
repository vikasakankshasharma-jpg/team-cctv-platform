/**
 * @file lib/operations/amc-service.ts
 * @description Phase 7.3 AMC Transition & Preventive Maintenance (PM) Scheduler.
 * Manages complimentary and paid AMC contract entitlements, decoupled from financial transactions.
 */

import {
  type OperationalJobCard,
  type AmcEntitlementRecord,
  type PmVisitSchedule,
} from "./operational-contract";
import { OperationalStateError } from "./job-lifecycle";

/**
 * Gate 7.3.7: Activates AMC contract entitlement and generates PM visit calendar.
 */
export function activateAmcEntitlement(params: {
  job: OperationalJobCard;
  isComplimentary?: boolean;
  planName?: string;
  durationMonths?: number;
  includedPmVisits?: number;
}): AmcEntitlementRecord {
  const {
    job,
    isComplimentary = true,
    planName = isComplimentary
      ? "1st Year Complimentary Care (2 PM Visits)"
      : "Annual Maintenance Contract (4 PM Visits)",
    durationMonths = 12,
    includedPmVisits = isComplimentary ? 2 : 4,
  } = params;

  if (job.status !== "COMPLETED" || !job.completed_at) {
    throw new OperationalStateError(
      "Cannot activate AMC entitlement for uncompleted job",
      "JOB_NOT_COMPLETED"
    );
  }

  const startDate = new Date(job.completed_at);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationMonths);

  // Generate scheduled PM visits evenly across duration
  const scheduledPmVisits: PmVisitSchedule[] = [];
  const intervalMonths = Math.floor(durationMonths / includedPmVisits);

  for (let i = 1; i <= includedPmVisits; i++) {
    const visitDate = new Date(startDate);
    visitDate.setMonth(visitDate.getMonth() + i * intervalMonths);
    scheduledPmVisits.push({
      visitNumber: i,
      scheduledDate: visitDate.toISOString(),
      status: "scheduled",
    });
  }

  const entitlement: AmcEntitlementRecord = {
    id: `amc_${job.quote_id}_${Date.now()}`,
    quoteId: job.quote_id,
    planName,
    isComplimentary,
    durationMonths,
    includedPmVisits,
    scheduledPmVisits,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: "ACTIVE",
  };

  return Object.freeze(entitlement);
}
