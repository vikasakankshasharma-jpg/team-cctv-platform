"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18nStore } from "@/lib/i18n/store";
import { LocaleCode, ALL_11_LANGUAGES, getLanguageFromPincodePrefix } from "@/lib/i18n/mapping";
import { Globe2, X, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

const languages: { code: LocaleCode; name: string; native: string }[] = [
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
];

export function LanguageWelcomeModal() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const [geoSuggestedLocale, setGeoSuggestedLocale] = useState<LocaleCode | null>(null);
  const { locale, hasSeenWelcome, setLocale, setHasSeenWelcome } = useI18nStore();

  useEffect(() => {
    setMounted(true);
    try {
      const sp = new URLSearchParams(window.location.search);
      const pinHint = getLanguageFromPincodePrefix(sp.get("pincode"));
      if (pinHint) {
        setGeoSuggestedLocale(pinHint);
      } else if (typeof navigator !== "undefined") {
        const navCodes = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
        for (const tag of navCodes) {
          const base = tag.split("-")[0].toLowerCase() as LocaleCode;
          if (base !== "en" && ALL_11_LANGUAGES.some((l) => l.code === base)) {
            setGeoSuggestedLocale(base);
            break;
          }
        }
      }
    } catch {
      // Safe fallback
    }
    const handler = () => setForceOpen(true);
    window.addEventListener('open-language-modal', handler);
    return () => window.removeEventListener('open-language-modal', handler);
  }, []);

  const orderedLanguages = useMemo(() => {
    if (!geoSuggestedLocale || geoSuggestedLocale === "en") return languages;
    const match = languages.find((l) => l.code === geoSuggestedLocale);
    if (!match) return languages;
    // Float detected regional language first, then Hindi, then remaining scripts
    const rest = languages.filter((l) => l.code !== geoSuggestedLocale);
    if (geoSuggestedLocale === "hi") return [match, ...rest];
    const hiEntry = rest.find((l) => l.code === "hi");
    const others = rest.filter((l) => l.code !== "hi");
    return hiEntry ? [match, hiEntry, ...others] : [match, ...others];
  }, [geoSuggestedLocale]);

  // Hydration mismatch prevention
  if (!mounted) return null;

  const handleSelect = (code: LocaleCode) => {
    setLocale(code);
    setHasSeenWelcome(true);
    setForceOpen(false);
  };

  const handleDismiss = () => {
    setHasSeenWelcome(true);
    setForceOpen(false);
  };

  return (
    <AnimatePresence>
      {!hasSeenWelcome && !forceOpen && (
        <motion.div
          key="language-quick-bar"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="fixed bottom-20 sm:bottom-6 inset-x-3 sm:inset-x-auto sm:right-6 z-[75] max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-3.5"
        >
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Globe2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight break-words">
                  {t("lwm_title", "Choose Your Language")}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              aria-label={t("lwm_close_picker", "Close language picker")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {orderedLanguages.map((lang) => {
              const isSuggested = geoSuggestedLocale === lang.code;
              const isActive = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1 ${
                    isActive
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      : isSuggested
                        ? "border-emerald-400 bg-emerald-50/70 dark:bg-emerald-900/30 text-zinc-900 dark:text-zinc-100 hover:border-blue-500"
                        : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  <span>{lang.native}</span>
                  {isSuggested && <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                </button>
              );
            })}
            <button
              onClick={() => handleSelect('en')}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              English
            </button>
          </div>
        </motion.div>
      )}

      {forceOpen && (
        <div
          key="language-full-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center p-0 sm:p-4 bg-zinc-950/40 backdrop-blur-sm transition-opacity"
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full sm:max-w-md mx-auto bg-white dark:bg-zinc-950 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 text-center flex-shrink-0">
              <div className="mx-auto w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-5 sm:hidden" />
              
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4 ring-4 ring-white dark:ring-zinc-950 shadow-sm relative">
                <Globe2 className="w-7 h-7" />
                <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-blue-400" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t("lwm_title", "Choose Your Language")}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">{t("lwm_desc", "You can change this anytime from the top bar.")}</p>
              
              <button 
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
                aria-label={t("lwm_close", "Close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Grid */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="grid grid-cols-2 gap-3">
                {orderedLanguages.map((lang) => {
                  const isActive = locale === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleSelect(lang.code)}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-[0.98] group shadow-sm hover:shadow-md ${
                        isActive
                          ? "border-blue-600 bg-blue-50/70 dark:bg-blue-900/30 dark:border-blue-500"
                          : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                      }`}
                    >
                      {isActive && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 absolute top-2.5 right-2.5" />
                      )}
                      <span className="text-xl font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
                        {lang.native}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                        {lang.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0">
              <button
                onClick={() => handleSelect('en')}
                className="w-full py-4 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {locale === 'en' ? <Check className="w-4 h-4" /> : null}
                {t("lwm_continue_en", "Continue in English")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
