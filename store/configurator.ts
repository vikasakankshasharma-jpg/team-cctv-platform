/**
 * @file store/configurator.ts
 * @description Zustand store for the live price configurator and pricing data cache.
 */

import { create } from "zustand";
import type {
  Technology,
  PlanType,
  Product,
  Addon,
  AddonRule,
  AppSettings,
  PricingResult,
  ConfiguratorSelection,
} from "@/types";

// ─────────────────────────────────────────────
// Full Store Shape
// ─────────────────────────────────────────────

interface ConfiguratorStore {
  // ── Pricing Data Cache (fetched once from Firestore) ──────────────────────
  products: Product[];
  addons: Addon[];
  addon_rules: AddonRule[];
  settings: AppSettings | null;
  is_pricing_loaded: boolean;

  // ── Current Configurator Selections ────────────────────────────────────────
  selection: ConfiguratorSelection;

  // ── Live Pricing Results (recalculated client-side) ────────────────────────
  pricing_results: {
    budget: PricingResult | null;
    recommended: PricingResult | null;
    premium: PricingResult | null;
  };

  // ── Referral State ─────────────────────────────────────────────────────────
  referral_discount: number;
  promoter_id: string | null;

  // ── Compare State (New 3-Tier SaaS Layout) ──────────────────────────────
  compare_options: Array<{ technology: "HD" | "IP"; option: number | string }>;
  active_checkout_option: { technology: "HD" | "IP"; option: number | string } | null;

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Load all pricing config from Firestore into the cache */
  setPricingCache: (data: {
    products: Product[];
    addons: Addon[];
    addon_rules: AddonRule[];
    settings: AppSettings;
  }) => void;

  /** Update a single configurator field */
  updateSelection: (patch: Partial<ConfiguratorSelection>) => void;

  /** Toggle an add-on by ID in selected_addons */
  toggleAddon: (addonId: string) => void;

  /** Store pricing calculation results */
  setPricingResults: (results: ConfiguratorStore["pricing_results"]) => void;

  /** Update compare options from table */
  setCompareOptions: (options: Array<{ technology: "HD" | "IP"; option: number | string }>) => void;

  /** Set the active checkout option (when clicking a card) */
  setActiveCheckoutOption: (option: { technology: "HD" | "IP"; option: number | string }) => void;

  /** Apply a referral discount from a validated promoter */
  applyReferral: (discount: number, promoterId: string) => void;

  /** Clear referral discount */
  clearReferral: () => void;

  /** Reset configurator to defaults (e.g., after quote is saved) */
  resetConfigurator: () => void;

  /** Reset only filters */
  resetFilters: () => void;
}

// ─────────────────────────────────────────────
// Default Selections
// ─────────────────────────────────────────────

const defaultSelection: ConfiguratorSelection = {
  technology: "IP",
  plan_type: "recommended",
  camera_count: 4,
  picture_quality: "good",
  recording_days: 7,          // 7 days → correct HDD selection (matches quotation sheets)
  selected_addons: [],
  selected_camera_option: 4,  // IP Option 4 = CP Plus 2MP Color in Night (recommended)
  brand_preference: "all",
  max_budget: null,
  focus_point: "price",
};

// ─────────────────────────────────────────────
// Store Definition
// NOT persisted — pricing cache should be refetched on each session
// ─────────────────────────────────────────────

export const useConfiguratorStore = create<ConfiguratorStore>()((set, get) => ({
  // Initial State
  products: [],
  addons: [],
  addon_rules: [],
  settings: null,
  is_pricing_loaded: false,
  selection: { ...defaultSelection },
  pricing_results: { budget: null, recommended: null, premium: null },
  referral_discount: 0,
  promoter_id: null,
  compare_options: [],
  active_checkout_option: null,

  // ── Actions ────────────────────────────────────────────────────────────────

  setPricingCache: (data) =>
    set({
      products: data.products,
      addons: data.addons,
      addon_rules: data.addon_rules,
      settings: data.settings,
      is_pricing_loaded: true,
    }),

  updateSelection: (patch) =>
    set((state) => ({
      selection: { ...state.selection, ...patch },
    })),

  toggleAddon: (addonId) =>
    set((state) => {
      const current = state.selection.selected_addons;
      const updated = current.includes(addonId)
        ? current.filter((id) => id !== addonId)
        : [...current, addonId];
      return { selection: { ...state.selection, selected_addons: updated } };
    }),

  setPricingResults: (results) => set({ pricing_results: results }),

  setCompareOptions: (options) => set({ compare_options: options }),

  setActiveCheckoutOption: (option) => set({ 
    active_checkout_option: option,
    // Also sync the legacy selection state so the pricing loop picks it up
    selection: { 
      ...get().selection, 
      technology: option.technology, 
      selected_camera_option: typeof option.option === "number" ? option.option : undefined,
      selected_camera_id: typeof option.option === "string" ? option.option : undefined
    }
  }),

  applyReferral: (discount, promoterId) =>
    set({ referral_discount: discount, promoter_id: promoterId }),

  clearReferral: () => set({ referral_discount: 0, promoter_id: null }),

  resetConfigurator: () =>
    set({
      selection: { ...defaultSelection },
      pricing_results: { budget: null, recommended: null, premium: null },
      referral_discount: 0,
      promoter_id: null,
      compare_options: [],
      active_checkout_option: null,
    }),

  resetFilters: () =>
    set((state) => ({
      selection: {
        ...state.selection,
        brand_preference: "all",
        resolution_preference: "all",
        max_budget: null,
        requested_features: [],
        focus_point: "price",
        technology: "IP", // Reset to recommended default
      },
    })),
}));
