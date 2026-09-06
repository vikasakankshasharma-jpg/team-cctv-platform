import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/constants";
import { AppSettings } from "@/types";

export const getCachedAdminSettings = unstable_cache(
  async (): Promise<AppSettings> => {
    const doc = await adminDb.collection("settings").doc(SETTINGS_DOC_ID).get();
    if (doc.exists) {
      return doc.data() as AppSettings;
    }
    return {
      company_name: "TEAM CCTV",
      company_logo_url: "",
      gst_rate: 18,
      labor_fitting_only_rate: 300,
      margin_hdmi_cable: 20,
      margin_rack: 30,
      margin_power_supply: 25,
    } as AppSettings;
  },
  ["admin_settings"],
  { revalidate: 3600, tags: ["settings"] }
);
