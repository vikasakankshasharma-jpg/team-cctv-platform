"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";

export function TranslatedText({ tKey, defaultText, params }: { tKey: TranslationKey, defaultText: string, params?: Record<string, string> }) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="opacity-0">{defaultText}</span>;
  }

  return <span>{t(tKey, defaultText, params)}</span>;
}
