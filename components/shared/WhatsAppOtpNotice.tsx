"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getWhatsAppAppUrl,
  getWhatsAppUniversalUrl,
  isMobileDevice,
  openWhatsAppApp,
  OTP_WHATSAPP_SENDER_NUMBER,
} from "@/lib/whatsapp";

interface WhatsAppOtpNoticeProps {
  phone: string;
  countdown?: number;
  loading?: boolean;
}

export function WhatsAppOtpNotice({
  phone,
}: WhatsAppOtpNoticeProps) {
  const { t } = useTranslation();
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const [isMobile, setIsMobile] = useState(false);
  const [appFallbackNeeded, setAppFallbackNeeded] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const appHref = getWhatsAppAppUrl(OTP_WHATSAPP_SENDER_NUMBER);
  const fallbackHref = isMobile
    ? getWhatsAppUniversalUrl(OTP_WHATSAPP_SENDER_NUMBER)
    : "https://web.whatsapp.com";

  return (
    <div className="p-4 sm:p-4.5 rounded-2xl bg-emerald-50/95 dark:bg-emerald-950/40 border-2 border-emerald-500/50 dark:border-emerald-500/30 text-left shadow-sm animate-in fade-in">
      <div className="flex items-start gap-3">
        {/* WhatsApp Brand Icon with pulsating badge */}
        <div className="relative shrink-0 mt-0.5">
          <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-5 h-5">
              <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.49 2.04 7.8L.5 31.5l7.94-2.08A15.45 15.45 0 0016 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28.2a13.7 13.7 0 01-7-1.93l-.5-.3-5.18 1.36 1.37-5.04-.33-.52A13.72 13.72 0 1116 28.7zm7.52-10.27c-.41-.2-2.43-1.2-2.81-1.34-.37-.14-.64-.2-.91.2s-1.04 1.34-1.28 1.62c-.23.27-.47.3-.88.1a11.15 11.15 0 01-3.28-2.02 12.3 12.3 0 01-2.27-2.82c-.24-.41-.03-.63.18-.84.18-.18.41-.47.61-.71.2-.23.27-.4.41-.67.14-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.68-.91-.69h-.78c-.27 0-.71.1-1.08.5a3.94 3.94 0 00-1.23 2.94c0 1.73 1.26 3.41 1.44 3.64.17.24 2.49 3.8 6.03 5.33.84.36 1.5.58 2.01.74.85.27 1.62.23 2.23.14.68-.1 2.1-.86 2.39-1.69.3-.83.3-1.55.21-1.69-.08-.14-.35-.24-.76-.44z" />
            </svg>
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-emerald-600 text-white shadow-xs">
              {t("wa_otp_badge", "WhatsApp Verification")}
            </span>
          </div>

          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
            {t("wa_otp_title", "OTP sent to your WhatsApp on")}{" "}
            <span className="text-emerald-700 dark:text-emerald-400 font-black">+91 {cleanPhone}</span>
          </h4>

          <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 leading-relaxed">
            {t("wa_otp_desc", "Please open your WhatsApp to copy the 4-digit code. You must enter this OTP below to continue.")}
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <a
              href={appHref}
              onClick={() => {
                setAppFallbackNeeded(false);
                openWhatsAppApp({
                  phone: OTP_WHATSAPP_SENDER_NUMBER,
                  navigate: false,
                  onFallback: () => setAppFallbackNeeded(true),
                });
              }}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.49 2.04 7.8L.5 31.5l7.94-2.08A15.45 15.45 0 0016 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28.2a13.7 13.7 0 01-7-1.93l-.5-.3-5.18 1.36 1.37-5.04-.33-.52A13.72 13.72 0 1116 28.7zm7.52-10.27c-.41-.2-2.43-1.2-2.81-1.34-.37-.14-.64-.2-.91.2s-1.04 1.34-1.28 1.62c-.23.27-.47.3-.88.1a11.15 11.15 0 01-3.28-2.02 12.3 12.3 0 01-2.27-2.82c-.24-.41-.03-.63.18-.84.18-.18.41-.47.61-.71.2-.23.27-.4.41-.67.14-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.68-.91-.69h-.78c-.27 0-.71.1-1.08.5a3.94 3.94 0 00-1.23 2.94c0 1.73 1.26 3.41 1.44 3.64.17.24 2.49 3.8 6.03 5.33.84.36 1.5.58 2.01.74.85.27 1.62.23 2.23.14.68-.1 2.1-.86 2.39-1.69.3-.83.3-1.55.21-1.69-.08-.14-.35-.24-.76-.44z" />
              </svg>
              <span>{t("wa_otp_open_btn", "📲 Open WhatsApp App ↗")}</span>
            </a>

            <a
              href={fallbackHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs font-semibold underline text-center py-1 sm:py-0 transition-colors ${
                appFallbackNeeded
                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/50 px-2 py-1 rounded-md"
                  : "text-slate-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400"
              }`}
            >
              {isMobile
                ? t("wa_otp_mobile_link", "Or open via WhatsApp link ↗")
                : t("wa_otp_web_fallback", "Or open in WhatsApp Web ↗")}
            </a>
          </div>
          {appFallbackNeeded && (
            <p className="mt-2 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
              {isMobile
                ? t("wa_otp_fallback_hint_mobile", "App didn't switch automatically? Tap 'Or open via WhatsApp link ↗' above.")
                : t("wa_otp_fallback_hint_desktop", "WhatsApp Desktop not installed or didn't launch? Click 'Or open in WhatsApp Web ↗' above.")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
