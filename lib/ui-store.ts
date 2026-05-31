import { create } from 'zustand';

interface UiState {
  isServiceAreaModalOpen: boolean;
  openServiceAreaModal: () => void;
  closeServiceAreaModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isServiceAreaModalOpen: false,
  openServiceAreaModal: () => set({ isServiceAreaModalOpen: true }),
  closeServiceAreaModal: () => set({ isServiceAreaModalOpen: false }),
}));
