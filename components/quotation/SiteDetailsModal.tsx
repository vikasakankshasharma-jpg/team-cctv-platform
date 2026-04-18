"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Navigation, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import type { Address } from "@/types";

interface SiteDetailsModalProps {
  onConfirm: (address: Address) => void;
  onClose: () => void;
  initialPincode?: string;
}

export function SiteDetailsModal({ onConfirm, onClose, initialPincode = "" }: SiteDetailsModalProps) {
  const [pincode, setPincode] = useState(initialPincode);
  const [landmark1, setLandmark1] = useState("");
  const [landmark2, setLandmark2] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [coords, setCoords] = useState({ lat: 19.0760, lng: 72.8777 });
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (pincode.length === 6) {
      const num = parseInt(pincode);
      setCoords({
        lat: 19.0760 + (num % 100) * 0.001,
        lng: 72.8777 + (num % 50) * 0.001
      });
      setIsMapReady(true);
    } else {
      setIsMapReady(false);
    }
  }, [pincode]);

  const handleConfirm = () => {
    onConfirm({
      pincode,
      landmark1,
      landmark2,
      full_address: fullAddress,
      coordinates: coords
    });
  };

  const isValid = pincode.length === 6 && landmark1.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full sm:max-w-2xl bg-white sm:rounded-[40px] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-bottom-4 duration-300 z-10">

        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />

        {/* Header */}
        <div className="px-8 pt-8 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Site Capture</span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">Pinpoint Your Site</h2>
            <p className="text-sm text-zinc-400 font-medium mt-1">Required for PDF blueprint & installation dispatch.</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors shrink-0 mt-1"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Body — two column */}
        <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT: Form */}
          <div className="space-y-4">

            {/* Pincode */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Area Pincode *</label>
              <div className="relative">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="400001"
                  className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl pl-11 pr-4 py-3.5 outline-none transition-all font-mono font-black text-zinc-900 tracking-[0.3em] placeholder:text-zinc-300 placeholder:font-normal placeholder:tracking-normal"
                />
                {pincode.length === 6 && (
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Primary Landmark */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Primary Landmark *</label>
              <input
                type="text"
                value={landmark1}
                onChange={(e) => setLandmark1(e.target.value)}
                placeholder="Near Metro, Opp. Temple..."
                className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 outline-none transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-300"
              />
            </div>

            {/* Full Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Full Address</label>
              <textarea
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="Building, Wing, Unit No., Street..."
                rows={2}
                className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 outline-none transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-300 resize-none"
              />
            </div>

            {/* Secondary Landmark */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Secondary Landmark <span className="normal-case tracking-normal font-normal text-zinc-300">(optional)</span></label>
              <input
                type="text"
                value={landmark2}
                onChange={(e) => setLandmark2(e.target.value)}
                placeholder="Above Coffee Shop, Blue Gate..."
                className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 outline-none transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-300"
              />
            </div>
          </div>

          {/* RIGHT: GPS Visualizer */}
          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">GPS Pinpoint</label>
            <div className="flex-1 relative rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200 min-h-[220px]">

              {isMapReady ? (
                <>
                  {/* Animated grid map background */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: "linear-gradient(rgba(59,130,246,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.3) 1px, transparent 1px)",
                      backgroundSize: "28px 28px",
                    }}
                  />
                  {/* Ripple rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border border-blue-300/40 animate-ping absolute" />
                    <div className="w-20 h-20 rounded-full border border-blue-400/30 animate-ping absolute [animation-delay:0.5s]" />
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-400/50 absolute" />
                  </div>
                  {/* Pin */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col items-center -translate-y-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 border-4 border-white shadow-2xl shadow-blue-600/50 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white fill-white" />
                      </div>
                      <div className="w-2 h-4 bg-blue-600/60 rounded-b-full" />
                      <div className="w-4 h-1 bg-zinc-900/10 rounded-full blur-[2px]" />
                    </div>
                  </div>
                  {/* Coords badge */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-white/95 backdrop-blur-sm border border-zinc-100 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[10px] font-black text-zinc-700 tracking-wider">
                        {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-200 flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-zinc-400" />
                  </div>
                  <p className="text-xs font-bold text-zinc-400">Enter your 6-digit pincode<br/>to activate GPS mapping.</p>
                </div>
              )}
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 rounded-2xl border border-zinc-100">
              <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-[10px] font-bold text-zinc-400 leading-snug">
                Your location data is only used for your installation appointment and is never sold.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="text-xs font-black text-zinc-400 hover:text-zinc-600 uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className="group flex items-center gap-3 bg-zinc-900 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-[0.2em] px-8 py-4 rounded-3xl transition-all shadow-xl shadow-zinc-900/10 hover:shadow-blue-500/20 active:scale-95"
          >
            Confirm Site
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}


