/**
 * @file lib/pilot/pilot-controller.ts
 * @description Phase 7.4 Pilot Traffic Controller & Operational Circuit Breaker.
 * Enforces active job concurrency limits (max 10 active jobs) and separates real vs. synthetic traffic.
 */

import { type JobOperationalStatus } from "../operations/operational-contract";

export type PilotTrafficMode = "REAL_CUSTOMER" | "SYNTHETIC_PILOT";

export const MAX_ACTIVE_PILOT_JOBS = 10;

/**
 * Governed list of statuses considered actively consuming field operational capacity.
 * Completed and Cancelled jobs are excluded.
 */
export const ACTIVE_OPERATIONAL_STATUSES: readonly JobOperationalStatus[] = Object.freeze([
  "PENDING_DISPATCH",
  "BACKORDERED",
  "ASSIGNED",
  "DISPATCHED",
  "DELIVERED",
  "IN_PROGRESS",
  "MATERIAL_SHORTAGE",
  "PARTIALLY_COMPLETED",
]);

export interface PilotCapacityStatus {
  activeJobCount: number;
  maxCapacity: number;
  canAcceptNewJob: boolean;
  reason?: string;
}

/**
 * Checks whether the field operations team has capacity to take on an additional installation job.
 */
export function checkPilotOperationalCapacity(
  currentActiveJobCount: number
): PilotCapacityStatus {
  const isCapped = currentActiveJobCount >= MAX_ACTIVE_PILOT_JOBS;

  return {
    activeJobCount: currentActiveJobCount,
    maxCapacity: MAX_ACTIVE_PILOT_JOBS,
    canAcceptNewJob: !isCapped,
    reason: isCapped
      ? `Active operational job cap (${MAX_ACTIVE_PILOT_JOBS}) reached. Reschedule or await job completion.`
      : undefined,
  };
}

/**
 * Helper to count active operational jobs from a list of job statuses.
 */
export function countActiveOperationalJobs(
  jobs: Array<{ status: JobOperationalStatus }>
): number {
  return jobs.filter((j) => ACTIVE_OPERATIONAL_STATUSES.includes(j.status)).length;
}
