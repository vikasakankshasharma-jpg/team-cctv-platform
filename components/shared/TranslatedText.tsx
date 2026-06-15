"use client";

import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";

export function TranslatedText({ tKey, defaultText, params }: { tKey: TranslationKey, defaultText: string, params?: Record<string, string> }) {
  const { t } = useTranslation();
  return <>{t(tKey, defaultText, params)}</>;
}
