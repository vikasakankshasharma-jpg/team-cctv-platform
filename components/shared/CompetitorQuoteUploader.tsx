"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { storage } from "@/lib/firebase-client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  ImageIcon,
  ChevronRight,
  ChevronDown,
  Tag,
  Shield,
  Sparkles,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";

export interface SelectedPackageInfo {
  title: string;
  price: number;
  brand?: string;
  resolution?: string;
  cameraCount?: number;
  planType?: string;
  technology?: string;
}

export interface CompetitorQuoteSubmitData {
  competitor_quote_url: string;
  competitor_name?: string;
  competitor_total?: number;
  notes?: string;
  uploaded_by_name: string;
  selected_package_title?: string;
  selected_package_price?: number;
  selected_plan_type?: string;
  selected_technology?: string;
  selected_camera_count?: number;
}

interface CompetitorQuoteUploaderProps {
  leadId: string;
  customerName?: string;
  selectedPackage?: SelectedPackageInfo | null;
  availablePackages?: SelectedPackageInfo[];
  onSelectPackage?: (pkg: SelectedPackageInfo) => void;
  onSubmit: (data: CompetitorQuoteSubmitData) => Promise<void>;
  onCancel?: () => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function CompetitorQuoteUploader({
  leadId,
  customerName,
  selectedPackage,
  availablePackages,
  onSelectPackage,
  onSubmit,
  onCancel,
}: CompetitorQuoteUploaderProps) {
  const [activePkg, setActivePkg] = useState<SelectedPackageInfo | null>(
    selectedPackage || null
  );

  useEffect(() => {
    if (selectedPackage) {
      setActivePkg(selectedPackage);
    }
  }, [selectedPackage]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<"pdf" | "image" | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Form fields
  const [competitorName, setCompetitorName] = useState("");
  const [competitorTotal, setCompetitorTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [yourName, setYourName] = useState(customerName || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { t } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(t("cqu_err_type", "Please upload a PDF, JPG, or PNG file"));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("cqu_err_size", "File must be smaller than 10MB"));
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);

        let fileToUpload = file;

        // Compress images if they are larger than 1MB
        if (file.type.startsWith("image/") && file.size > 1024 * 1024) {
          try {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            };
            const imageCompression = (await import("browser-image-compression")).default;
            fileToUpload = (await imageCompression(file, options)) as File;
          } catch (compError) {
            console.error("Image compression failed, falling back to original:", compError);
          }
        }

        const fileExtension = fileToUpload.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const storagePath = `leads/${leadId}/competitor/${fileName}`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Upload error:", error);
            toast.error(t("cqu_err_up", "Upload failed. Please try again."));
            setIsUploading(false);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              setUploadedUrl(downloadUrl);
              setUploadedFileName(file.name);
              setUploadedFileType(file.type === "application/pdf" ? "pdf" : "image");
              toast.success(t("cqu_ok_up", "File uploaded successfully"));
            } catch (err) {
              console.error("Error getting download URL:", err);
              toast.error(t("cqu_err_proc", "Failed to process file. Please try again."));
            } finally {
              setIsUploading(false);
            }
          }
        );
      } catch (err) {
        console.error(err);
        toast.error(t("cqu_err_up", "Failed to upload file. Please try again."));
        setIsUploading(false);
      }
    },
    [leadId]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const clearUpload = () => {
    setUploadedUrl(null);
    setUploadedFileType(null);
    setUploadedFileName(null);
    setUploadProgress(0);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedUrl) {
      toast.error(t("cqu_err_up2", "Please upload a competitor quote first"));
      return;
    }

    if (!yourName.trim()) {
      toast.error(t("svb_err_name", "Please enter your name"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        competitor_quote_url: uploadedUrl,
        competitor_name: competitorName.trim() || undefined,
        competitor_total: competitorTotal ? parseFloat(competitorTotal) : undefined,
        notes: notes.trim() || undefined,
        uploaded_by_name: yourName.trim(),
        selected_package_title: activePkg?.title,
        selected_package_price: activePkg?.price,
        selected_plan_type: activePkg?.planType,
        selected_technology: activePkg?.technology,
        selected_camera_count: activePkg?.cameraCount,
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      toast.error(t("cqu_err_gen", "Something went wrong. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success State ───────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 md:p-8 sm:p-12 text-center shadow-sm transition-all duration-500 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h4 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
          {t("up_quote_rcvd", "Quote Received")}
        </h4>
        <p className="text-[15px] text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          {t(
            "up_quote_msg",
            "We've received your competitor quote. Our engineering team will review the bill of materials and counter-offer with our best matching deal!"
          )}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      className="rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm transition-all duration-300"
    >
      {/* ─── Package Context & Instructions Banner ───────────────── */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/10 border border-amber-200/80 dark:border-amber-800/50 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Tag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                {t("cqu_badge", "Price Match Guarantee")}
              </span>
              {activePkg && (
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  {t("cqu_target", "Our Catalog Target: ₹{price}", { price: activePkg.price.toLocaleString("en-IN") })}
                </span>
              )}
            </div>

            {availablePackages && availablePackages.length > 0 ? (
              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-black text-amber-900/90 dark:text-amber-200 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  {t("cqu_sel_pkg", "Select setup to compare from our catalog:")}
                </label>
                <div className="relative">
                  <select
                    value={activePkg?.title || ""}
                    onChange={(e) => {
                      const selected = availablePackages.find(p => p.title === e.target.value);
                      if (selected) {
                        setActivePkg(selected);
                        if (onSelectPackage) onSelectPackage(selected);
                      }
                    }}
                    className="w-full py-2.5 pl-3.5 pr-10 text-xs sm:text-sm font-bold bg-white dark:bg-zinc-800 border border-amber-300/80 dark:border-amber-700/80 rounded-xl text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer appearance-none shadow-xs transition-all"
                  >
                    {availablePackages.map((pkg, i) => (
                      <option key={i} value={pkg.title}>
                        {pkg.title} — ₹{pkg.price.toLocaleString("en-IN")}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-amber-700 dark:text-amber-300 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed pt-1">
                  {t("cqu_pitch", "Upload your competitor's quote for a similar {count}-camera setup and we guarantee to match or beat their price while giving you 100% pure solid copper cables and genuine surveillance storage!", { count: String(activePkg?.cameraCount || 4) })}
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {activePkg
                    ? t("cqu_comparing", "You are comparing: {title} (Our Price: ₹{price})", { title: activePkg.title, price: activePkg.price.toLocaleString("en-IN") })
                    : t("cqu_compare_def", "Compare with our verified CCTV setup")}
                </h3>
                <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {t("cqu_pitch", "Upload your competitor's quote for a similar {count}-camera setup and we guarantee to match or beat their price while giving you 100% pure solid copper cables and genuine surveillance storage!", { count: String(activePkg?.cameraCount || 4) })}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── File Upload Zone ───────────────────────────────────── */}
      <div className="mb-6">
        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 mb-3 block">
          {t("up_comp_quote", "Competitor Quotation Document (PDF or Photo)")}
        </label>

        {uploadedUrl ? (
          <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden group">
            {/* Preview */}
            <div className="flex items-center gap-4 p-4">
              {uploadedFileType === "pdf" ? (
                <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                  <FileText className="w-7 h-7 text-red-500" />
                </div>
              ) : (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                  <Image
                    src={uploadedUrl}
                    alt={t("cqu_alt", "Competitor quote")}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {uploadedFileName}
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 shrink-0" /> {t("cqu_uploaded", "Uploaded successfully")}
                </p>
              </div>
              <button
                type="button"
                onClick={clearUpload}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors group/btn"
              >
                <X className="w-4 h-4 text-zinc-400 group-hover/btn:text-red-500" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`w-full aspect-[3/1] sm:aspect-[4/1] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
              isUploading
                ? "bg-blue-50 dark:bg-blue-900/10 border-blue-500/50"
                : isDragOver
                ? "bg-blue-50 dark:bg-blue-900/10 border-blue-400 scale-[1.01]"
                : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer group"
            }`}
          >
            {isUploading ? (
              <>
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 text-blue-100 dark:text-blue-900/30">
                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90 text-blue-500 transition-all duration-300"
                    strokeDasharray="150"
                    strokeDashoffset={150 - (uploadProgress / 100) * 150}
                  >
                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tabular-nums">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                  {t("cqu_uploading", "Uploading...")}
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-[20px] bg-white dark:bg-zinc-900 shadow-md border border-zinc-100 dark:border-zinc-800 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <UploadCloud className="w-6 h-6 text-zinc-400" />
                </div>
                <div className="text-center px-4">
                  <p className="text-xs font-black text-zinc-600 dark:text-zinc-300">
                    {t("up_drop", "Drop your quote here or click to browse")}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                    {t("up_pdf_max", "PDF, JPG, PNG up to 10MB")}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            if (e.target) e.target.value = "";
          }}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
        />
      </div>

      {/* ─── Form Fields ────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Your Name (Required) */}
        <div>
          <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 mb-1.5 block">
            {t("up_name", "Your Name")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={yourName}
            onChange={(e) => setYourName(e.target.value)}
            required
            placeholder={t("up_name_ph", "Enter your full name")}
            className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Competitor Name */}
        <div>
          <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 mb-1.5 block">
            {t("up_comp_name", "Competitor Name / Shop Name")}
          </label>
          <input
            type="text"
            value={competitorName}
            onChange={(e) => setCompetitorName(e.target.value)}
            placeholder={t("up_comp_ph", "e.g., CP Plus Dealer, Local CCTV Shop")}
            className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Competitor Total (Optional with Real-Time Variance & Smart Guidance) */}
        <div>
          <div className="flex items-center justify-between ml-1 mb-1.5 flex-wrap gap-1">
            <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase block">
              {t("up_total", "Competitor's Quoted Amount (₹)")} <span className="text-zinc-400 dark:text-zinc-500 font-normal lowercase">{t("cqu_opt", "(optional)")}</span>
            </label>
            {activePkg && competitorTotal && Number(competitorTotal) > 0 && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                Number(competitorTotal) < activePkg.price
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
              }`}>
                {Number(competitorTotal) < activePkg.price
                  ? t("cqu_cmp_lower", "Competitor is ₹{diff} lower • We match or beat!", { diff: (activePkg.price - Number(competitorTotal)).toLocaleString("en-IN") })
                  : t("cqu_our_lower", "Our price is already ₹{diff} lower with Pure Copper!", { diff: (Number(competitorTotal) - activePkg.price).toLocaleString("en-IN") })}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">₹</span>
            <input
              type="number"
              value={competitorTotal}
              onChange={(e) => setCompetitorTotal(e.target.value)}
              placeholder={t("cqu_amt_ph", "e.g. 18500 (or leave blank if unsure)")}
              min="0"
              step="1"
              className="w-full h-11 pl-8 pr-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all tabular-nums"
            />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 ml-1 leading-relaxed">
            💡 <span className="font-semibold text-zinc-700 dark:text-zinc-300">{t("cqu_all_inc_lbl", "All-Inclusive Standard:")}</span> {t("cqu_all_inc_body", "Our catalog price already includes 18% GST, 100% solid pure copper cabling, and professional installation. If your competitor quoted without GST or extra for cabling, leave this blank and our team will verify the full quote for you.")}
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase ml-1 mb-1.5 block">
            {t("up_notes", "Additional Notes (Equipment specs quoted by competitor)")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("up_notes_ph", "e.g. 4 cameras, 1TB hard disk, installation included...")}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
          />
        </div>
      </div>

      {/* ─── Actions ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t("up_cancel", "Cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={!uploadedUrl || !yourName.trim() || isSubmitting}
          className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-amber-500/20 active:scale-95 whitespace-normal text-center leading-snug"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              {t("cqu_submitting", "Submitting...")}
            </>
          ) : (
            <>
              {t("up_submit", "Submit for Price Match")}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
