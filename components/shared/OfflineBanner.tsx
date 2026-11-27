"use client";

import { useEffect, useRef } from "react";
import { WifiOff, RefreshCw, CloudCheck } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { useTranslation } from "@/hooks/useTranslation";
import { offlineStorage } from "@/lib/offline-storage";
import { toast } from "sonner";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      // Reconnected! Auto-sync queued items
      wasOffline.current = false;
      offlineStorage.syncPendingActions().then((result) => {
        if (result.synced > 0) {
          toast.success("🟢 Reconnected to Network", {
            description: `Auto-synced ${result.synced} offline update${result.synced > 1 ? "s" : ""} to the cloud.`,
          });
        }
      });
    }
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-600 text-white py-2 px-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-lg animate-in slide-in-from-top duration-300">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{t("off_banner", "You are offline. Checklist & field notes are safely saved locally and will auto-sync on reconnect.")}</span>
    </div>
  );
}
