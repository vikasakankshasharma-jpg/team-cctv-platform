"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, Check, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface PwaNotificationPromptProps {
  role?: string;
  userId?: string;
  userName?: string;
  className?: string;
}

export function PwaNotificationPrompt({
  role = "general",
  userId,
  userName,
  className = "",
}: PwaNotificationPromptProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    // If permission already granted or denied, don't show the prompt
    if (Notification.permission !== "default") {
      setIsDismissed(true);
      return;
    }

    // Check localStorage dismissal
    const dismissed = localStorage.getItem("pwa_notif_prompt_dismissed");
    if (dismissed && Number(dismissed) > Date.now()) {
      setIsDismissed(true);
      return;
    }

    setIsDismissed(false);
  }, []);

  const handleEnableAlerts = async () => {
    setIsSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === "granted") {
        toast.success("🔔 Real-time notifications enabled!", {
          description: "You will now receive instant alerts for new leads, jobs, and schedule updates.",
        });

        // Register push subscription if Service Worker is ready
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          
          let subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
            // Subscribe with basic configuration
            try {
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: undefined, // Optional VAPID key
              });
            } catch (err) {
              console.log("Standard push subscribe fallback, using notification API directly", err);
            }
          }

          // Register in Firestore via backend
          await fetch("/api/notifications/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscription: subscription ? subscription.toJSON() : null,
              role,
              userId: userId || "anonymous",
              userName: userName || "Staff",
              userAgent: navigator.userAgent,
            }),
          }).catch((err) => console.warn("Could not register push subscription in DB", err));

          // Trigger a sample welcome notification to verify delivery
          if (registration.showNotification) {
            registration.showNotification("🎉 Alerts Activated!", {
              body: "You are now tuned into real-time business updates and daily briefings.",
              icon: "/icon-192x192.png",
              badge: "/favicon-32x32.png",
            });
          }
        }

        setIsDismissed(true);
      } else {
        toast.error("Notification permission denied", {
          description: "You can enable notifications anytime in your browser site settings.",
        });
        setIsDismissed(true);
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast.error("Failed to enable notifications");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 5 days
    const nextFiveDays = Date.now() + 5 * 24 * 60 * 60 * 1000;
    localStorage.setItem("pwa_notif_prompt_dismissed", nextFiveDays.toString());
  };

  if (!isSupported || isDismissed || permission !== "default") {
    return null;
  }

  return (
    <div className={`flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-950 dark:text-amber-100 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
          <BellRing className="w-4 h-4 animate-bounce" />
        </div>
        <div className="text-xs">
          <p className="font-bold leading-tight text-amber-900 dark:text-amber-200">
            Never miss a job or daily briefing alert
          </p>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-normal">
            Turn on real-time mobile push notifications for instant dispatch, OTP, and target alerts.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDismiss}
          className="text-xs text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          Not now
        </button>
        <button
          onClick={handleEnableAlerts}
          disabled={isSubscribing}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-xs active:scale-95 transition-all disabled:opacity-50"
        >
          <Bell className="w-3.5 h-3.5" />
          {isSubscribing ? "Activating..." : "Enable Alerts"}
        </button>
      </div>
    </div>
  );
}
