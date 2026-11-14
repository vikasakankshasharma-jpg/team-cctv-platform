/**
 * @file app/api/release/route.ts
 * @description Phase 6.3 Release Identity & Provenance API Endpoint.
 * Exposes the immutable deployment metadata, git SHA, and certification baseline binding
 * for production audits, observability correlation, and monitoring.
 */

import { NextResponse } from "next/server";
import { getRuntimeReleaseMetadata } from "@/lib/release/release-metadata";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metadata = getRuntimeReleaseMetadata();
    return NextResponse.json(metadata, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to resolve release metadata",
        message: error?.message || "Internal error",
      },
      { status: 500 }
    );
  }
}
