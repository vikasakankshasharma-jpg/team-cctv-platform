/**
 * Universal WhatsApp Helper
 * Handles smart redirection:
 * - On Mobile (iOS / Android): Directly opens the installed WhatsApp native app.
 * - On Desktop (Windows / Mac / Linux):
 *   1. Tries to open the local desktop application via `whatsapp://`.
 *   2. If not found or window does not blur within timeout, falls back smoothly to WhatsApp Web.
 *   3. Also provides explicit web URLs for direct browser access.
 */

export const SUPPORT_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "917357612865";

export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Specifically for opening WhatsApp to view an incoming OTP or message.
 * - On Mobile: Opens native WhatsApp app directly.
 * - On Desktop: Attempts native desktop app protocol with automatic fallback to Web WhatsApp.
 */
export function openWhatsAppApp(): void {
  if (typeof window === "undefined") return;

  if (isMobileDevice()) {
    // Mobile always opens the native app
    window.location.href = "whatsapp://";
    return;
  }

  // Desktop: Try local desktop app first
  let appOpened = false;

  const handleBlur = () => {
    appOpened = true;
    window.removeEventListener("blur", handleBlur);
  };

  window.addEventListener("blur", handleBlur);

  // Attempt to invoke local desktop application
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = "whatsapp://";
  document.body.appendChild(iframe);

  // Fallback to WhatsApp Web if app did not take focus
  setTimeout(() => {
    window.removeEventListener("blur", handleBlur);
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }

    if (!appOpened && !document.hidden) {
      window.open("https://web.whatsapp.com", "_blank", "noopener,noreferrer");
    }
  }, 1200);
}

/**
 * Initiates a pre-filled chat with a number (e.g. customer support or sharing a quote).
 * - On Mobile: Opens native WhatsApp app with contact & message.
 * - On Desktop: Attempts native app first, falls back to WhatsApp Web with pre-filled message.
 */
export function openWhatsAppChat(phone: string = SUPPORT_WHATSAPP_NUMBER, text: string = ""): void {
  if (typeof window === "undefined") return;

  const cleanPhone = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(text);

  if (isMobileDevice()) {
    // wa.me universal link opens the native app seamlessly on iOS & Android
    window.open(`https://wa.me/${cleanPhone}${encoded ? `?text=${encoded}` : ""}`, "_blank");
    return;
  }

  // Desktop:
  const appProtocolUrl = `whatsapp://send?phone=${cleanPhone}${encoded ? `&text=${encoded}` : ""}`;
  const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}${encoded ? `&text=${encoded}` : ""}`;

  let appOpened = false;
  const handleBlur = () => {
    appOpened = true;
    window.removeEventListener("blur", handleBlur);
  };

  window.addEventListener("blur", handleBlur);

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = appProtocolUrl;
  document.body.appendChild(iframe);

  setTimeout(() => {
    window.removeEventListener("blur", handleBlur);
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }

    if (!appOpened && !document.hidden) {
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }
  }, 1200);
}
