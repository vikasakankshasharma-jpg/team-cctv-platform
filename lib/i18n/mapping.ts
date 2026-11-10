export type LocaleCode = 'en' | 'hi' | 'mr' | 'gu' | 'ta' | 'te' | 'kn' | 'bn' | 'ml' | 'pa' | 'or';

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

/**
 * Resolves user text input (number, code, English or native name) to a valid LocaleCode.
 * Returns null if not a recognized language selection.
 */
export function resolveLanguageInput(input: string): LocaleCode | null {
  if (!input) return null;
  const clean = String(input).trim().toLowerCase();
  
  for (const lang of ALL_11_LANGUAGES) {
    if (lang.aliases.includes(clean)) {
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

  // Hindi Belt
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
    state.includes("himachal pradesh")
  ) {
    return 'hi';
  }

  // Other specific languages
  if (state.includes("maharashtra")) return 'mr';
  if (state.includes("gujarat")) return 'gu';
  if (state.includes("tamil nadu") || state.includes("pondicherry") || state.includes("puducherry")) return 'ta';
  if (state.includes("karnataka")) return 'kn';
  if (state.includes("west bengal")) return 'bn';
  if (state.includes("andhra pradesh") || state.includes("telangana")) return 'te';
  if (state.includes("kerala")) return 'ml';
  if (state.includes("punjab")) return 'pa';
  if (state.includes("odisha") || state.includes("orissa")) return 'or';

  // Fallback
  return 'en';
}
