/**
 * @file lib/api-response.ts
 * @description Standardized API response utility for Enterprise-grade consistency.
 */

import { NextResponse } from "next/server";
import crypto from "crypto";

export type ApiErrorCode = 
  | "UNAUTHORIZED" 
  | "FORBIDDEN" 
  | "NOT_FOUND" 
  | "VALIDATION_ERROR" 
  | "INTERNAL_ERROR" 
  | "RATE_LIMIT_EXCEEDED"
  | "PRICE_TAMPERING_OR_STALE"
  | "SYSTEM_MAINTENANCE"
  | "PAYMENTS_DISABLED";

export class ApiResponse {
  static success(data: any, status = 200, requestId?: string) {
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      requestId: requestId || crypto.randomUUID(),
      data
    }, { status });
  }

  static error(message: string, code: ApiErrorCode = "INTERNAL_ERROR", status = 500, details?: any, requestId?: string) {
    const reqId = requestId || crypto.randomUUID();
    
    // Masking rule for Production
    let safeMessage = message;
    if (process.env.NODE_ENV === "production" && status === 500) {
       console.error(`[CRITICAL ERROR | REQ: ${reqId}] ${message}`, details);
       safeMessage = "Unable to complete the request. An internal error occurred.";
       details = undefined;
    }

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      requestId: reqId,
      error: {
        code,
        message: safeMessage,
        details
      }
    }, { status });
  }

  static unauthorized(message = "Authentication required") {
    return this.error(message, "UNAUTHORIZED", 401);
  }

  static forbidden(message = "Access denied") {
    return this.error(message, "FORBIDDEN", 403);
  }

  static badRequest(message: string, details?: any) {
    return this.error(message, "VALIDATION_ERROR", 400, details);
  }
}
