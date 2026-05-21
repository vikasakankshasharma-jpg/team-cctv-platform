/**
 * @file lib/system-score.ts
 * @description Calculates a weighted System Score (0-100) for any CCTV camera product.
 * Used in CompareCards and SpecCompareTable to give customers an instant,
 * at-a-glance quality metric — similar to Smartprix's "Spec Score".
 *
 * Scoring Weights:
 *   Resolution:      25%  (biggest differentiator customers understand)
 *   Night Vision:    20%  (critical for security — the core reason to buy CCTV)
 *   Brand Tier:      15%  (CP Plus Premium > CP Plus > Prama > Generic)
 *   Smart Features:  15%  (growing demand for AI detection, audio)
 *   Build Quality:   10%  (outdoor durability — IP rating)
 *   Storage:         10%  (retention period is a key sales conversation)
 *   Warranty:         5%  (tie-breaker)
 */

import type { Product } from "@/types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface SystemScoreBreakdown {
  resolution: number;      // 0-25
  night_vision: number;    // 0-20
  brand: number;           // 0-15
  smart_features: number;  // 0-15
  build_quality: number;   // 0-10
  storage: number;         // 0-10
  warranty: number;        // 0-5
}

export interface SystemScoreResult {
  score: number;                  // 0-100 total
  grade: "A+" | "A" | "B+" | "B" | "C+" | "C";
  breakdown: SystemScoreBreakdown;
  highlights: string[];           // Human-readable strengths (e.g., "Ultra-HD Resolution")
}

// ─────────────────────────────────────────────
// Brand Tier Map
// ─────────────────────────────────────────────

const BRAND_TIERS: Record<string, number> = {
  // Tier 1: Premium brands (15 pts)
  hikvision: 15,
  dahua: 14,
  // Tier 2: Professional brands (12 pts)
  cpplus: 12,
  "cp plus": 12,
  "cp-plus": 12,
  // Tier 3: Value brands (9 pts)
  prama: 9,
  godrej: 9,
  // Tier 4: Budget brands (6 pts)
  realtime: 6,
  cp_plus_economy: 6,
};

// ─────────────────────────────────────────────
// Main Scoring Function
// ─────────────────────────────────────────────

export function calculateSystemScore(
  camera: Product,
  options?: {
    recordingDays?: number;
    storageTB?: number;
  }
): SystemScoreResult {
  const breakdown: SystemScoreBreakdown = {
    resolution: scoreResolution(camera),
    night_vision: scoreNightVision(camera),
    brand: scoreBrand(camera),
    smart_features: scoreSmartFeatures(camera),
    build_quality: scoreBuildQuality(camera),
    storage: scoreStorage(options?.recordingDays, options?.storageTB),
    warranty: scoreWarranty(camera),
  };

  const score = Math.min(100, Math.round(
    breakdown.resolution +
    breakdown.night_vision +
    breakdown.brand +
    breakdown.smart_features +
    breakdown.build_quality +
    breakdown.storage +
    breakdown.warranty
  ));

  const grade = scoreToGrade(score);
  const highlights = buildHighlights(camera, breakdown);

  return { score, grade, breakdown, highlights };
}

// ─────────────────────────────────────────────
// Sub-Scorers (Pure Functions)
// ─────────────────────────────────────────────

function scoreResolution(cam: Product): number {
  const mp = cam.resolution_mp ?? inferResolutionFromName(cam.technical_name);
  if (mp >= 8) return 25;   // 4K / 8MP
  if (mp >= 5) return 21;   // 5MP Ultra-HD
  if (mp >= 4) return 17;   // 4MP Pro-HD
  if (mp >= 2) return 10;   // 2MP Full-HD
  return 5;                  // Sub-HD
}

