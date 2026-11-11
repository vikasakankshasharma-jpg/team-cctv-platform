"use client";

import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";

export function TranslatedText({
  tKey,
  defaultText,
  params,
}: {
  tKey: TranslationKey | (string & {});
  defaultText: string;
  params?: Record<string, string>;
}) {
  const { t } = useTranslation();

  return <span suppressHydrationWarning>{t(tKey, defaultText, params)}</span>;
}
