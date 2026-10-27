"use client";

import React from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface WhatsAppOtpNoticeProps {
  phone: string;
  method?: "whatsapp" | "sms";
  onSwitchToSms?: () => void;
  countdown?: number;
  loading?: boolean;
}

export function WhatsAppOtpNotice({
  phone,
  method = "whatsapp",
  onSwitchToSms,
  countdown = 0,
  loading = false,
}: WhatsAppOtpNoticeProps) {
  const { t } = useTranslation();
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const isWhatsApp = method === "whatsapp";

  if (!isWhatsApp) {
    return (
      <div className="p-4 sm:p-4.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-900 text-left animate-in fade-in">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-xs uppercase tracking-wider text-blue-800 dark:text-blue-300">
                {t("sms_otp_badge", "Regular SMS Dispatched")}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-950 dark:text-blue-100 font-semibold leading-snug">
              {t("sms_otp_title", "We sent your 4-digit code via text SMS to")} <span className="underline decoration-blue-400 font-black">+91 {cleanPhone}</span>.
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1">
              {t("sms_otp_desc", "Please check your phone's Messages inbox and enter the code below to proceed.")}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              {t("wa_otp_badge", "Check WhatsApp App")}
            </span>
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              {t("wa_otp_not_sms", "Not Regular SMS")}
            </span>
          </div>

          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
            {t("wa_otp_title", "OTP sent to your WhatsApp on")} <span className="text-emerald-700 dark:text-emerald-400 font-black">+91 {cleanPhone}</span>
          </h4>

          <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 leading-relaxed">
            {t("wa_otp_desc", "Please open your WhatsApp to copy the 4-digit code. You must enter this OTP below to continue.")}
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <a
              href="whatsapp://"
              onClick={(e) => {
                setTimeout(() => {
                  window.open("https://web.whatsapp.com", "_blank");
                }, 500);
              }}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.49 2.04 7.8L.5 31.5l7.94-2.08A15.45 15.45 0 0016 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28.2a13.7 13.7 0 01-7-1.93l-.5-.3-5.18 1.36 1.37-5.04-.33-.52A13.72 13.72 0 1116 28.7zm7.52-10.27c-.41-.2-2.43-1.2-2.81-1.34-.37-.14-.64-.2-.91.2s-1.04 1.34-1.28 1.62c-.23.27-.47.3-.88.1a11.15 11.15 0 01-3.28-2.02 12.3 12.3 0 01-2.27-2.82c-.24-.41-.03-.63.18-.84.18-.18.41-.47.61-.71.2-.23.27-.4.41-.67.14-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.68-.91-.69h-.78c-.27 0-.71.1-1.08.5a3.94 3.94 0 00-1.23 2.94c0 1.73 1.26 3.41 1.44 3.64.17.24 2.49 3.8 6.03 5.33.84.36 1.5.58 2.01.74.85.27 1.62.23 2.23.14.68-.1 2.1-.86 2.39-1.69.3-.83.3-1.55.21-1.69-.08-.14-.35-.24-.76-.44z" />
              </svg>
              <span>{t("wa_otp_open_btn", "📲 Open WhatsApp App ↗")}</span>
            </a>

            {onSwitchToSms && (
              <button
                type="button"
                onClick={onSwitchToSms}
                disabled={loading || countdown > 0}
                className="text-xs text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold underline text-center py-1 sm:py-0 transition-colors"
              >
                {countdown > 0 ? `${t("can_resend_in", "Can request SMS in")} ${countdown}s` : t("wa_otp_sms_fallback", "Didn't get on WhatsApp? Send via SMS")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
