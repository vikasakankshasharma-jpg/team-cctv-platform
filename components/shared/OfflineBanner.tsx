"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-bold shadow-lg animate-in slide-in-from-top duration-300">
      <WifiOff className="w-4 h-4" />
      You are offline. Some features may not work.
    </div>
  );
}
