export type LocaleCode = 'en' | 'hi' | 'mr' | 'gu' | 'ta' | 'te' | 'kn' | 'bn' | 'ml' | 'pa' | 'or';

export const LOCALE_COOKIE_NAME = 'team_locale';

export interface LanguageOption {
  num: number;
  code: LocaleCode;
  native: string;
  english: string;
  aliases: string[];
}

export const ALL_11_LANGUAGES: LanguageOption[] = [
  { num: 1, code: 'en', native: 'English', english: 'English', aliases: ['1', 'en', 'english', 'angrezi'] },
  { num: 2, code: 'hi', native: 'हिन्दी', english: 'Hindi', aliases: ['2', 'hi', 'hindi', 'हिंदी', 'हिन्दी'] },
  { num: 3, code: 'mr', native: 'मराठी', english: 'Marathi', aliases: ['3', 'mr', 'marathi', 'मराठी'] },
  { num: 4, code: 'gu', native: 'ગુજરાતી', english: 'Gujarati', aliases: ['4', 'gu', 'gujarati', 'ગુજરાતી'] },
  { num: 5, code: 'ta', native: 'தமிழ்', english: 'Tamil', aliases: ['5', 'ta', 'tamil', 'தமிழ்'] },
  { num: 6, code: 'te', native: 'తెలుగు', english: 'Telugu', aliases: ['6', 'te', 'telugu', 'తెలుగు'] },
  { num: 7, code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada', aliases: ['7', 'kn', 'kannada', 'ಕನ್ನಡ'] },
  { num: 8, code: 'bn', native: 'বাংলা', english: 'Bengali', aliases: ['8', 'bn', 'bengali', 'bangla', 'বাংলা'] },
  { num: 9, code: 'ml', native: 'മലയാളം', english: 'Malayalam', aliases: ['9', 'ml', 'malayalam', 'മലയാളം'] },
  { num: 10, code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi', aliases: ['10', 'pa', 'punjabi', 'ਪੰਜਾਬੀ'] },
  { num: 11, code: 'or', native: 'ଓଡ଼ିଆ', english: 'Odia', aliases: ['11', 'or', 'odia', 'oriya', 'ଓଡ଼ିଆ'] },
];

export const languageNames: Record<LocaleCode, string> = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  mr: 'मराठी (Marathi)',
  gu: 'ગુજરાતી (Gujarati)',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
  kn: 'ಕನ್ನಡ (Kannada)',
  bn: 'বাংলা (Bengali)',
  ml: 'മലയാളം (Malayalam)',
  pa: 'ਪੰਜਾਬੀ (Punjabi)',
  or: 'ଓଡ଼ିଆ (Odia)'
};

export const SPEECH_LOCALE_MAP: Record<LocaleCode, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  bn: 'bn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  or: 'or-IN',
};

export const INDIC_GOOGLE_FONTS: Partial<Record<LocaleCode, { family: string; cssFamily: string }>> = {
  hi: { family: 'Noto+Sans+Devanagari:wght@400;500;600;700', cssFamily: '"Noto Sans Devanagari"' },
  mr: { family: 'Noto+Sans+Devanagari:wght@400;500;600;700', cssFamily: '"Noto Sans Devanagari"' },
  gu: { family: 'Noto+Sans+Gujarati:wght@400;500;600;700', cssFamily: '"Noto Sans Gujarati"' },
  ta: { family: 'Noto+Sans+Tamil:wght@400;500;600;700', cssFamily: '"Noto Sans Tamil"' },
  te: { family: 'Noto+Sans+Telugu:wght@400;500;600;700', cssFamily: '"Noto Sans Telugu"' },
  kn: { family: 'Noto+Sans+Kannada:wght@400;500;600;700', cssFamily: '"Noto Sans Kannada"' },
  bn: { family: 'Noto+Sans+Bengali:wght@400;500;600;700', cssFamily: '"Noto Sans Bengali"' },
  ml: { family: 'Noto+Sans+Malayalam:wght@400;500;600;700', cssFamily: '"Noto Sans Malayalam"' },
  pa: { family: 'Noto+Sans+Gurmukhi:wght@400;500;600;700', cssFamily: '"Noto Sans Gurmukhi"' },
  or: { family: 'Noto+Sans+Oriya:wght@400;500;600;700', cssFamily: '"Noto Sans Oriya"' },
};

