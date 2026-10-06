import { unstable_cache } from "next/cache";
import { adminDb } from "./firebase-admin";
import type { Product, Addon } from "@/types";

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

      const items = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .filter(p => p.is_deleted !== true && p.is_addon !== true);
      
      return items;
    } catch (error) {
      console.error("Error fetching cached products:", error);
      return [];
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

      const items = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Addon))
        .filter(a => (a as any).is_deleted !== true);

      // Map any Products that are explicitly flagged as addons
      const prodSnap = await adminDb
        .collection("products")
        .where("is_active", "==", true)
        .where("is_addon", "==", true)
        .get();

      prodSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.is_deleted === true) return;
        items.push({
          id: doc.id,
          display_name: data.display_name || data.technical_name || "Addon",
          unit_price: data.unit_price || 0,
          base_cost: data.base_cost || 0,
          is_active: data.is_active,
          // Support for other addon fields if necessary (category, features, etc)
          category: data.category || "accessory",
          features: data.features || [],
          image_url: data.image_url || data.thumbnail_url || null,
        } as unknown as Addon);
      });

      return items;
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
