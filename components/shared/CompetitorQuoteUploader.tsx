"use client";

import { useState, useRef, useCallback } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";

interface CompetitorQuoteUploaderProps {
  leadId: string;
  customerName?: string;
  onSubmit: (data: {
    competitor_quote_url: string;
    competitor_name?: string;
    competitor_total?: number;
    notes?: string;
    uploaded_by_name: string;
  }) => Promise<void>;
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
  onSubmit,
  onCancel,
}: CompetitorQuoteUploaderProps) {
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
        toast.error("Please upload a PDF, JPG, or PNG file");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File must be smaller than 10MB");
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);

        const fileExtension = file.name.split(".").pop();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        const fileName = `${timestamp}-${random}.${fileExtension}`;
        const storagePath = `leads/${leadId}/competitor/${fileName}`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(p);
          },
          (error) => {
            console.error("Upload error:", error);
            toast.error("Failed to upload file");
            setIsUploading(false);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadedUrl(downloadURL);
            setUploadedFileType(file.type === "application/pdf" ? "pdf" : "image");
            setUploadedFileName(file.name);
            setIsUploading(false);
            toast.success("File uploaded successfully");
          }
        );
      } catch (error) {
        console.error(error);
        toast.error("An error occurred during upload");
        setIsUploading(false);
      }
    },
    [leadId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const clearUpload = () => {
    setUploadedUrl(null);
    setUploadedFileType(null);
    setUploadedFileName(null);
    setUploadProgress(0);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedUrl) {
      toast.error("Please upload a competitor quote first");
      return;
    }

    if (!yourName.trim()) {
      toast.error("Please enter your name");
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
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success State ───────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 sm:p-12 text-center shadow-sm transition-all duration-500 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h4 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
          {t('up_quote_rcvd', 'Quote Received')}
        </h4>
        <p className="text-[15px] text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          {t('up_quote_msg', "We've received your quote. Our team will review it and get back to you within 24 hours with a guaranteed best price.")}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      className="rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm transition-all duration-300"
    >
      {/* ─── File Upload Zone ───────────────────────────────────── */}
      <div className="mb-6">
        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 mb-3 block">
          {t('up_comp_quote', 'Competitor Quotation')}
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
                    alt="Competitor quote"
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
                  <CheckCircle2 className="w-3 h-3" /> Uploaded successfully
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
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Uploading...
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-[20px] bg-white dark:bg-zinc-900 shadow-md border border-zinc-100 dark:border-zinc-800 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <UploadCloud className="w-6 h-6 text-zinc-400" />
                </div>
                <div className="text-center px-4">
                  <p className="text-xs font-black text-zinc-600 dark:text-zinc-300">
                    {t('up_drop', 'Drop your quote here or click to browse')}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                    {t('up_pdf_max', 'PDF, JPG, PNG up to 10MB')}
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
            {t('up_name', 'Your Name')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={yourName}
            onChange={(e) => setYourName(e.target.value)}
            required
            placeholder={t('up_name_ph', 'Enter your full name')}
            className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Competitor Name */}
        <div>
          <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 mb-1.5 block">
            {t('up_comp_name', 'Competitor Name')}
          </label>
          <input
            type="text"
            value={competitorName}
            onChange={(e) => setCompetitorName(e.target.value)}
            placeholder={t('up_comp_ph', 'e.g., CP Plus Dealer, Local CCTV Shop')}
            className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Competitor Total */}
        <div>
          <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 mb-1.5 block">
            {t('up_total', 'Their Quoted Total (₹)')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">₹</span>
            <input
              type="number"
              value={competitorTotal}
              onChange={(e) => setCompetitorTotal(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
              className="w-full h-11 pl-8 pr-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all tabular-nums"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 mb-1.5 block">
            {t('up_notes', 'Additional Notes')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('up_notes_ph', "Anything else you'd like us to know...")}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
          />
        </div>
      </div>

      {/* ─── Actions ────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t('up_cancel', 'Cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={!uploadedUrl || !yourName.trim() || isSubmitting}
          className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              {t('up_submit', 'Submit for Price Match')}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