/**
 * Resolves user text input (number, code, English or native name) to a valid LocaleCode.
 * Returns null if not a recognized language selection.
 */
export function resolveLanguageInput(input: string): LocaleCode | null {
  if (!input) return null;
  const clean = String(input).trim().toLowerCase();
  const normalized = clean.startsWith("lang_") ? clean.slice(5) : clean;
  
  for (const lang of ALL_11_LANGUAGES) {
    if (lang.aliases.includes(clean) || lang.aliases.includes(normalized)) {
      return lang.code;
    }
  }
  return null;
}

/**
 * Maps an Indian State (as returned by Postal API) to a local language code.
 * Defaults to 'en' (English) if unsupported.
 */
export function getStateLanguage(stateName: string): LocaleCode {
  if (!stateName) return 'en';
  const state = stateName.toLowerCase().trim();

  // Hindi Belt + UTs
  if (
    state.includes("uttar pradesh") ||
    state.includes("madhya pradesh") ||
    state.includes("rajasthan") ||
    state.includes("bihar") ||
    state.includes("haryana") ||
    state.includes("delhi") ||
    state.includes("uttarakhand") ||
    state.includes("chhattisgarh") ||
    state.includes("jharkhand") ||
    state.includes("himachal pradesh") ||
    state.includes("chandigarh") ||
    state.includes("jammu") ||
    state.includes("ladakh") ||
    state.includes("andaman")
  ) {
    return 'hi';
  }

  // Other specific languages & UTs
  if (state.includes("maharashtra") || state.includes("goa")) return 'mr';
  if (state.includes("gujarat") || state.includes("daman") || state.includes("dadra")) return 'gu';
  if (state.includes("tamil nadu") || state.includes("pondicherry") || state.includes("puducherry")) return 'ta';
  if (state.includes("karnataka")) return 'kn';
  if (state.includes("west bengal") || state.includes("tripura")) return 'bn';
  if (state.includes("andhra pradesh") || state.includes("telangana")) return 'te';
  if (state.includes("kerala") || state.includes("lakshadweep")) return 'ml';
  if (state.includes("punjab")) return 'pa';
  if (state.includes("odisha") || state.includes("orissa")) return 'or';

  // Fallback
  return 'en';
}

export function getLanguageFromPincodePrefix(pincode?: string | null): LocaleCode | null {
  const clean = String(pincode || "").replace(/\D/g, "");
  if (clean.length < 2) return null;
  const p2 = parseInt(clean.slice(0, 2), 10);
  if (p2 === 14 || p2 === 15 || p2 === 16) return "pa";
  if ((p2 >= 11 && p2 <= 34) || (p2 >= 45 && p2 <= 49) || (p2 >= 80 && p2 <= 85)) return "hi";
  if (p2 >= 36 && p2 <= 39) return "gu";
  if (p2 >= 40 && p2 <= 44) return "mr";
  if (p2 >= 50 && p2 <= 53) return "te";
  if (p2 >= 56 && p2 <= 59) return "kn";
  if (p2 >= 60 && p2 <= 64) return "ta";
  if (p2 >= 67 && p2 <= 69) return "ml";
  if (p2 >= 70 && p2 <= 74) return "bn";
  if (p2 >= 75 && p2 <= 77) return "or";
  return null;
}

export const VALID_LOCALE_CODES: readonly LocaleCode[] = ALL_11_LANGUAGES.map((l) => l.code);

export function isValidLocale(val: unknown): val is LocaleCode {
  return typeof val === "string" && (VALID_LOCALE_CODES as readonly string[]).includes(val);
}
