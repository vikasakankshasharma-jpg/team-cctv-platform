/**
 * Universal WhatsApp Helper
 * Handles smart redirection:
 * - On Mobile (iOS / Android): Opens the installed native app directly via `whatsapp://send?phone=...`
 *   (or universal `wa.me` links) with top-level user activation.
 * - On Desktop (Windows / Mac / Linux):
 *   1. Launches the local desktop application directly via top-level `whatsapp://send?phone=...`
 *      navigation (never via hidden iframe, which modern browsers block).
 *   2. Falls back cleanly via listener detection if the desktop app does not open.
 */

export const SUPPORT_WHATSAPP_NUMBER =
  (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "917357612865").replace(/\D/g, "") || "917357612865";

export const OTP_WHATSAPP_SENDER_NUMBER =
  (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919982549315").replace(/\D/g, "") || "919982549315";

export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIpadOs = navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua);
  return (
    isIpadOs ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  );
}

/**
 * Builds a valid custom-scheme URI (`whatsapp://send?...`) that Android Intent filters,
 * iOS URL handlers, and Desktop WhatsApp clients actually register.
 * Bare `whatsapp://` (empty host) is ignored on Android and many browsers.
 */
export function getWhatsAppAppUrl(
  phone: string = OTP_WHATSAPP_SENDER_NUMBER,
  text: string = ""
): string {
  const cleanPhone = String(phone).replace(/\D/g, "") || OTP_WHATSAPP_SENDER_NUMBER;
  const encodedText = text ? `&text=${encodeURIComponent(text)}` : "";
  return `whatsapp://send?phone=${cleanPhone}${encodedText}`;
}

export function getWhatsAppUniversalUrl(
  phone: string = OTP_WHATSAPP_SENDER_NUMBER,
  text: string = ""
): string {
  const cleanPhone = String(phone).replace(/\D/g, "") || OTP_WHATSAPP_SENDER_NUMBER;
  const encoded = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${cleanPhone}${encoded}`;
}

function trackWhatsAppLaunch(onFallback?: () => void, timeoutMs: number = 1500): void {
  if (typeof window === "undefined" || typeof document === "undefined" || !onFallback) return;

  let appOpened = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    window.removeEventListener("blur", markOpened);
    window.removeEventListener("pagehide", markOpened);
    document.removeEventListener("visibilitychange", handleVisibility);
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const markOpened = () => {
    appOpened = true;
    cleanup();
  };

  const handleVisibility = () => {
    if (document.hidden) markOpened();
  };

  window.addEventListener("blur", markOpened);
  window.addEventListener("pagehide", markOpened);
  document.addEventListener("visibilitychange", handleVisibility);

  timer = setTimeout(() => {
    cleanup();
    if (!appOpened && !document.hidden) {
      onFallback();
    }
  }, timeoutMs);
}

export interface OpenWhatsAppAppOptions {
  phone?: string;
  /** Set false when triggered from a native `<a href="whatsapp://send?...">` element. */
  navigate?: boolean;
  /** Called if browser stays focused/visible after launch attempt (e.g. app not installed). */
  onFallback?: () => void;
}

/**
 * Opens the installed WhatsApp app (Mobile or Desktop) straight into the OTP chat.
 * Uses top-level protocol navigation instead of a hidden iframe so Chrome/Edge/Firefox/Safari
 * and Android/iOS permit the OS app launch.
 */
export function openWhatsAppApp(options: OpenWhatsAppAppOptions = {}): void {
  if (typeof window === "undefined") return;

  const targetPhone = options.phone || OTP_WHATSAPP_SENDER_NUMBER;
  const protocolUrl = getWhatsAppAppUrl(targetPhone);

  const fallback =
    options.onFallback ??
    (() => {
      if (isMobileDevice()) {
        window.location.href = getWhatsAppUniversalUrl(targetPhone);
      } else {
        window.open("https://web.whatsapp.com", "_blank", "noopener,noreferrer");
      }
    });

  trackWhatsAppLaunch(fallback, 1600);

  if (options.navigate !== false) {
    window.location.href = protocolUrl;
  }
}

/**
 * Initiates a pre-filled chat with a number (e.g. customer support or sharing a quote).
 * - On Mobile: Opens `https://wa.me/...` universal link cleanly with user activation.
 * - On Desktop: Attempts top-level `whatsapp://send?...` first, falling back to WhatsApp Web.
 */
export function openWhatsAppChat(phone: string = SUPPORT_WHATSAPP_NUMBER, text: string = ""): void {
  if (typeof window === "undefined") return;

  const cleanPhone = String(phone).replace(/\D/g, "") || SUPPORT_WHATSAPP_NUMBER;

  if (isMobileDevice()) {
    window.open(getWhatsAppUniversalUrl(cleanPhone, text), "_blank", "noopener,noreferrer");
    return;
  }

  const appProtocolUrl = getWhatsAppAppUrl(cleanPhone, text);
  const encoded = encodeURIComponent(text);
  const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}${encoded ? `&text=${encoded}` : ""}`;

  trackWhatsAppLaunch(() => {
    window.open(webUrl, "_blank", "noopener,noreferrer");
  }, 1500);

  window.location.href = appProtocolUrl;
}
