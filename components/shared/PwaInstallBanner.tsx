"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Bell, CheckCircle2, Share, PlusSquare } from "lucide-react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type PwaRole = "admin" | "installer" | "partner" | "salesperson" | "delivery" | "customer";

interface PwaInstallBannerProps {
  role?: PwaRole;
  className?: string;
}

const ROLE_CONFIGS: Record<PwaRole, { title: string; subtitle: string; badge: string; color: string }> = {
  admin: {
    title: "Install TEAM Admin App",
    subtitle: "Real-time revenue pulse, live job alerts & dispatch control on your home screen.",
    badge: "Admin Command",
    color: "from-red-500 to-rose-600",
  },
  installer: {
    title: "Install Field Ops App",
    subtitle: "Today's job route, BOM hardware checklist & daily wallet earnings at your fingertips.",
    badge: "Technician Mode",
    color: "from-amber-500 to-orange-600",
  },
  partner: {
    title: "Install Promoter & Partner App",
    subtitle: "Instant lead commission alerts, daily payout tracker & 1-tap WhatsApp promo posters.",
    badge: "Partner Portal",
    color: "from-emerald-500 to-teal-600",
  },
  salesperson: {
    title: "Install Sales Command App",
    subtitle: "Instant hot lead alerts, 1-tap customer dialing & daily target progress in your pocket.",
    badge: "Sales Force",
    color: "from-blue-500 to-indigo-600",
  },
  delivery: {
    title: "Install Delivery Pass App",
    subtitle: "Live dispatch notifications, 4-digit OTP handover & customer route map.",
    badge: "Delivery Hub",
    color: "from-sky-500 to-cyan-600",
  },
  customer: {
    title: "Install CCTVQuotation App",
    subtitle: "Track your installation status, quotation PDF, and 3-Year warranty certificates.",
    badge: "Fast & Offline",
    color: "from-blue-600 to-cyan-600",
  },
};

export function PwaInstallBanner({ role = "customer", className = "" }: PwaInstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [deviceType, setDeviceType] = useState<"desktop" | "tablet" | "mobile">("mobile");
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.customer;

  useEffect(() => {
    // 1. Check if already installed & running standalone
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (standaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Check dismissal storage (7-day mute)
    const dismissKey = `pwa_dismissed_${role}`;
    const dismissedUntil = localStorage.getItem(dismissKey);
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsDismissed(true);
      return;
    }

    setIsDismissed(false);

    // 3. Detect Device Form Factor
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPad = /ipad/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isTablet = isIPad || (/android/.test(userAgent) && !/mobile/.test(userAgent));
    const isMobile = /mobile|iphone|ipod|android/.test(userAgent) && !isTablet;
    const isDesktop = !isMobile && !isTablet;

    if (isDesktop) setDeviceType("desktop");
    else if (isTablet) setDeviceType("tablet");
    else setDeviceType("mobile");

    // Detect iOS
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) || isIPad;
    setIsIOS(isAppleDevice);

    // 4. Listen for Chrome/Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [role]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 7 days
    const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(`pwa_dismissed_${role}`, nextWeek.toString());
  };

  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-4 sm:p-5 shadow-xl border border-white/10 ${className}`}>
      {/* Background Accent Glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: App Icon & Copy */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0 w-12 h-12 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center">
            <Image
              src="/icon-192x192.png"
              alt="App Icon"
              width={40}
              height={40}
              className="rounded-lg object-contain"
            />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-zinc-900" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold tracking-tight text-white">
                {deviceType === "desktop"
                  ? config.title.replace("Mobile App", "Desktop App").replace("App", "Desktop App")
                  : deviceType === "tablet"
                  ? config.title.replace("Mobile App", "Tablet App").replace("App", "Tablet App")
                  : config.title}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-white/10 text-zinc-200 border border-white/15">
                {deviceType === "desktop" ? "Desktop Software" : deviceType === "tablet" ? "Tablet Mode" : config.badge}
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-snug max-w-xl">
              {deviceType === "desktop"
                ? "Dedicated taskbar window, zero browser tab clutter & real-time dispatch alerts on your PC/Mac."
                : deviceType === "tablet"
                ? "Full-screen showroom presentation canvas with side-by-side camera clarity comparisons."
                : config.subtitle}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-0.5">
              {deviceType === "desktop" ? (
                <>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Pinned to Taskbar
                  </span>
                  <span className="flex items-center gap-1">
                    <Bell className="w-3 h-3 text-blue-400" /> Audio Chimes
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-amber-400" /> Standalone Window
                  </span>
                </>
              ) : deviceType === "tablet" ? (
                <>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Kiosk & Showroom Mode
                  </span>
                  <span className="flex items-center gap-1">
                    <Bell className="w-3 h-3 text-blue-400" /> Touch Optimized
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-amber-400" /> Split-View Ready
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> &lt;1MB Install
                  </span>
                  <span className="flex items-center gap-1">
                    <Bell className="w-3 h-3 text-blue-400" /> Live Push Alerts
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-amber-400" /> Offline Ready
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-2 sm:pt-0 border-t border-white/10 sm:border-t-0">
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            title="Dismiss for 7 days"
          >
            Later
          </button>
          <button
            onClick={handleInstallClick}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        </div>
      </div>

      {/* iOS Installation Instruction Dropdown */}
      {showIOSGuide && (
        <div className="mt-4 pt-3 border-t border-white/10 text-xs text-zinc-200 bg-white/5 -mx-4 -mb-4 p-4 rounded-b-2xl">
          <p className="font-semibold text-white mb-2 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-sky-400" /> How to install on iPhone / iPad:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-zinc-300">
            <li>
              Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> <strong>Share</strong> button at the bottom of Safari.
            </li>
            <li>
              Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" /> <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
            </li>
            <li>Tap <strong>&ldquo;Add&rdquo;</strong> in the top-right corner. It will appear on your phone screen like a real app!</li>
          </ol>
          <button
            onClick={() => setShowIOSGuide(false)}
            className="mt-3 text-[11px] font-semibold text-sky-400 hover:underline"
          >
            Got it, close
          </button>
        </div>
      )}
    </div>
  );
}
