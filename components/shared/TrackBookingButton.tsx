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
        className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-blue-600 transition-colors"
      >
        <PackageSearch className="w-4 h-4" />
        <span className="hidden sm:inline">
          <TranslatedText tKey="track_booking" defaultText="Track Booking" />
        </span>
        <span className="sm:hidden">
          <TranslatedText tKey="track" defaultText="Track" />
        </span>
      </button>

      <TrackBookingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
