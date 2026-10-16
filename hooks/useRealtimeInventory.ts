import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Product, Addon } from "@/types";

export function useRealtimeInventory(initialProducts: Product[], initialAddons: Addon[]) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [addons, setAddons] = useState<Addon[]>(initialAddons);

  useEffect(() => {
    // We only care about active products - do not filter where is_deleted == false in Firestore query
    // because Firestore excludes documents where the field is missing/undefined.
    const q = query(
      collection(db, "products"),
      where("is_active", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedProducts = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        if (!Array.isArray(data.technologies)) {
          data.technologies = data.technology ? [data.technology] : ["Common"];
        }
        return {
          id: doc.id,
          ...data
        } as Product;
      });
      
      setProducts(updatedProducts.filter(p => p.is_deleted !== true && p.is_quotation_eligible !== false));
    }, (error) => {
      console.error("Error syncing products:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "addons"),
      where("is_active", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedAddons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Addon[];
      
      setAddons(updatedAddons);
    }, (error) => {
      console.error("Error syncing addons:", error);
    });

    return () => unsubscribe();
  }, []);

  return { products, addons };
}

