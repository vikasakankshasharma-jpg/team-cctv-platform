/**
 * @file store/configurator.ts
 * @description Zustand store for the live price configurator and pricing data cache.
 *
 * PERFORMANCE STRATEGY (from spec Section 9):
 *  - All products, addons, addon_rules, and app_settings are fetched ONCE on
 *    the result/configurator page load and stored here.
 *  - ALL price recalculations run client-side using this cached data.
 *  - ZERO Firestore reads happen on slider moves or option changes.
 *  - Only on explicit "Save Quote" / "Download PDF" actions does a Firestore write occur.
 *
 * PHASE 1 NOTE: This is the store shell with types and initial state.
 * The pricing engine integration will be wired in Phase 2 (Core Logic).
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
} from "@/types";

// ─────────────────────────────────────────────
// Configurator Selection State
// ─────────────────────────────────────────────

export interface ConfiguratorSelection {
  technology: Technology;
  plan_type: PlanType;
  camera_count: number;         // 1–16 (slider)
  picture_quality: "good" | "very_clear" | "crystal_clear";
  recording_days: 7 | 15 | 30;
  selected_addons: string[];    // addonId[]
}

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

  /** Apply a referral discount from a validated promoter */
  applyReferral: (discount: number, promoterId: string) => void;

  /** Clear referral discount */
  clearReferral: () => void;

  /** Reset configurator to defaults (e.g., after quote is saved) */
  resetConfigurator: () => void;
}

// ─────────────────────────────────────────────
// Default Selections
// ─────────────────────────────────────────────

const defaultSelection: ConfiguratorSelection = {
  technology: "HD",
  plan_type: "recommended",
  camera_count: 4,
  picture_quality: "very_clear",
  recording_days: 30,
  selected_addons: [],
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

  applyReferral: (discount, promoterId) =>
    set({ referral_discount: discount, promoter_id: promoterId }),

  clearReferral: () => set({ referral_discount: 0, promoter_id: null }),

  resetConfigurator: () =>
    set({
      selection: { ...defaultSelection },
      pricing_results: { budget: null, recommended: null, premium: null },
      referral_discount: 0,
      promoter_id: null,
    }),
}));