function scoreNightVision(cam: Product): number {
  const nvType = cam.night_vision_type ?? inferNightVisionFromName(cam.technical_name);
  const rangeBonus = Math.min(4, Math.floor((cam.night_vision_range_m ?? 20) / 15));

  switch (nvType) {
    case "starlight":    return Math.min(20, 17 + rangeBonus);
    case "dual_light":   return Math.min(20, 15 + rangeBonus);
    case "color":        return Math.min(20, 12 + rangeBonus);
    case "ir":           return Math.min(20, 6 + rangeBonus);
    default:             return 5;
  }
}

function scoreBrand(cam: Product): number {
  if (!cam.brand) return 6;
  const key = cam.brand.toLowerCase().trim();
  return BRAND_TIERS[key] ?? 6;
}

function scoreSmartFeatures(cam: Product): number {
  let pts = 0;

  // Audio (3pts)
  if (cam.has_audio === true || cam.features?.some(f => f.includes("mic") || f.includes("audio"))) {
    pts += 3;
  }

  // AI Features (3pts each, max 12)
  const aiCount = cam.ai_features?.length ?? 0;
  pts += Math.min(12, aiCount * 3);

  // Fallback: infer from features array
  if (aiCount === 0 && cam.features) {
    if (cam.features.some(f => f.includes("smart") || f.includes("detect"))) pts += 3;
  }

  return Math.min(15, pts);
}

function scoreBuildQuality(cam: Product): number {
  const ipRating = cam.ip_rating?.toUpperCase() ?? "";

  // IP Rating scoring
  let pts = 3; // Default: indoor
  if (ipRating.includes("IP67") || ipRating.includes("IP68")) pts = 10;
  else if (ipRating.includes("IP66")) pts = 8;
  else if (ipRating.includes("IP65")) pts = 6;

  // Compression bonus
  if (cam.compression === "H.265+" || cam.compression === "H.265") pts = Math.min(10, pts + 1);

  // WDR bonus
  if (cam.wdr) pts = Math.min(10, pts + 1);

  return pts;
}

function scoreStorage(recordingDays?: number, storageTB?: number): number {
  const days = recordingDays ?? 7;
  if (days >= 30) return 10;
  if (days >= 15) return 7;
  if (days >= 7) return 4;
  return 2;
}

function scoreWarranty(cam: Product): number {
  const years = cam.warranty_years ?? 1;
  if (years >= 5) return 5;
  if (years >= 3) return 4;
  if (years >= 2) return 3;
  return 2;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function scoreToGrade(score: number): SystemScoreResult["grade"] {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C+";
  return "C";
}

function buildHighlights(cam: Product, breakdown: SystemScoreBreakdown): string[] {
  const highlights: string[] = [];

  if (breakdown.resolution >= 21) highlights.push("Ultra-HD Resolution");
  else if (breakdown.resolution >= 17) highlights.push("Pro-HD Clarity");

  if (breakdown.night_vision >= 15) highlights.push("Advanced Night Vision");
  else if (breakdown.night_vision >= 12) highlights.push("Color Night Vision");

  if (breakdown.smart_features >= 6) highlights.push("AI-Powered Detection");
  if (breakdown.build_quality >= 8) highlights.push("Weather-Sealed Build");
  if (breakdown.brand >= 12) highlights.push("Professional-Grade Brand");

  return highlights;
}

/** Fallback: infer resolution from technical_name when resolution_mp is not set */
function inferResolutionFromName(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes("8mp") || lower.includes("4k")) return 8;
  if (lower.includes("6mp")) return 6;
  if (lower.includes("5mp")) return 5;
  if (lower.includes("4mp")) return 4;
  if (lower.includes("3mp")) return 3;
  if (lower.includes("2mp") || lower.includes("1080p")) return 2;
  return 2; // Default to 2MP
}

/** Fallback: infer night vision type from technical_name/features */
function inferNightVisionFromName(name: string): Product["night_vision_type"] {
  const lower = name.toLowerCase();
  if (lower.includes("starlight")) return "starlight";
  if (lower.includes("dual") && lower.includes("light")) return "dual_light";
  if (lower.includes("colorvu") || lower.includes("color")) return "color";
  return "ir"; // Default to basic IR
}
