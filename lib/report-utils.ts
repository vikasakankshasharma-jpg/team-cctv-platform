import { parseISO, differenceInDays } from "date-fns";

export interface ReportDateRange {
  startDate: string;
  endDate: string;
}

export interface ReportValidationResult {
  success: boolean;
  message?: string;
  isAsyncRequired?: boolean;
}

/**
 * Validates the requested date range for reports.
 * Enforces the "6-month interactive default" rule.
 * 
 * @param range The requested date range strings (ISO 8601)
 * @param maxDaysInteractive Maximum days allowed for synchronous response (default: 180)
 */
export function validateReportDateRange(
  range: ReportDateRange, 
  maxDaysInteractive: number = 180
): ReportValidationResult {
  
  if (!range.startDate || !range.endDate) {
    return { success: false, message: "startDate and endDate are required." };
  }

  const start = parseISO(range.startDate);
  const end = parseISO(range.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { success: false, message: "Invalid date format. Use ISO 8601." };
  }

  if (start > end) {
    return { success: false, message: "startDate cannot be after endDate." };
  }

  const daysDiff = differenceInDays(end, start);

  if (daysDiff > maxDaysInteractive) {
    return { 
      success: true, 
      isAsyncRequired: true, 
      message: `Requested range (${daysDiff} days) exceeds the interactive limit of ${maxDaysInteractive} days. This report must be processed asynchronously.`
    };
  }

  return { success: true, isAsyncRequired: false };
}
