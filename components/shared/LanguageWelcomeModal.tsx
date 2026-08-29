"use client";

import { useEffect, useState } from "react";
import { useI18nStore } from "@/lib/i18n/store";
import { languageNames, LocaleCode } from "@/lib/i18n/mapping";
import { Globe, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

export function LanguageWelcomeModal() {
  const { hasSeenWelcome, setHasSeenWelcome } = useI18nStore();

  useEffect(() => {
    // Disable the intrusive language modal for better Google Ads landing page experience.
    // Users can still use the LanguageSwitcher in the header.
    if (!hasSeenWelcome) {
      setHasSeenWelcome(true);
    }
  }, [hasSeenWelcome, setHasSeenWelcome]);

  return null;
}
