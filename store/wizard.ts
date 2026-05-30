/**
 * @file store/wizard.ts
 * @description Zustand store for wizard step state and customer answers.
 *
 * STRATEGY:
 *  - Wizard config (steps + questions + options) is fetched ONCE from Firestore
 *    on initial load and cached here. Subsequent renders use cached data.
 *  - Answers are stored keyed by questionId so they survive step navigation.
 *  - State is persisted to sessionStorage so a page refresh doesn't lose progress.
 *
 * PHASE 1 NOTE: This is the store definition and types.
 * The Firestore fetch action will be wired in Phase 4 (Frontend).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WizardStep, WizardAnswers, Product } from "@/types";

// ─────────────────────────────────────────────
// State Shape
// ─────────────────────────────────────────────

interface WizardStore {
  // Config (fetched from Firestore, cached)
  steps: WizardStep[];
  is_loaded: boolean;

  // Navigation
  current_step_index: number;

  // Customer answers: { [questionId]: optionValue | optionValue[] }
  answers: WizardAnswers;

  // Products Catalog (for live faceted counting)
  products: Product[];

  // Lead Tracking (Cart Abandonment)
  partial_lead_id: string | null;

  // Actions
  setSteps: (steps: WizardStep[]) => void;
  setProducts: (products: Product[]) => void;
  setAnswer: (questionId: string, value: any) => void;
  setPartialLeadId: (id: string | null) => void;
  goToStep: (index: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetWizard: () => void;
}

// ─────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────

const initialState = {
  steps: [],
  is_loaded: false,
  current_step_index: 0,
  answers: {} as WizardAnswers,
  products: [],
  partial_lead_id: null,
};

// ─────────────────────────────────────────────
// Store Definition
// persist() saves answers + step index to sessionStorage
// so a page refresh does not lose wizard progress
// ─────────────────────────────────────────────

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /** Load wizard steps from Firestore (called once on wizard page mount) */
      setSteps: (steps) =>
        set({ steps, is_loaded: true }),
      
      /** Load products from API for live filtering */
      setProducts: (products) => set({ products }),

      /** Record a customer answer for a specific question */
      setAnswer: (questionId, value) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: value },
        })),

      setPartialLeadId: (id) => set({ partial_lead_id: id }),

      /** Jump to a specific step index (used by back button and progress bar) */
      goToStep: (index) => {
        const { steps } = get();
        const clampedIndex = Math.max(0, Math.min(index, steps.length - 1));
        set({ current_step_index: clampedIndex });
      },

      /** Advance to the next step */
      nextStep: () => {
        const { current_step_index, steps } = get();
        if (current_step_index < steps.length - 1) {
          set({ current_step_index: current_step_index + 1 });
        }
      },

      /** Go back to the previous step */
      previousStep: () => {
        const { current_step_index } = get();
        if (current_step_index > 0) {
          set({ current_step_index: current_step_index - 1 });
        }
      },

      /** Clear all answers and reset to step 0 (called after successful lead creation) */
      resetWizard: () => set({ ...initialState }),
    }),
    {
      name: "team-cctv-wizard", // sessionStorage key
      storage: {
        // Custom storage adapter targeting sessionStorage (not localStorage)
        getItem: (key) => {
          if (typeof window === "undefined") return null;
          const item = sessionStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        },
        setItem: (key, value) => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(key, JSON.stringify(value));
          }
        },
        removeItem: (key) => {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(key);
          }
        },
      },
      // Only persist answers and current step — not the fetched steps config
      partialize: (state): any => ({
        answers: state.answers,
        current_step_index: state.current_step_index,
        partial_lead_id: state.partial_lead_id,
      }),
    }
  )
);
