"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { ShieldCheck, Info } from "lucide-react";

interface LegalLanguageSummaryBannerProps {
  type: "privacy" | "terms";
}

export function LegalLanguageSummaryBanner({ type }: LegalLanguageSummaryBannerProps) {
  const { t, locale } = useTranslation();

  if (locale === "en") return null;

  const isPrivacy = type === "privacy";

  return (
    <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50/90 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{t("legal_banner_badge", "Quick Summary in Your Language")}</span>
        </span>
      </div>
      <h2 className="text-lg font-extrabold text-slate-900 mb-2">
        {isPrivacy
          ? t("legal_privacy_title", "Privacy Policy — Key Points at a Glance")
          : t("legal_terms_title", "Terms of Service — Key Points at a Glance")}
      </h2>
      <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3">
        {isPrivacy
          ? t(
              "legal_privacy_body",
              "We only collect your name, mobile number, pincode, and site details to prepare your CCTV quote, book installation, and issue your 18% GST warranty invoice. We never sell your personal data. Email hello@cctvquotation.com anytime to update or delete your data."
            )
          : t(
              "legal_terms_body",
              "Quotations include 18% GST, genuine sealed hardware, and standard cabling (15m/camera). Payment stages are ₹500 booking token, 90% on material delivery, and 10% after live mobile testing. Hardware carries brand warranty plus 1-year workmanship support."
            )}
      </p>
      <div className="flex items-start gap-2 text-xs font-medium text-blue-800 bg-white/70 rounded-xl px-3.5 py-2 border border-blue-100">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
        <span>{t("legal_full_notice", "Full legally binding text is shown in English below.")}</span>
      </div>
    </div>
  );
}
