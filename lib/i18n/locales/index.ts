import type { LocaleCode } from "../mapping";
import { en, type TranslationKey } from "./en";

export { en, type TranslationKey };
export type TranslationDict = Record<TranslationKey, string>;

const localeCache: Partial<Record<LocaleCode, TranslationDict>> = {
  en,
};

const pendingLoads: Partial<Record<LocaleCode, Promise<TranslationDict>>> = {};
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const cb of listeners) {
    try {
      cb();
    } catch {
      // Ignore subscriber errors
    }
  }
}

export function subscribeLocaleLoads(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function seedLocaleDict(locale: LocaleCode, dict?: TranslationDict | null): void {
  if (!dict) return;
  if (!localeCache[locale]) {
    localeCache[locale] = dict;
  }
}

export function getCachedLocaleDict(locale: LocaleCode): TranslationDict | undefined {
  return localeCache[locale];
}

export function getLocaleDictSyncFallback(locale: LocaleCode): TranslationDict {
  return localeCache[locale] || en;
}

async function importLocaleChunk(locale: LocaleCode): Promise<TranslationDict> {
  switch (locale) {
    case "hi":
      return (await import("./hi")).hi;
    case "mr":
      return (await import("./mr")).mr;
    case "gu":
      return (await import("./gu")).gu;
    case "ta":
      return (await import("./ta")).ta;
    case "te":
      return (await import("./te")).te;
    case "kn":
      return (await import("./kn")).kn;
    case "bn":
      return (await import("./bn")).bn;
    case "ml":
      return (await import("./ml")).ml;
    case "pa":
      return (await import("./pa")).pa;
    case "or":
      return (await import("./or")).or;
    case "en":
    default:
      return en;
  }
}

export async function loadLocaleDict(locale: LocaleCode): Promise<TranslationDict> {
  const cached = localeCache[locale];
  if (cached) return cached;

  const existing = pendingLoads[locale];
  if (existing) return existing;

  const p = importLocaleChunk(locale)
    .then((dict) => {
      localeCache[locale] = dict;
      delete pendingLoads[locale];
      notifyListeners();
      return dict;
    })
    .catch((err) => {
      delete pendingLoads[locale];
      throw err;
    });

  pendingLoads[locale] = p;
  return p;
}
