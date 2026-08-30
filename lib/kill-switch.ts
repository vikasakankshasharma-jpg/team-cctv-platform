import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/constants";

interface KillSwitchState {
  system_mode: "LIVE" | "MAINTENANCE";
  payments_enabled: boolean;
}

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
      payments_enabled: isLive && isPaymentsOn,
    };
  } catch (err) {
    console.error("[KillSwitch] Failed to read settings from Firestore (Outage/Error). FAILING CLOSED to MAINTENANCE & payments disabled:", err);
    return { system_mode: "MAINTENANCE", payments_enabled: false };
  }
}

export async function isMaintenanceMode(): Promise<boolean> {
  const state = await getKillSwitchState();
  return state.system_mode === "MAINTENANCE";
}

export async function isPaymentsDisabled(): Promise<boolean> {
  const state = await getKillSwitchState();
  return !state.payments_enabled;
}
