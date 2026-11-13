import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";

export interface SiteSurchargeFlags {
  requiresLadderFee?: boolean;
  requiresMarbleSurcharge?: boolean;
  requiresMetalSurcharge?: boolean;
  requiresFurnishedSurcharge?: boolean;
  requiresHeavyDrillingSurcharge?: boolean;
}

export interface OracleSurchargeLine { code: string; amount: number; reason: string; }
export interface OracleSurchargeResult { lines: OracleSurchargeLine[]; total: number; margin_percent: 0; }

const DEFAULTS = {
  ladder: 500,
  marble: 400,
  metal: 200,
  furnished: 300,
  heavy_drilling: 600,
} as const;

function nestedNumber(appSettings: Readonly<Record<string, unknown>>, key: string, alias: string, fallback: number): number {
  const sitePreparation = appSettings.site_preparation;
  if (sitePreparation && typeof sitePreparation === "object") {
    const value = (sitePreparation as Record<string, unknown>)[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  const top = appSettings[alias];
  return typeof top === "number" && Number.isFinite(top) ? top : fallback;
}

export function calculateOracleSurcharges(
  requirement: CanonicalRequirement,
  site_surcharge_flags: SiteSurchargeFlags = {},
  appSettings: Readonly<Record<string, unknown>> = {},
): OracleSurchargeResult {
  void requirement;
  const lines: OracleSurchargeLine[] = [];
  const amount = (key: keyof typeof DEFAULTS, productionKey: string, alias: string): number => nestedNumber(appSettings, productionKey, alias, DEFAULTS[key]);

  if (site_surcharge_flags.requiresLadderFee) lines.push({ code: "LADDER", amount: amount("ladder", "ladderArrangementFee", "ladder_fee"), reason: "Ladder/site-height surcharge." });
  if (site_surcharge_flags.requiresMarbleSurcharge) lines.push({ code: "MARBLE", amount: amount("marble", "marbleLaborSurcharge", "marble_surcharge"), reason: "Marble drilling surcharge." });
  if (site_surcharge_flags.requiresMetalSurcharge) lines.push({ code: "METAL", amount: amount("metal", "metalInstallationSurcharge", "metal_surcharge"), reason: "Metal installation surcharge." });
  if (site_surcharge_flags.requiresFurnishedSurcharge) lines.push({ code: "FURNISHED", amount: amount("furnished", "furnishedSiteSurcharge", "furnished_surcharge"), reason: "Furnished-site surcharge." });
  if (site_surcharge_flags.requiresHeavyDrillingSurcharge) lines.push({ code: "HEAVY_DRILLING", amount: amount("heavy_drilling", "heavyWallDrillingSurcharge", "heavy_drilling_surcharge"), reason: "Heavy wall-drilling surcharge." });

  return { lines, total: lines.reduce((sum, line) => sum + line.amount, 0), margin_percent: 0 };
}
