import { create } from "zustand";

export interface CartItem {
  id: string;
  display_name: string;
  category: string;
  unit_price: number;
  qty: number;
  technologies: string[];
  unit_multiplier?: string;
  type?: string;
  brand?: string;
}

interface CartState {
  technology: "HD" | "IP" | null;
  items: CartItem[];
  setTechnology: (tech: "HD" | "IP" | null) => void;
  addItem: (product: any, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCameraCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  technology: null,
  items: [],
  setTechnology: (tech) => {
    // If technology is changed, we should ideally clear items that don't match, 
    // but for now we'll just set it. The UI should warn the user.
    set({ technology: tech });
  },
  addItem: (product, qty = 1) => {
    set((state) => {
      // Auto-set technology if it's the first non-common item
      let newTech = state.technology;
      if (!newTech && product.technologies && !product.technologies.includes("Common")) {
        newTech = product.technologies.includes("IP") ? "IP" : "HD";
      }
      
      const existing = state.items.find((i) => i.id === product.id);
      if (existing) {
        return {
          technology: newTech,
          items: state.items.map((i) => 
            i.id === product.id ? { ...i, qty: i.qty + qty } : i
          )
        };
      }
      return {
        technology: newTech,
        items: [...state.items, {
          id: product.id,
          display_name: product.display_name,
          category: product.category,
          unit_price: product.unit_price,
          qty,
          technologies: product.technologies || [],
          unit_multiplier: product.unit_multiplier,
          type: product.type,
          brand: product.brand
        }]
      };
    });
  },
  removeItem: (id) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.id !== id);
      // If empty, reset tech lock
      if (newItems.length === 0) {
        return { items: newItems, technology: null };
      }
      return { items: newItems };
    });
  },
  updateQty: (id, qty) => {
    set((state) => {
      if (qty <= 0) return { items: state.items.filter(i => i.id !== id) };
      return { items: state.items.map(i => i.id === id ? { ...i, qty } : i) };
    });
  },
  clearCart: () => set({ items: [], technology: null }),
  getTotal: () => {
    const { items, getCameraCount } = get();
    const camCount = getCameraCount();
    return items.reduce((total, item) => {
      let multiplier = item.qty;
      if (item.unit_multiplier === "camera_count") {
        multiplier = camCount;
      }
      return total + (item.unit_price * multiplier);
    }, 0);
  },
  getCameraCount: () => {
    return get().items.reduce((count, item) => {
      if (item.category === "camera" || item.category === "cctv_camera") {
        return count + item.qty;
      }
      return count;
    }, 0);
  }
}));
