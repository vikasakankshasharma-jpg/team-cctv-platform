/**
 * @file app/api/health/route.ts
 * @description Phase 7.4 Production Health & Observability Endpoint.
 * Exposes governed operational metadata (release identity, kill-switch status, timestamp)
 * while strictly adhering to Zero-Secret and Zero-Internal-Leakage constraints.
 */

import { NextResponse } from "next/server";
import { getRuntimeReleaseMetadata } from "@/lib/release/release-metadata";
import { getKillSwitchState } from "@/lib/kill-switch";
import { assertZeroSecrets } from "@/lib/release/release-identity";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const releaseMeta = getRuntimeReleaseMetadata();
    const killSwitch = await getKillSwitchState();

    const healthPayload = {
      status: killSwitch.system_mode === "LIVE" ? "healthy" : "maintenance",
      environment: process.env.NODE_ENV || "production",
      deploymentVersion: releaseMeta.deploymentVersion,
      certificationVersion: releaseMeta.certificationVersion,
      gitSha: releaseMeta.gitSha,
      systemMode: killSwitch.system_mode,
      paymentsEnabled: killSwitch.payments_enabled,
      timestamp: new Date().toISOString(),
    };

    // Strict Fail-Closed Zero-Secrets Assertion: Guarantees zero sensitive tokens leak
    assertZeroSecrets(healthPayload);

    return NextResponse.json(healthPayload, {
      status: killSwitch.system_mode === "LIVE" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check evaluation failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
