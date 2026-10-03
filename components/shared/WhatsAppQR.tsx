"use client";

import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "@/hooks/useTranslation";

export function WhatsAppQR({ size = 150 }: { size?: number }) {
  const { t } = useTranslation();
  const WA_NUMBER = "917357612865";
  const message = "Hi CCTVQuotation Team! 👋 I'd like a free quotation for CCTV installation at my property. Please help me.";
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-zinc-200">
      <QRCodeSVG value={waUrl} size={size} level="H" includeMargin={true} />
      <p className="mt-3 text-sm font-semibold text-zinc-600 text-center">
        {t("qrc_scan_whatsapp")}
      </p>
    </div>
  );
}
