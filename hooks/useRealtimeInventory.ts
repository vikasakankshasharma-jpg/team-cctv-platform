import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Product, Addon } from "@/types";

export function useRealtimeInventory(initialProducts: Product[], initialAddons: Addon[]) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [addons, setAddons] = useState<Addon[]>(initialAddons);

  useEffect(() => {
    // We only care about active products
    const q = query(
      collection(db, "products"),
      where("is_active", "==", true),
      where("is_deleted", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(updatedProducts);
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
