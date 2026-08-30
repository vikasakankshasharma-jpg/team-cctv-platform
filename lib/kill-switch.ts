import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/constants";

export async function getKillSwitchState(): Promise<any> {
  try {
    const doc = await adminDb.collection("settings").doc(SETTINGS_DOC_ID).get();
    if (!doc.exists) {
      return { system_mode: "MAINTENANCE", payments_enabled: false, debug: "DOC_MISSING" };
    }
    const data = doc.data()!;
    const isLive = data.system_mode === "LIVE";
    const isPaymentsOn = data.payments_enabled === true;
    return {
      system_mode: isLive ? "LIVE" : "MAINTENANCE",
      payments_enabled: isLive && isPaymentsOn,
      debug: "DOC_FOUND_" + data.system_mode
    };
  } catch (err: any) {
    return { system_mode: "MAINTENANCE", payments_enabled: false, debug: "ERROR: " + err.message };
  }
}

export async function isMaintenanceMode(): Promise<boolean | string> {
  const state = await getKillSwitchState();
  if (state.system_mode === "MAINTENANCE") return state.debug;
  return false;
}

export async function isPaymentsDisabled(): Promise<boolean> {
  const state = await getKillSwitchState();
  return !state.payments_enabled;
}
