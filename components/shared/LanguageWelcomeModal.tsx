"use client";

import { useEffect, useState } from "react";
import { useI18nStore } from "@/lib/i18n/store";
import { languageNames, LocaleCode } from "@/lib/i18n/mapping";
import { Globe, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

export function LanguageWelcomeModal() {
  const { hasSeenWelcome, setLocale, setHasSeenWelcome } = useI18nStore();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Add a slight delay before showing the modal for a better UX (prevents instant jarring popup)
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenWelcome]);

  if (!mounted || !show) return null;

  const handleSelect = (code: LocaleCode) => {
    setLocale(code);
    setHasSeenWelcome(true);
    setShow(false);
  };

  const handleClose = () => {
    setHasSeenWelcome(true);
    setShow(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
        >
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 mx-auto">
              <Globe className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-black text-center text-zinc-900 dark:text-white tracking-tight mb-2">
              {t('lwm_title', 'Choose your language')}
            </h2>
            <p className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-8">
              {t('lwm_subtitle', 'अपनी पसंदीदा भाषा चुनें | तुमची आवडती भाषा निवडा')}
            </p>

            <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto px-1 pb-4 snap-y custom-scrollbar">
              {Object.entries(languageNames).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => handleSelect(code as LocaleCode)}
                  className="p-4 bg-zinc-50 hover:bg-blue-50 dark:bg-zinc-800/50 dark:hover:bg-blue-900/20 border border-zinc-200 hover:border-blue-300 dark:border-zinc-700 dark:hover:border-blue-700 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-blue-400 transition-all text-center snap-start"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-xs font-bold text-zinc-400">
              {t('lwm_desc', 'You can change this anytime from the top menu')}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
