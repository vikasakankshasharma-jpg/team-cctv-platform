"use client";

import React, { useState } from "react";
import { 
  X, 
  Trash2, 
  Archive, 
  ShieldAlert, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  customerName: string;
  isCompleted: boolean;
  onSuccess?: () => void;
}

export function DeleteQuoteModal({
  isOpen,
  onClose,
  quoteId,
  customerName,
  isCompleted,
  onSuccess
}: DeleteQuoteModalProps) {
  const router = useRouter();
  const [deleteMode, setDeleteMode] = useState<"archive" | "permanent">("archive");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const isPermanent = deleteMode === "permanent";
      const res = await fetch(`/api/crm/quotes/${quoteId}?permanent=${isPermanent}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || (isPermanent ? "Quotation permanently deleted" : "Quotation moved to archive"));
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/leads");
        }
        onClose();
      } else {
        toast.error(data.message || "Failed to delete quotation");
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Network error while deleting quotation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isCompleted 
                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40" 
                : "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40"
            }`}>
              {isCompleted ? <ShieldAlert className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                {isCompleted ? "Deletion Protected" : "Delete Uncompleted Quotation"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {customerName} • ID: {quoteId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          
          {isCompleted ? (
            /* Protected Completed Quote Notice */
            <div className="space-y-3">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 text-sm mb-1 text-amber-800 dark:text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Completed Quotes Cannot Be Deleted
                </p>
                <p className="text-xs mt-1">
                  This quotation has been confirmed or paid (WON). Statutory tax regulations, customer invoice history, and warranty records require completed quotations to remain permanent.
                </p>
                <p className="text-xs mt-2 font-medium">
                  If equipment or pricing needs to change, please use <strong>"Create Revision"</strong> to track changes without violating audit integrity.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button 
                  onClick={onClose}
                  className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs"
                >
                  Understood, Keep Quote
                </Button>
              </div>
            </div>
          ) : (
            /* Uncompleted Quote Deletion Options */
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Choose how you want to handle this uncompleted quotation:
              </p>

              {/* Archive Option */}
              <div 
                onClick={() => setDeleteMode("archive")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  deleteMode === "archive" 
                    ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-500 shadow-xs" 
                    : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                }`}
              >
                <Archive className={`w-4 h-4 mt-0.5 shrink-0 ${deleteMode === "archive" ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-white">
                      Move to Archive (Soft Delete - Recommended)
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Hides the quote from active pipelines, keeps analytics intact, and prevents 404 errors if the customer visits their link.
                  </p>
                </div>
              </div>

              {/* Permanent Option */}
              <div 
                onClick={() => setDeleteMode("permanent")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  deleteMode === "permanent" 
                    ? "bg-red-50/60 dark:bg-red-950/30 border-red-500 shadow-xs" 
                    : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                }`}
              >
                <Trash2 className={`w-4 h-4 mt-0.5 shrink-0 ${deleteMode === "permanent" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-900 dark:text-red-300">
                      Permanent Purge (Irreversible)
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Completely erases the quotation and lead documents from Firestore. Cannot be recovered.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className={`text-white font-bold text-xs flex items-center gap-2 px-4 ${
                    deleteMode === "permanent" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {deleteMode === "permanent" ? <Trash2 className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                      <span>{deleteMode === "permanent" ? "Permanently Delete" : "Archive Quotation"}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
