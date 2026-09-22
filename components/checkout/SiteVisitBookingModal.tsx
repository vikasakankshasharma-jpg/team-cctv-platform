"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  ArrowRight,
  MessageCircle,
  FileCheck2,
  Sparkles,
  Camera
} from "lucide-react";
import { toast } from "sonner";

interface SiteVisitBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  quoteId?: string;
  customerName?: string;
  customerMobile?: string;
  initialAddress?: string;
  onBookingSuccess?: () => void;
}

const TIME_SLOTS = [
  { id: "slot-morning", label: "Morning (10:00 AM - 01:00 PM)", icon: "🌅" },
  { id: "slot-afternoon", label: "Afternoon (01:00 PM - 05:00 PM)", icon: "🌇" },
  { id: "slot-evening", label: "Evening (05:00 PM - 08:00 PM)", icon: "🌆" },
];

export function SiteVisitBookingModal({
  isOpen,
  onClose,
  leadId,
  quoteId,
  customerName = "",
  customerMobile = "",
  initialAddress = "",
  onBookingSuccess,
}: SiteVisitBookingModalProps) {
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const getDayAfterDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTomorrowDate());
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM - 01:00 PM");
  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerMobile);
  const [address, setAddress] = useState(initialAddress);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!address.trim()) {
      toast.error("Please enter site address for the survey");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          quote_id: quoteId,
          customer_name: name.trim(),
          customer_mobile: phone.trim(),
          address: address.trim(),
          preferred_date: selectedDate,
          time_slot: selectedSlot,
          special_notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBookingId(data.data?.id || `VISIT-${new Date().getFullYear()}`);
        setBookingConfirmed(true);
        toast.success("Free Site Survey booked successfully!");
        if (onBookingSuccess) onBookingSuccess();
      } else {
        toast.error(data.message || data.error || "Failed to book site survey. Please try again.");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error("An error occurred while booking your survey.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const whatsappMessage = `Hi TEAM CCTV, I have booked a Free Physical Site Survey for my premises.\n\nLead ID: ${leadId}\nDate: ${selectedDate}\nTime Slot: ${selectedSlot}\nAddress: ${address}`;
  const whatsappUrl = `https://wa.me/917357612865?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                <Camera className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">Book Free Site Survey</h3>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    100% Free
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  Our certified engineer visits your location to inspect camera angles & wiring paths
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-purple-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {bookingConfirmed ? (
            /* Confirmation Screen */
            <div className="p-6 sm:p-8 space-y-6 text-center text-slate-800 overflow-y-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-slate-900">Site Survey Appointment Confirmed!</h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Our installation engineer has been assigned and will arrive at your premises as scheduled.
                </p>
              </div>

              {/* Appointment Card */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-left space-y-3">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Booking ID</span>
                  <span className="font-mono font-bold text-slate-900">{bookingId}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Scheduled Date</span>
                  <span className="font-bold text-purple-700">{selectedDate}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Time Slot</span>
                  <span className="font-bold text-slate-900">{selectedSlot}</span>
                </div>
                <div className="flex justify-between items-start text-xs">
                  <span className="text-slate-500 font-medium shrink-0">Site Address</span>
                  <span className="text-right text-slate-900 font-medium pl-4">{address}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Connect with Technician on WhatsApp
                </a>

                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-2xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-colors"
                >
                  Done / Return to Quotation
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="flex-1 min-h-0 p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-800">
              
              {/* Trust Value Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-purple-50/80 rounded-2xl border border-purple-100 text-center">
                <div className="text-[11px] font-bold text-purple-900">
                  ✨ Zero Charges
                  <p className="text-[10px] text-purple-600 font-normal">100% Free Visit</p>
                </div>
                <div className="text-[11px] font-bold text-purple-900 border-x border-purple-200">
                  📐 Angle Testing
                  <p className="text-[10px] text-purple-600 font-normal">Check blindspots</p>
                </div>
                <div className="text-[11px] font-bold text-purple-900">
                  🔒 No Advance
                  <p className="text-[10px] text-purple-600 font-normal">Pay after approval</p>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Select Preferred Date <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(getTomorrowDate())}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                      selectedDate === getTomorrowDate()
                        ? "border-purple-600 bg-purple-50 text-purple-900 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                    }`}
                  >
                    <span className="block text-[10px] text-slate-400 font-normal">Tomorrow</span>
                    {new Date(getTomorrowDate()).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDate(getDayAfterDate())}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                      selectedDate === getDayAfterDate()
                        ? "border-purple-600 bg-purple-50 text-purple-900 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                    }`}
                  >
                    <span className="block text-[10px] text-slate-400 font-normal">Day After</span>
                    {new Date(getDayAfterDate()).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </button>

                  <div className="relative">
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full h-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Select Preferred Time Slot <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedSlot.includes(slot.label.split(" ")[0]);
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot.label.replace(/^.*?\((.*?)\)/, "$1"))}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all text-left text-xs ${
                          isSelected || selectedSlot === slot.label.replace(/^.*?\((.*?)\)/, "$1")
                            ? "border-purple-600 bg-purple-50/60 text-purple-950 font-bold shadow-sm"
                            : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{slot.icon}</span>
                          <span>{slot.label}</span>
                        </div>
                        {(isSelected || selectedSlot === slot.label.replace(/^.*?\((.*?)\)/, "$1")) && (
                          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact & Location Details */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Contact Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Site Visit / Installation Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Shop No, Street, Area, Landmark"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Special Site Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. 2-floor house, tall ladder needed, wiring in conduit"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-1/3 py-3 px-4 rounded-2xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-2/3 py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 hover:from-purple-600 hover:to-slate-800 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Confirm Free Site Survey</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
