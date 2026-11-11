import { cookies } from "next/headers";
import type { LocaleCode } from "./mapping";
import { loadLocaleDict, type TranslationDict } from "./locales";

export const LOCALE_COOKIE_NAME = "team_locale";

export const VALID_LOCALE_CODES: readonly LocaleCode[] = [
  "en",
  "hi",
  "mr",
  "gu",
  "ta",
  "te",
  "kn",
  "bn",
  "ml",
  "pa",
  "or",
];

export function isValidLocale(val?: string | null): val is LocaleCode {
  return Boolean(val && (VALID_LOCALE_CODES as readonly string[]).includes(val));
}

export async function getServerLocale(): Promise<LocaleCode> {
  try {
    const store = await cookies();
    const raw = store.get(LOCALE_COOKIE_NAME)?.value;
    if (isValidLocale(raw)) return raw;
  } catch {
    // Fallback cleanly outside request scope
  }
  return "en";
}

export function translateFromDict(
  dict: TranslationDict | Record<string, string>,
  fallbackDict: Record<string, string>,
  key: string,
  fallback?: string,
  params?: Record<string, string>
): string {
  const dictMap = dict as Record<string, string>;
  let str = dictMap[key] || fallbackDict[key] || fallback || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
  }
  return str;
}

export async function getServerTranslations(overrideLocale?: LocaleCode) {
  const locale = overrideLocale && isValidLocale(overrideLocale) ? overrideLocale : await getServerLocale();
  const [dict, enDict] = await Promise.all([
    loadLocaleDict(locale),
    locale === "en" ? Promise.resolve(undefined) : loadLocaleDict("en"),
  ]);
  const fallbackDict = enDict || dict;
  const t = (
    key: string,
    fallbackOrParams?: string | Record<string, string>,
    maybeParams?: Record<string, string>
  ): string => {
    const fallback = typeof fallbackOrParams === "string" ? fallbackOrParams : undefined;
    const params =
      typeof fallbackOrParams === "object" && fallbackOrParams !== null
        ? fallbackOrParams
        : maybeParams;
    return translateFromDict(dict, fallbackDict, key, fallback, params);
  };
  return { locale, dict, t };
}
