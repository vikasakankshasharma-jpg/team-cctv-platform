import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LocaleCode } from './mapping';

interface I18nState {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  // A flag to know if user manually changed it, so we don't overwrite it with pincode auto-detect later
  isManuallySet: boolean;
  hasSeenWelcome: boolean;
  setLocaleFromPincode: (locale: LocaleCode) => void;
  setHasSeenWelcome: (value: boolean) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'en', // Default fallback
      isManuallySet: false,
      hasSeenWelcome: false,
      setLocale: (locale) => set({ locale, isManuallySet: true, hasSeenWelcome: true }),
      setLocaleFromPincode: (locale) => set((state) => {
        // Only update if user hasn't manually overridden
        if (!state.isManuallySet) {
          return { locale };
        }
        return {};
      }),
      setHasSeenWelcome: (value) => set({ hasSeenWelcome: value }),
    }),
    {
      name: 'i18n-storage',
    }
  )
);
