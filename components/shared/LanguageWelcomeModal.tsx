"use client";

import { useEffect, useState } from "react";
import { useI18nStore } from "@/lib/i18n/store";
import { LocaleCode } from "@/lib/i18n/mapping";
import { Globe2, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [mounted, setMounted] = useState(false);
  const { hasSeenWelcome, setLocale, setHasSeenWelcome } = useI18nStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration mismatch prevention
  if (!mounted) return null;

  const handleSelect = (code: LocaleCode) => {
    setLocale(code);
  };

  const handleDismiss = () => {
    setHasSeenWelcome(true);
  };

  return (
    <AnimatePresence>
      {!hasSeenWelcome && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center p-0 sm:p-4 bg-zinc-950/40 backdrop-blur-sm transition-opacity">
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
              
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Choose Your Language</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">अपनी पसंदीदा भाषा चुनें</p>
              
              <button 
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Grid */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all active:scale-[0.98] group shadow-sm hover:shadow-md"
                  >
                    <span className="text-xl font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
                      {lang.native}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                      {lang.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0">
              <button
                onClick={() => {
                  setLocale('en'); // Explicitly set and close
                }}
                className="w-full py-4 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Continue in English
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
