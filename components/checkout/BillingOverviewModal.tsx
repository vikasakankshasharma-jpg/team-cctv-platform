"use client";

import { useTranslation } from "@/hooks/useTranslation";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  User, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Receipt, 
  CheckCircle2, 
  X, 
  Sparkles,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

import { LocationPickerModal } from "./LocationPickerModal";

export interface BillingFormData {
  is_business: boolean;
  company_name: string;
  gstin: string;
  customer_name: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  state_code: string;
  pincode: string;
  coordinates?: { lat: number; lng: number };
  google_maps_link?: string;
}

interface BillingOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (data: BillingFormData, paymentType: "advance" | "advance_500" | "advance_500_cod" | "full" | "full_discount" | "emi") => Promise<void>;
  initialData?: Partial<BillingFormData>;
  quoteTotal?: number;
  advanceAmount?: number;
  paymentType?: "advance" | "advance_500" | "advance_500_cod" | "full" | "full_discount" | "emi";
  isSubmitting?: boolean;
  mode?: "checkout" | "edit";
}

const sanitizeAddress = (val?: string) => {
  if (!val) return "";
  const lower = val.trim().toLowerCase();
  if (lower === "address pending" || lower.includes("address pending") || lower === "pending") {
    return "";
  }
  if (/^\d{6}$/.test(val.trim())) {
    return "";
  }
  return val.trim();
};

const INDIAN_STATES = [
  { code: "08", name: "Rajasthan" },
  { code: "07", name: "Delhi" },
  { code: "06", name: "Haryana" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "27", name: "Maharashtra" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "29", name: "Karnataka" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "19", name: "West Bengal" },
  { code: "10", name: "Bihar" },
];

