export type LocaleCode = 'en' | 'hi' | 'mr' | 'gu' | 'ta' | 'te' | 'kn' | 'bn' | 'ml' | 'pa' | 'or';

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
