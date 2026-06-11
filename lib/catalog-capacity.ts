/**
 * @file lib/catalog-capacity.ts
 * @description Computes the maximum camera quotation capacity per technology
 * by inspecting the live product catalog (recorder channel counts).
 *
 * Rules:
 *  - HD   → max channels of active DVR / XVR recorders
 *  - IP   → max channels of active NVR recorders
 *  - Wireless → fixed at 16 (no recorder required; limited by network/cloud)
 *
 *  B2B threshold: any requirement > 16 cameras is tagged as a corporate/B2B lead.
 *  Industrial threshold: any requirement > catalog max cannot be auto-quoted.
 */

import type { Product } from "@/types";

export type TechnologyKey = "HD" | "IP" | "Wireless";

export interface CatalogCapacity {
  HD: number;
  IP: number;
  Wireless: number;
}

/** Cameras above this count are treated as B2B / corporate, regardless of technology. */
export const B2B_THRESHOLD = 16;

/**
 * Compute the maximum quotable camera count per technology from the product catalog.
 * This is a pure function — no DB calls; pass the already-loaded products array.
 */
export function getCatalogCapacity(products: Product[]): CatalogCapacity {
  const activeRecorders = products.filter(
    (p) => p.category === "recorder" &&
      p.is_active &&
      p.unit_price > 0 &&
      p.stock_status !== "out_of_stock" &&
      p.stock_status !== "on_order" &&
      p.stock_status !== "discontinued"
  );

  const maxChannelsFor = (tech: string): number => {
    const recs = activeRecorders.filter((p) =>
      Array.isArray(p.technologies)
        ? p.technologies.includes(tech as any)
        : (p as any).technologies === tech
    );
    if (recs.length === 0) return 16; // safe default
    return Math.max(...recs.map((p) => p.channels || p.max_cameras || 0));
  };

  return {
    HD: maxChannelsFor("HD") || 16,
    IP: maxChannelsFor("IP") || 16,
    Wireless: 16, // No recorder required; platform cap
  };
}

/**
 * Returns true if the camera count exceeds the catalog's maximum quotable capacity
 * for the given technology (i.e. no recorder exists that can handle this many cameras).
 * These leads require a custom/industrial quote.
 */
export function isIndustrialQuote(
  cameraCount: number,
  technology: string,
  capacity: CatalogCapacity
): boolean {
  const tech = technology as TechnologyKey;
  const max = capacity[tech] ?? 16;
  return cameraCount > max;
}

/**
 * Returns true if the camera count qualifies as a B2B / corporate lead
 * (above the B2B threshold, but still within quotable range).
 */
export function isB2BLead(cameraCount: number): boolean {
  return cameraCount > B2B_THRESHOLD;
}

/**
 * Get a human-readable capacity summary for UI display.
 * e.g. "Up to 64 IP cameras · Up to 16 HD cameras"
 */
export function getCapacitySummary(capacity: CatalogCapacity): string {
  return `Up to ${capacity.IP} IP cameras · Up to ${capacity.HD} HD cameras`;
}