export function BillingOverviewModal({
  isOpen,
  onClose,
  onConfirmPayment,
  initialData,
  quoteTotal = 0,
  advanceAmount = 0,
  paymentType = "advance",
  isSubmitting = false,
  mode = "checkout",
}: BillingOverviewModalProps) {
  const { t } = useTranslation();
  const [isBusiness, setIsBusiness] = useState(initialData?.is_business ?? false);
  const [companyName, setCompanyName] = useState(initialData?.company_name || "");
  const [gstin, setGstin] = useState(initialData?.gstin || "");
  const [customerName, setCustomerName] = useState(initialData?.customer_name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [addressLine1, setAddressLine1] = useState(sanitizeAddress(initialData?.address_line1));
  const [addressLine2, setAddressLine2] = useState(initialData?.address_line2 || "");
  const [city, setCity] = useState(initialData?.city || "Jaipur");
  const [state, setState] = useState(initialData?.state || "Rajasthan");
  const [stateCode, setStateCode] = useState(initialData?.state_code || "08");
  const [pincode, setPincode] = useState(initialData?.pincode || "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(initialData?.coordinates);
  useEffect(() => {
    if (coords && !addressLine1.trim()) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
             // Simplify address slightly
             const parts = data.display_name.split(", ");
             const shortAddress = parts.slice(0, Math.min(4, parts.length)).join(", ");
             setAddressLine1(shortAddress);
          }
        })
        .catch(err => console.error("Reverse geocoding failed", err));
    }
  }, [coords, addressLine1]);
  const [googleMapsLink, setGoogleMapsLink] = useState<string>(initialData?.google_maps_link || "");
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [gstError, setGstError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [pincodeError, setPincodeError] = useState("");

  useEffect(() => {
    if (initialData) {
      if (initialData.is_business !== undefined) setIsBusiness(initialData.is_business);
      if (initialData.company_name) setCompanyName(initialData.company_name);
      if (initialData.gstin) setGstin(initialData.gstin);
      if (initialData.customer_name) setCustomerName(initialData.customer_name);
      if (initialData.phone) setPhone(initialData.phone);
      if (initialData.email) setEmail(initialData.email);
      if (initialData.address_line1 !== undefined) setAddressLine1(sanitizeAddress(initialData.address_line1));
      if (initialData.address_line2) setAddressLine2(initialData.address_line2);
      if (initialData.city) setCity(initialData.city);
      if (initialData.state) setState(initialData.state);
      if (initialData.state_code) setStateCode(initialData.state_code);
      if (initialData.pincode) setPincode(initialData.pincode);
      if (initialData.coordinates) setCoords(initialData.coordinates);
      if (initialData.google_maps_link) setGoogleMapsLink(initialData.google_maps_link);
    }
  }, [initialData]);

  // GSTIN Validation & State Detection
  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
    setGstin(val);

    if (val.length === 15) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(val)) {
        setGstError("Invalid GSTIN structure. Example: 08AABCT1234A1ZS");
      } else {
        setGstError("");
        const prefix = val.substring(0, 2);
        const matchedState = INDIAN_STATES.find(s => s.code === prefix);
        if (matchedState) {
          setState(matchedState.name);
          setStateCode(matchedState.code);
        }
      }
    } else if (val.length > 0) {
      setGstError("GSTIN must be 15 alphanumeric characters");
    } else {
      setGstError("");
    }
  };

  const gstSavings = quoteTotal > 0 ? Math.round(quoteTotal - (quoteTotal / 1.18)) : 0;
  let amountToCharge = quoteTotal;
  if (paymentType === "advance") amountToCharge = advanceAmount;
  if (paymentType === "advance_500") amountToCharge = 500;
  if (paymentType === "full_discount") amountToCharge = Math.round(quoteTotal * 0.98);
  const balanceDue = Math.max(0, quoteTotal - amountToCharge);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setNameError("");
    setPhoneError("");
    setAddressError("");
    setPincodeError("");

    if (!customerName.trim()) {
      setNameError("Please enter your name");
      toast.error("Please enter your name / contact person name");
      document.getElementById("billing-name-input")?.focus();
      return;
    }

    if (!phone.trim() || phone.length < 10) {
      setPhoneError("Please enter a valid 10-digit mobile number");
      toast.error("Please enter a valid 10-digit mobile number");
      document.getElementById("billing-phone-input")?.focus();
      return;
    }

    if (isBusiness) {
      if (!companyName.trim()) {
        toast.error("Please enter your Firm / Company Legal Name for GST invoice");
        return;
      }
      if (!gstin.trim()) {
        toast.error("Please enter your 15-digit GSTIN number");
        return;
      }
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstin)) {
        toast.error("Please enter a valid 15-digit GSTIN");
        return;
      }
    }

    if (!addressLine1.trim() || addressLine1.trim().toLowerCase().includes("address pending") || addressLine1.trim().toLowerCase() === "pending") {
      setAddressError("Please enter your flat/building/shop number and street name");
      toast.error("Please enter your installation street address");
      const el = document.getElementById("billing-address-input");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
      return;
    }

    if (!pincode.trim() || pincode.length < 6) {
      setPincodeError("Please enter a valid 6-digit Pincode");
      toast.error("Please enter a valid 6-digit Pincode");
      document.getElementById("billing-pincode-input")?.focus();
      return;
    }

    const payload: BillingFormData = {
      is_business: isBusiness,
      company_name: isBusiness ? companyName.trim() : "",
      gstin: isBusiness ? gstin.trim().toUpperCase() : "",
      customer_name: customerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim(),
      city: city.trim() || "Jaipur",
      state: state || "Rajasthan",
      state_code: stateCode || "08",
      pincode: pincode.trim(),
      coordinates: coords,
      google_maps_link: googleMapsLink || (coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : ""),
    };

    onConfirmPayment(payload, paymentType);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="relative w-full max-w-2xl bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh] h-auto overscroll-contain"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold">
                  {mode === "edit" ? "Edit Billing & GST Details" : "Billing & GST Invoice Details"}
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {mode === "edit" 
                  ? "Update your invoice recipient details for this booking" 
                  : "Review your billing information before confirming installation booking"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
            {/* Account Type Selector */}
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                Invoice Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsBusiness(false)}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${
                    !isBusiness 
                      ? "border-emerald-600 bg-emerald-50/50 text-slate-900 shadow-sm" 
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${!isBusiness ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{t("modal_personal")}</div>
                    <div className="text-xs text-slate-500">{t("modal_individual_tax")}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBusiness(true)}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${
                    isBusiness 
                      ? "border-blue-600 bg-blue-50/50 text-slate-900 shadow-sm" 
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${isBusiness ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{t("modal_business")}</div>
                    <div className="text-xs text-slate-500">{t("modal_claim_18")}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* B2B Highlight Banner */}
            {isBusiness && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3"
              >
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950">
                  <span className="font-bold">GST Input Credit Benefit:</span> You can claim up to{" "}
                  <span className="font-bold text-blue-700">₹{gstSavings.toLocaleString("en-IN")}</span> back as Input Tax Credit (ITC) on your GST return.
                </div>
              </motion.div>
            )}

            {/* Business Specific Fields */}
            {isBusiness && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
              >
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    Company / Firm Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={isBusiness}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. ABC Technologies Pvt Ltd / Sharma Enterprises"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>15-Digit GSTIN Number <span className="text-rose-500">*</span></span>
                    <span className="text-[11px] text-slate-500">Format: 08AABCT1234A1ZS</span>
                  </label>
                  <input
                    type="text"
                    required={isBusiness}
                    maxLength={15}
                    value={gstin}
                    onChange={handleGstinChange}
                    placeholder="08XXXXXXXXXX1ZX"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-wider focus:outline-none focus:ring-2 bg-white uppercase ${
                      gstError ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-blue-500"
                    }`}
                  />
                  {gstError && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {gstError}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Contact Person & Address */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    {isBusiness ? "Contact Person Name" : "Full Name"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="billing-name-input"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    placeholder="e.g. Vikas Sharma"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${
                      nameError ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20" : "border-slate-300 focus:ring-emerald-500"
                    }`}
                  />
                  {nameError && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {nameError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="billing-phone-input"
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10));
                      if (phoneError) setPhoneError("");
                    }}
                    placeholder="9876543210"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${
                      phoneError ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20" : "border-slate-300 focus:ring-emerald-500"
                    }`}
                  />
                  {phoneError && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Email Address (For Tax Invoice PDF)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <span>{isBusiness ? "Registered Office / Installation Address" : "Installation Street Address"}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm ${
                      coords
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{coords ? "📍 Location Pinned (Change)" : "📍 Pin on Map"}</span>
                  </button>
                </div>

                {coords && (
                  <div className="mb-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium text-[11px]">
                        GPS Pin Locked ({coords.lat.toFixed(4)}&deg;N, {coords.lng.toFixed(4)}&deg;E)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline shrink-0 ml-2"
                    >
                      Edit Pin
                    </button>
                  </div>
                )}

                <input
                  id="billing-address-input"
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => {
                    setAddressLine1(e.target.value);
                    if (addressError) setAddressError("");
                  }}
                  placeholder="Flat/House/Shop No, Building Name, Street / Colony"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${
                    addressError ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20" : "border-slate-300 focus:ring-emerald-500"
                  }`}
                />
                {addressError && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {addressError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">{t("modal_city")}</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Jaipur"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">{t("modal_state")}</label>
                  <select
                    value={state}
                    onChange={(e) => {
                      const selected = INDIAN_STATES.find(s => s.name === e.target.value);
                      setState(e.target.value);
                      if (selected) setStateCode(selected.code);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="billing-pincode-input"
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                      setPincode(val);
                      if (pincodeError) setPincodeError("");
                      if (val.length === 6) {
                        fetch(`/api/pincode/${val}`)
                          .then(res => res.json())
                          .then(data => {
                            if (data.district || data.city) setCity(data.district || data.city);
                            if (data.state) {
                              setState(data.state);
                              const matched = INDIAN_STATES.find(s => s.name.toLowerCase() === data.state.toLowerCase());
                              if (matched) setStateCode(matched.code);
                            }
                            if (data.lat && data.lng && !coords) {
                              setCoords({ lat: data.lat, lng: data.lng });
                            }
                          })
                          .catch(() => {});
                      }
                    }}
                    placeholder="302001"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${
                      pincodeError ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20" : "border-slate-300 focus:ring-emerald-500"
                    }`}
                  />
                  {pincodeError && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {pincodeError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Commercial Summary Box */}
            {quoteTotal > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>{t("modal_quote_total")}</span>
                  <span className="font-semibold text-white">₹{quoteTotal.toLocaleString("en-IN")}</span>
                </div>
                {mode === "checkout" ? (
                  <>
                    <div className="flex justify-between text-sm font-bold border-t border-slate-800 pt-2 text-emerald-400">
                      <span>Amount to Pay Now ({
                        paymentType.includes("advance") ? "Advance Booking" : 
                        paymentType === "full_discount" ? "Full Payment (2% Off)" : 
                        paymentType === "emi" ? "EMI Processing" : "Full Payment"
                      }):</span>
                      <span>₹{amountToCharge.toLocaleString("en-IN")}</span>
                    </div>
                    {paymentType.includes("advance") && (
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{t("modal_balance_due")}</span>
                        <span>₹{balanceDue.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between text-xs font-semibold text-emerald-400 border-t border-slate-800 pt-2">
                    <span>Payment Status:</span>
                    <span>Paid / Confirmed Online</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-1/3 py-3 px-4 rounded-2xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
              >
                {mode === "edit" ? "Cancel" : t("modal_back_to_quote")}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-2/3 py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === "edit" 
                        ? "Save Billing & GST Details" 
                        : paymentType === "full_discount"
                        ? `Pay ₹${amountToCharge.toLocaleString("en-IN")} (2% Off Applied)`
                        : paymentType.includes("advance")
                        ? `Book Slot for ₹${amountToCharge.toLocaleString("en-IN")}`
                        : `Confirm & Pay ₹${amountToCharge.toLocaleString("en-IN")}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Location Pinning Map Modal */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialPincode={pincode || "302001"}
        initialCoords={coords}
        onConfirm={(newCoords, mapUrl, meta) => {
          setCoords(newCoords);
          setGoogleMapsLink(mapUrl);
          if (meta?.formattedAddress) {
            setAddressLine1(meta.formattedAddress);
            setAddressError("");
          }
          if (meta?.pincode) {
            setPincode(meta.pincode);
            setPincodeError("");
          }
          if (meta?.locality && (!city || city === "Jaipur")) {
            setCity(meta.locality);
          }
        }}
      />
    </AnimatePresence>
  );
}
