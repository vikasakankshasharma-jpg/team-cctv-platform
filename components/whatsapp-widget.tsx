"use client";

import { MessageCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function WhatsAppWidget() {
  const { t } = useTranslation();
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210";
  const message = encodeURIComponent("Hi");
  
  // Using standard wa.me link which works on both desktop (WhatsApp Web) and mobile (WhatsApp App)
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#1ebe57] transition-transform hover:scale-110 active:scale-95 animate-bounce"
      aria-label={t("wa_widget_aria", "Chat with us on WhatsApp")}
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
