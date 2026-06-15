"use client";

import { useState } from "react";
import { Building2, FileText, ChevronRight, UserCheck } from "lucide-react";

interface B2BInfoStepProps {
  cameraCount: number;
  technology: string;
  onConfirm: (data: { company_name: string; gst_number: string }) => void;
  onSkip: () => void;
}

export function B2BInfoStep({ cameraCount, technology, onConfirm, onSkip }: B2BInfoStepProps) {
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [gstError, setGstError] = useState("");

  const validateGST = (value: string) => {
    if (!value) return true; // optional field
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(value.toUpperCase());
  };

  const handleGSTChange = (value: string) => {
    const upper = value.toUpperCase();
    setGstNumber(upper);
    if (upper && !validateGST(upper)) {
      setGstError("Invalid GST format (e.g. 22AAAAA0000A1Z5)");
    } else {
      setGstError("");
    }
  };

  const handleConfirm = () => {
    if (gstNumber && !validateGST(gstNumber)) {
      setGstError("Please enter a valid GST number or leave it blank.");
      return;
    }
    onConfirm({ company_name: companyName, gst_number: gstNumber });
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-8 mb-4">
      {/* Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-[28px] p-7 shadow-[0_8px_30px_-10px_rgba(37,99,235,0.2)]">
        
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-[16px] bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-[18px] font-black text-zinc-900 tracking-tight leading-tight">
              Corporate Installation Detected
            </h3>
            <p className="text-[13px] text-zinc-500 mt-1 font-medium">
              {cameraCount} {technology} cameras — business-grade setup
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white/70 rounded-[18px] p-4 mb-6 border border-blue-100">
          <p className="text-[13px] text-zinc-600 font-medium leading-relaxed">
            We'll generate your <span className="font-black text-zinc-900">full corporate quote</span> instantly.
            Optionally add your company details for a <span className="font-black text-zinc-900">GST invoice</span> — you can always add these later.
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs sm:text-sm font-black text-zinc-500 uppercase tracking-widest mb-2">
              Company / Firm Name <span className="text-zinc-400 font-medium normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Pvt. Ltd."
              className="w-full bg-white border-2 border-zinc-200 focus:border-blue-500 rounded-[16px] px-4 py-3.5 text-[15px] font-semibold text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 placeholder:font-normal"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              GST Number <span className="text-zinc-400 font-medium normal-case tracking-normal">(optional — for GST invoice)</span>
            </label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => handleGSTChange(e.target.value)}
              placeholder="e.g. 22AAAAA0000A1Z5"
              maxLength={15}
              className={`w-full bg-white border-2 rounded-[16px] px-4 py-3.5 text-[15px] font-mono font-semibold text-zinc-900 outline-none transition-colors placeholder:font-sans placeholder:font-normal placeholder:text-zinc-400 ${
                gstError ? "border-red-400 focus:border-red-500" : "border-zinc-200 focus:border-blue-500"
              }`}
            />
            {gstError && (
              <p className="text-[12px] text-red-500 font-medium mt-1.5 ml-1">{gstError}</p>
            )}
            {gstNumber && !gstError && (
              <p className="text-[12px] text-emerald-600 font-medium mt-1.5 ml-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Valid GST format
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs sm:text-sm tracking-[0.2em] rounded-[18px] shadow-[0_8px_20px_-8px_rgba(37,99,235,0.5)] hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            Generate Corporate Quote
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onSkip}
            className="w-full h-11 text-zinc-500 hover:text-zinc-800 font-bold text-[12px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Skip — I'm an individual
          </button>
        </div>
      </div>
    </div>
  );
}
