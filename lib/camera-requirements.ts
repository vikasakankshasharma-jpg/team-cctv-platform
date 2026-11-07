import { CCTVRequirement } from "@/types";

export interface CameraRequirementItem {
  type: string;
  count: number;
  features: string[];
  technology?: string;
  resolution?: string;
}

export function buildMixedCameraRequirements(reqState: Partial<CCTVRequirement>): CameraRequirementItem[] {
  const reqs: CameraRequirementItem[] = [];
  const isPureWireless = reqState.technology_preference === "Wireless";
  
  if (!isPureWireless) {
    const outCount = Number(reqState.outdoor_camera_count) || 0;
    const inCount = Number(reqState.indoor_camera_count) || 0;
    if (outCount > 0) {
      reqs.push({
        type: "Outdoor Bullet Camera",
        count: outCount,
        features: ["bullet", "outdoor"],
        technology: reqState.technology_preference || "HD"
      });
    }
    if (inCount > 0) {
      reqs.push({
        type: "Indoor Dome Camera",
        count: inCount,
        features: ["dome", "indoor"],
        technology: reqState.technology_preference || "HD"
      });
    }
  }

  const inPtz = Number(reqState.wifi_indoor_ptz_count) || 0;
  const inFixed = Number(reqState.wifi_indoor_fixed_count) || 0;
  const outBullet = Number(reqState.wifi_outdoor_bullet_count) || 0;
  const outPtz = Number(reqState.wifi_outdoor_ptz_count) || 0;
  const sim4g = Number(reqState.wifi_4g_count) || 0;

  // Fallback if user only had legacy wifi_indoor_count / wifi_outdoor_count
  if (inPtz === 0 && inFixed === 0 && outBullet === 0 && outPtz === 0 && sim4g === 0) {
    const legacyWifi = Number(reqState.wifi_camera_count) || 0;
    const legacyIn = Number(reqState.wifi_indoor_count) || 0;
    const legacyOut = Number(reqState.wifi_outdoor_count) || 0;
    if (reqState.is_4g && legacyWifi > 0) {
      reqs.push({
        type: "4G SIM / Solar Standalone Camera",
        count: legacyWifi,
        features: ["outdoor", "4g", "sim", "ptz"],
        technology: "Wireless"
      });
    } else if (legacyIn > 0 || legacyOut > 0) {
      if (legacyIn > 0) {
        reqs.push({
          type: "Indoor 360° Pan-Tilt Camera (Wi-Fi)",
          count: legacyIn,
          features: ["indoor", "dome", "ptz", "wifi", "2-way"],
          technology: "Wireless"
        });
      }
      if (legacyOut > 0) {
        reqs.push({
          type: "Outdoor Weatherproof Bullet Camera (Wi-Fi)",
          count: legacyOut,
          features: ["outdoor", "bullet", "wifi"],
          technology: "Wireless"
        });
      }
    } else if (legacyWifi > 0) {
      reqs.push({
        type: "Indoor 360° Pan-Tilt Camera (Wi-Fi)",
        count: legacyWifi,
        features: ["indoor", "dome", "ptz", "wifi", "2-way"],
        technology: "Wireless"
      });
    }
  } else {
    if (inPtz > 0) {
      reqs.push({
        type: "Indoor 360° Pan-Tilt Camera (Wi-Fi)",
        count: inPtz,
        features: ["indoor", "dome", "ptz", "wifi", "2-way"],
        technology: "Wireless"
      });
    }
    if (inFixed > 0) {
      reqs.push({
        type: "Indoor Fixed Dome Camera (Wi-Fi)",
        count: inFixed,
        features: ["indoor", "dome", "wifi", "2-way"],
        technology: "Wireless"
      });
    }
    if (outBullet > 0) {
      reqs.push({
        type: "Outdoor Weatherproof Bullet Camera (Wi-Fi)",
        count: outBullet,
        features: ["outdoor", "bullet", "wifi"],
        technology: "Wireless"
      });
    }
    if (outPtz > 0) {
      reqs.push({
        type: "Outdoor 360° Pan-Tilt PTZ Camera (Wi-Fi)",
        count: outPtz,
        features: ["outdoor", "ptz", "wifi"],
        technology: "Wireless"
      });
    }
    if (sim4g > 0) {
      reqs.push({
        type: "4G SIM / Solar Standalone Camera",
        count: sim4g,
        features: ["outdoor", "4g", "sim", "ptz"],
        technology: "Wireless"
      });
    }
  }

  return reqs;
}
