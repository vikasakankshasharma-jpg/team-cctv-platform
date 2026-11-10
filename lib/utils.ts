import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely extracts a user-readable error message from any error response,
 * Error object, or unknown exception.
 * Guarantees that "[object Object]" will NEVER be returned or shown in toasts/alerts.
 */
export function extractErrorMessage(err: unknown, fallback = "An unexpected error occurred. Please try again."): string {
  if (!err) return fallback;

  if (typeof err === "string") {
    const trimmed = err.trim();
    if (!trimmed || trimmed === "[object Object]") return fallback;
    return trimmed;
  }

  if (typeof err === "object") {
    const anyErr = err as Record<string, any>;

    // 1. Nested ApiResponse.error format: { error: { message: "...", code: "..." } }
    if (anyErr.error && typeof anyErr.error === "object") {
      if (typeof anyErr.error.message === "string" && anyErr.error.message.trim() && anyErr.error.message !== "[object Object]") {
        return anyErr.error.message.trim();
      }
      if (typeof anyErr.error.error === "string" && anyErr.error.error.trim() && anyErr.error.error !== "[object Object]") {
        return anyErr.error.error.trim();
      }
    }

    // 2. Direct error property as string: { error: "Something went wrong" }
    if (typeof anyErr.error === "string" && anyErr.error.trim() && anyErr.error !== "[object Object]") {
      return anyErr.error.trim();
    }

    // 3. Direct message property: { message: "..." } or instance of Error
    if (typeof anyErr.message === "string" && anyErr.message.trim() && anyErr.message !== "[object Object]") {
      return anyErr.message.trim();
    }

    // 4. Details property (often used in validation errors): { details: "..." }
    if (typeof anyErr.details === "string" && anyErr.details.trim() && anyErr.details !== "[object Object]") {
      return anyErr.details.trim();
    }

    // 5. Array of validation errors or zod issues: { details: [ { message: "..." } ] }
    if (Array.isArray(anyErr.details) && anyErr.details.length > 0) {
      const firstDetail = anyErr.details[0];
      if (typeof firstDetail === "string" && firstDetail.trim() && firstDetail !== "[object Object]") {
        return firstDetail.trim();
      }
      if (typeof firstDetail?.message === "string" && firstDetail.message.trim() && firstDetail.message !== "[object Object]") {
        return firstDetail.message.trim();
      }
    }

    // 6. Payment gateway error descriptions (e.g. Razorpay, Cashfree)
    if (typeof anyErr.description === "string" && anyErr.description.trim() && anyErr.description !== "[object Object]") {
      return anyErr.description.trim();
    }
  }

  return fallback;
}
