/**
 * @file lib/kill-switch.ts
 * @description Launch Kill Switch — reads system_mode and payments_enabled
 * from Firestore settings. Provides lightweight guard functions for API routes.
 *
 * SAFETY PRINCIPLE: FAIL-CLOSED
 *   If Firestore is unreachable, the settings document is missing, or
 *   any error occurs reading configuration, the system MUST FAIL CLOSED:
 *     system_mode: "MAINTENANCE"
 *     payments_enabled: false
 *   No transaction or new customer intake is permitted during configuration uncertainty.
 *
 * Firestore doc: settings/app_config
 *   system_mode: "LIVE" | "MAINTENANCE"
 *   payments_enabled: boolean
 */

import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/constants";

interface KillSwitchState {
  system_mode: "LIVE" | "MAINTENANCE";
  payments_enabled: boolean;
}

/**
 * Reads the two kill-switch flags from Firestore.
 * FAILS CLOSED (MAINTENANCE + payments_enabled: false) on any error, timeout,
 * or missing document, ensuring zero unintended payments during infrastructure outages.
 */
export async function getKillSwitchState(): Promise<KillSwitchState> {
  try {
    const doc = await adminDb
      .collection("settings")
      .doc(SETTINGS_DOC_ID)
      .get();

    if (!doc.exists) {
      console.error("[KillSwitch] Settings doc missing! FAILING CLOSED: system_mode=MAINTENANCE, payments_enabled=false");
      return { system_mode: "MAINTENANCE", payments_enabled: false };
    }

    const data = doc.data()!;
    const isLive = data.system_mode === "LIVE";
    const isPaymentsOn = data.payments_enabled === true;

    return {
      system_mode: isLive ? "LIVE" : "MAINTENANCE",
      // Payments strictly require both: explicit payments_enabled === true AND system_mode === "LIVE"
      payments_enabled: isLive && isPaymentsOn,
    };
  } catch (err) {
    console.error("[KillSwitch] Failed to read settings from Firestore (Outage/Error). FAILING CLOSED to MAINTENANCE & payments disabled:", err);
    return { system_mode: "MAINTENANCE", payments_enabled: false };
  }
}

/** Returns true when the system is in maintenance mode */
export async function isMaintenanceMode(): Promise<boolean> {
  const state = await getKillSwitchState();
  return state.system_mode === "MAINTENANCE";
}

/** Returns true when payments are disabled */
export async function isPaymentsDisabled(): Promise<boolean> {
  const state = await getKillSwitchState();
  return !state.payments_enabled;
}
