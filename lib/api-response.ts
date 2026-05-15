/**
 * @file lib/api-response.ts
 * @description Standardized API response utility for Enterprise-grade consistency.
 */

import { NextResponse } from "next/server";

export type ApiErrorCode = 
  | "UNAUTHORIZED" 
  | "FORBIDDEN" 
  | "NOT_FOUND" 
  | "VALIDATION_ERROR" 
  | "INTERNAL_ERROR" 
  | "RATE_LIMIT_EXCEEDED";

export class ApiResponse {
  static success(data: any, status = 200) {
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data
    }, { status });
  }

  static error(message: string, code: ApiErrorCode = "INTERNAL_ERROR", status = 500, details?: any) {
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        code,
        message,
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
