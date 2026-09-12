"use client";

import { useI18nStore } from '@/lib/i18n/store';
import { translations, TranslationKey } from '@/lib/i18n/translations';

export function useTranslation() {
  const locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);

  const t = (key: TranslationKey | (string & {}), fallback?: string, params?: Record<string, string>): string => {
    // Try current locale
    let str = "";
    const currentDict = translations[locale] as Record<string, string> | undefined;
    const enDict = translations['en'] as Record<string, string> | undefined;

    if (currentDict && currentDict[key]) {
      str = currentDict[key]!;
    } else if (enDict && enDict[key]) {
      // Fallback to English
      str = enDict[key]!;
    } else {
      // Fallback to provided default or the key itself
      str = fallback || key;
    }

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }

    return str;
  };

  return { t, locale, setLocale };
}
