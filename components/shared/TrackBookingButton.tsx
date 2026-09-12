"use client";

import { useState } from "react";
import { PackageSearch } from "lucide-react";
import { TranslatedText } from "@/components/shared/TranslatedText";
import { TrackBookingModal } from "@/components/customer/TrackBookingModal";

export function TrackBookingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-all"
      >
        <PackageSearch className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          <TranslatedText tKey="track_booking" defaultText="Track Booking" />
        </span>
      </button>

      <TrackBookingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
