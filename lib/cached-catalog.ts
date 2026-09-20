import { unstable_cache } from "next/cache";
import { adminDb } from "./firebase-admin";
import type { Product, Addon } from "@/types";

export const DEFAULT_500GB_HDD: Product = {
  id: "budget_hdd_500gb",
  display_name: "Budget Brand 500GB HDD",
  technical_name: "Budget Brand 500GB Surveillance HDD",
  brand: "Budget Brand",
  category: "storage",
  storage_type: "Surveillance HDD",
  storage_capacity_tb: 0.5,
  storage_tb: 0.5,
  capacity: "500GB",
  technologies: ["Common", "HD", "IP"],
  technology: "Common",
  unit_price: 2646,
  base_cost: 1800,
  is_active: true,
  is_quotation_eligible: true,
  stock_status: "in_stock"
};

/**
 * Fetches all active and quotation-eligible products from Firestore.
 * Cached for 1 hour using Next.js Data Cache to prevent excessive Firestore reads.
 */
export const getCachedProducts = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      const snap = await adminDb
        .collection("products")
        .where("is_active", "==", true)
        .where("is_quotation_eligible", "==", true)
        .get();

      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      const has500GB = items.some(p => {
        const text = ((p.display_name || "") + " " + (p.technical_name || "") + " " + (p.capacity || "")).toLowerCase();
        return p.category === "storage" && (text.includes("500gb") || p.storage_capacity_tb === 0.5 || p.storage_tb === 0.5);
      });
      if (!has500GB) {
        items.push(DEFAULT_500GB_HDD);
      }
      return items;
    } catch (error) {
      console.error("Error fetching cached products:", error);
      return [DEFAULT_500GB_HDD];
    }
  },
  ["active-products"],
  {
    revalidate: 3600,
    tags: ["catalog", "products"],
  }
);

/**
 * Fetches all active addons from Firestore.
 * Cached for 1 hour.
 */
export const getCachedAddons = unstable_cache(
  async (): Promise<Addon[]> => {
    try {
      const snap = await adminDb
        .collection("addons")
        .where("is_active", "==", true)
        .get();

      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));
    } catch (error) {
      console.error("Error fetching cached addons:", error);
      return [];
    }
  },
  ["active-addons"],
  {
    revalidate: 3600,
    tags: ["catalog", "addons"],
  }
);
