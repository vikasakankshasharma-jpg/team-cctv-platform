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

      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
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
