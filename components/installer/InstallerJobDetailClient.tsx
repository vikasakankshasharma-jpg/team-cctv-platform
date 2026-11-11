"use client";

import { useState } from "react";
import { updateLeadInstallationProof } from "@/app/actions/leads";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";
import { storage } from "@/lib/firebase-client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { MapPin, Phone, User, Package, Camera, CheckCircle2, ArrowLeft, Loader2, UploadCloud, Store, ScanBarcode, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { InstallerBlockageModal } from "./InstallerBlockageModal";
import SubmitOfflinePaymentModal from "./SubmitOfflinePaymentModal";
import { InstallerChangeOrderModal } from "./InstallerChangeOrderModal";
import BarcodeScanner from "./BarcodeScanner";
import { JobSignoffModal } from "./JobSignoffModal";
import { useTranslation } from "@/hooks/useTranslation";
import type { Lead } from "@/types";

export default function InstallerJobDetailClient({ 
  leadId, 
  lead, 
  hardware, 
  isAssigned,
  job,
  hub
}: { 
  leadId: string, 
  lead: Partial<Lead>, 
  hardware: any[], 
  isAssigned: boolean,
  job?: any,
  hub?: any
}) {
  const { t } = useTranslation();
  const statusLabelMap: Record<string, string> = {
    new: t("inst_st_new", "New"),
    contacted: t("inst_st_contacted", "Contacted"),
    site_visit: t("inst_st_site_visit", "Site Visit"),
    unreachable: t("inst_st_unreachable", "Unreachable"),
    busy: t("inst_st_busy", "Busy"),
    technical_error: t("inst_st_tech_err", "Technical Error"),
    negotiation: t("inst_st_negotiation", "Negotiation"),
    requote: t("inst_st_requote", "Re-Quote"),
    won: t("inst_st_won", "Won"),
    lost: t("inst_st_lost", "Lost"),
  };
  const displayStatus = lead.status ? (statusLabelMap[lead.status.toLowerCase()] || lead.status.replace(/_/g, " ")) : "";
  // Per-product photo proof: { "itemId": { before?: File, after?: File } }
  const [itemPhotos, setItemPhotos] = useState<Record<string, { before?: File; after?: File; beforePreview?: string; afterPreview?: string }>>({});
  const [isBlockageModalOpen, setIsBlockageModalOpen] = useState(false);
  const [showSignoffModal, setShowSignoffModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [resending, setResending] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isChangeOrderModalOpen, setIsChangeOrderModalOpen] = useState(false);
  
  // Scanning State
  const [scannedAssets, setScannedAssets] = useState<any[]>([]);
  const [activeScannerIndex, setActiveScannerIndex] = useState<number | null>(null);
  
  // Flatten hardware based on quantity
  const flatHardware = hardware.flatMap((item, idx) => {
    const qty = item.quantity || item.qty || 1;
    return Array.from({ length: qty }).map((_, i) => ({
      ...item,
      _checklistId: `${idx}-${i}`
    }));
  });

  const allItemsScanned = flatHardware.length > 0 && scannedAssets.length === flatHardware.length;

  const handleItemPhoto = async (itemId: string, type: "before" | "after", e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const raw = e.target.files[0];
      // Compress: 1200px max, 70% JPEG quality (~60-70% size reduction)
      const compressed = await compressImage(raw, 1200, 0.7);
      const preview = URL.createObjectURL(compressed);
      setItemPhotos(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [type]: compressed,
          [type === "before" ? "beforePreview" : "afterPreview"]: preview,
        }
      }));
    }
  };

  const removeItemPhoto = (itemId: string, type: "before" | "after") => {
    setItemPhotos(prev => {
      const item = prev[itemId];
      if (!item) return prev;
      const previewKey = type === "before" ? "beforePreview" : "afterPreview";
      if (item[previewKey]) URL.revokeObjectURL(item[previewKey]!);
      return {
        ...prev,
        [itemId]: {
          ...item,
          [type]: undefined,
          [previewKey]: undefined,
        }
      };
    });
  };

  // Get all photo files for upload
  const getAllPhotoFiles = () => {
    const allFiles: { file: File; itemId: string; type: string }[] = [];
    for (const [itemId, photos] of Object.entries(itemPhotos)) {
      if (photos.before) allFiles.push({ file: photos.before, itemId, type: "before" });
      if (photos.after) allFiles.push({ file: photos.after, itemId, type: "after" });
    }
    return allFiles;
  };

  const totalPhotos = getAllPhotoFiles().length;

  const handleResendPin = async () => {
    try {
      setResending(true);
      const { resendCompletionPin } = await import("@/app/actions/leads");
      await resendCompletionPin(leadId);
      toast.success(t("inst_pin_resent_ok", "PIN has been resent to the customer's WhatsApp."));
    } catch (error: any) {
      toast.error(error.message || t("inst_pin_resend_err", "Failed to resend PIN"));
    } finally {
      setResending(false);
    }
  };

  const handleUploadAndComplete = async () => {
    const photoFiles = getAllPhotoFiles();
    if (photoFiles.length === 0) {
      toast.error(t("inst_photo_req_err", "Please upload at least 1 Before/After installation photo."));
      return;
    }
    if (flatHardware.length > 0 && !allItemsScanned) {
      const pending = flatHardware.length - scannedAssets.length;
      toast.error(t("inst_scan_first_err", "Please scan/mark {pending} remaining hardware item(s) before submitting.", { pending: String(pending) }));
      return;
    }
    if (pin.length !== 4) {
      toast.error(t("inst_pin_4digit_err", "Please enter the customer's 4-digit completion PIN."));
      return;
    }
    
    setUploading(true);
    setProgress(0);
    try {
      const uploadPromises = photoFiles.map(({ file, itemId, type }, index) => {
        return new Promise<{ url: string; itemId: string; type: string }>((resolve, reject) => {
          const filename = `installations/${leadId}_${itemId}_${type}_${Date.now()}_${file.name}`;
          const storageRef = ref(storage, filename);
          const uploadTask = uploadBytesResumable(storageRef, file);
          
          uploadTask.on('state_changed', 
            (snapshot) => {
              const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(Math.round((index / photoFiles.length) * 100 + p / photoFiles.length)); 
            }, 
            (error) => reject(error), 
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({ url: downloadURL, itemId, type });
            }
          );
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      const downloadURLs = uploadResults.map(r => r.url);
      
      try {
        const { updateLeadInstallationProof } = await import("@/app/actions/leads");
        await updateLeadInstallationProof(leadId, downloadURLs, "completed", note, pin, scannedAssets);
        toast.success(t("inst_complete_ok", "Installation completed and Warranty activated!"));
      } catch (serverError: any) {
         toast.error(serverError.message || t("inst_submit_proof_err", "Failed to submit installation proof"));
         setUploading(false);
      }
    } catch (error: any) {
      toast.error(error.message || t("del_err_generic", "An error occurred"));
      setUploading(false);
    }
  };

  const isCompleted = lead.status === "won" || !!(lead as any).installation_proof_url;
  const leadInstallationUrls = (lead as any).installation_proof_urls || ((lead as any).installation_proof_url ? [(lead as any).installation_proof_url] : []);

  return (
    <div className="max-w-3xl space-y-8 pb-20 animate-in fade-in duration-500">
      
      <Link href="/installer/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 shrink-0" /> {t("inst_back_pipeline", "Back to Pipeline")}
      </Link>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-foreground tracking-tight">{lead.customer_name}</h1>
            <div className="flex items-start gap-2 text-muted-foreground mt-2 font-medium text-sm">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> 
              <span>{lead.address?.full_address || (lead as any).detected_city || t("inst_addr_missing", "Address not provided")}</span>
            </div>
            {lead.mobile_number && (
              <div className="flex items-center gap-2 text-muted-foreground mt-1 font-medium text-sm">
                <Phone className="w-4 h-4 shrink-0" /> {lead.mobile_number}
              </div>
            )}
          </div>
          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shrink-0 ${isCompleted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
            {displayStatus}
          </span>
        </div>
      </div>

      {/* Hardware Location */}
      {job && (
        <div className={`border rounded-3xl p-6 shadow-sm space-y-3 ${job.hub_id ? 'bg-card border-border' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <h3 className={`font-bold flex items-center gap-2 ${job.hub_id ? 'text-foreground' : 'text-emerald-700 dark:text-emerald-400'}`}>
            <Store className={`w-5 h-5 shrink-0 ${job.hub_id ? 'text-primary' : ''}`} /> 
            {t("inst_hw_loc_title", "Hardware Location")}
          </h3>
          
          {job.hub_id && hub ? (
            <div>
              <p className="text-sm font-bold text-foreground mb-1">{t("inst_pickup_from", "Pick up from: {hub}", { hub: hub.name })}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /> {hub.address}</p>
              {hub.contact_phone && (
                 <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1"><Phone className="w-3.5 h-3.5 shrink-0" /> {hub.contact_phone}</p>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {t("inst_hw_at_site", "Hardware is already at the Customer Site. No pickup required.")}
            </p>
          )}
        </div>
      )}

      {/* Site Survey & Technical Scope */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> {t("inst_scope_title", "Site & Installation Scope")}
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-snug">{t("inst_outdoor_cams", "Outdoor Cams")}</span>
            <span className="text-base font-black text-foreground">{t("inst_bullet_count", "{n} Bullet", { n: String((lead.wizard_answers?.outdoor_camera_count as any) ?? 0) })}</span>
          </div>
          <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-snug">{t("inst_indoor_cams", "Indoor Cams")}</span>
            <span className="text-base font-black text-foreground">{t("inst_dome_count", "{n} Dome", { n: String((lead.wizard_answers?.indoor_camera_count as any) ?? 0) })}</span>
          </div>
          <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-snug">{t("inst_ceiling_height", "Ceiling Height")}</span>
            <span className="text-base font-black text-foreground leading-snug block mt-0.5">
              {lead.wizard_answers?.ladder_required ? t("inst_height_ladder", "> 10 ft (Ladder)") : t("inst_height_standard", "Standard (< 10 ft)")}
            </span>
          </div>
          <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block leading-snug">{t("inst_wiring_scope", "Wiring Scope")}</span>
            <span className="text-base font-black text-foreground leading-snug block mt-0.5">
              {lead.wizard_answers?.cabling_done ? t("inst_wiring_reuse", "Reuse Existing") : t("inst_wiring_fresh", "Fresh Conduit/Run")}
            </span>
          </div>
        </div>

        {Boolean(lead.wizard_answers?.primary_purpose) && (
          <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-xl border border-primary/10 flex flex-wrap items-center justify-between gap-2">
            <span>{t("inst_primary_purpose", "Primary Security Purpose:")} <strong className="text-foreground capitalize">{String(lead.wizard_answers?.primary_purpose ?? '').replace(/_/g, ' ')}</strong></span>
            <span>{t("inst_target_budget", "Customer Estimate Range:")} <strong className="text-foreground">{String(lead.wizard_answers?.budget_range || t("wz_standard", "Standard")).replace(/_/g, ' ')}</strong></span>
          </div>
        )}
      </div>

      {/* Hardware Requirements & Scanning */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Package className="w-5 h-5 text-primary shrink-0" /> {t("inst_hw_track_title", "Hardware Tracking ({count} items)", { count: String(flatHardware.length) })}
        </h3>
        <p className="text-sm text-muted-foreground">{t("inst_hw_track_sub", "Scan or mark all items to enable proof submission")}</p>
        
        {flatHardware.length > 0 ? (
          <div className="space-y-4">
            {flatHardware.map((item, idx) => {
              const isScanned = scannedAssets.some(a => a._checklistId === item._checklistId);
              const asset = scannedAssets.find(a => a._checklistId === item._checklistId);

              return (
                <div key={item._checklistId} className={`p-4 border rounded-xl flex flex-col gap-3 transition-all ${isScanned ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-background border-border'}`}>
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm">{item.name || item.display_name}</h4>
                      <p className="text-xs text-muted-foreground">{item.sku || t("inst_na", "N/A")}</p>
                    </div>
                    {isScanned ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> {item.has_serial_number ? t("inst_scanned_lbl", "Scanned") : t("inst_installed_lbl", "Installed")}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-md shrink-0">
                        {t("inst_pending_lbl", "Pending")}
                      </span>
                    )}
                  </div>

                  {!isScanned && (
                    <div className="flex flex-wrap gap-2">
                      {item.has_serial_number ? (
                        <button
                          type="button"
                          onClick={() => setActiveScannerIndex(idx)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-normal h-auto"
                        >
                          <ScanBarcode className="w-4 h-4 shrink-0" /> {t("inst_scan_barcode", "Scan Barcode")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setScannedAssets(prev => [...prev, {
                              _checklistId: item._checklistId,
                              product_id: item.product_id || item.id,
                              productName: item.name || item.display_name,
                              skuId: item.sku,
                              serialNumber: "",
                              warrantyMonths: item.warranty_months || 0,
                              hasSerialNumber: false
                            }]);
                          }}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-normal h-auto"
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> {t("inst_mark_installed", "Mark Installed")}
                        </button>
                      )}
                    </div>
                  )}

                  {isScanned && item.has_serial_number && (
                    <div className="bg-white dark:bg-black p-2 rounded border border-border text-xs font-mono">
                      S/N: {asset?.serialNumber}
                    </div>
                  )}

                  {/* Scanner UI */}
                  {activeScannerIndex === idx && !isScanned && item.has_serial_number && (
                    <div className="mt-2 border-t pt-2 border-border/50">
                      <BarcodeScanner 
                        onScan={(decodedText) => {
                          setScannedAssets(prev => [...prev, {
                            _checklistId: item._checklistId,
                            product_id: item.product_id || item.id,
                            productName: item.name || item.display_name,
                            skuId: item.sku,
                            serialNumber: decodedText,
                            warrantyMonths: item.warranty_months || 0,
                            hasSerialNumber: true
                          }]);
                          setActiveScannerIndex(null);
                          toast.success(t("inst_barcode_scanned", "Scanned S/N: {code} for {item}", {
                            code: decodedText,
                            item: item.name || item.display_name || t("inst_product_fallback", "Product"),
                          }));
                        }}
                        onError={() => {}}
                      />
                      <button 
                        onClick={() => setActiveScannerIndex(null)}
                        className="mt-2 text-xs text-muted-foreground underline w-full text-center"
                      >
                        {t("inst_cancel_scan", "Cancel Scan")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic py-4">{t("inst_hw_empty", "No detailed hardware quote attached. Proceed directly with proof upload.")}</div>
        )}
      </div>

      {/* Handover & Quality Checklist */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {t("inst_checklist_title", "Handover Quality Checklist")}
        </h3>
        <p className="text-xs text-muted-foreground">{t("inst_chk_verify_sub", "Verify all 6 points with customer before asking for the 4-digit completion PIN:")}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground font-medium">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">✓</span>
            <span>{t("inst_chk_mount", "Cameras securely mounted & aimed with clear view")}</span>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">✓</span>
            <span>{t("inst_chk_cables", "Cables neatly clipped/concealed & drill holes sealed")}</span>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">✓</span>
            <span>{t("inst_chk_dvr", "DVR/NVR powered ON & HDD recording verified")}</span>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">✓</span>
            <span>{t("inst_chk_app", "Mobile app configured & customer shown live playback")}</span>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">✓</span>
            <span>{t("inst_chk_night_color", "Day and Night-vision / Color test verified")}</span>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">✓</span>
            <span>{t("inst_chk_site_clean", "Site cleaned up & packaging removed")}</span>
          </div>
        </div>
      </div>

      {/* Proof of Installation */}
      {isAssigned && !isCompleted && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary shrink-0" /> {t("inst_proof_title", "Proof of Installation (Per-Product Before/After Photos)")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("inst_proof_sub", "Upload Before & After photos per hardware unit from site for warranty activation.")}</p>
          <p className="text-xs text-blue-600 font-semibold">{t("inst_photos_selected", "{count} photo(s) selected", { count: String(totalPhotos) })}</p>

          <div className="space-y-4">
            {hardware.map((item: any, hIdx: number) => {
              const itemId = item._checklistId || item.name || String(hIdx);
              const qty = item.quantity || item.qty || 1;
              const photos = itemPhotos[itemId] || {};
              return (
                <div key={itemId} className="border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-foreground">{item.name || item.product_name || t("inst_product_fallback", "Product")}</h4>
                    <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full shrink-0">{t("inst_qty_lbl", "Qty: {qty}", { qty: String(qty) })}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(["before", "after"] as const).map((type) => {
                      const preview = type === "before" ? photos.beforePreview : photos.afterPreview;
                      const typeLabel = type === "before" ? t("inst_before", "Before") : t("inst_after", "After");
                      return (
                        <div key={type}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 text-center">
                            {typeLabel}
                          </p>
                          {preview ? (
                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                              <Image src={preview} alt={typeLabel} fill className="object-cover" unoptimized />
                              {!uploading && (
                                <button onClick={() => removeItemPhoto(itemId, type)} className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/80 transition-colors">{String.fromCharCode(10005)}</button>
                              )}
                            </div>
                          ) : (
                            <label className="aspect-[4/3] rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors p-2 text-center">
                              <Camera className="w-5 h-5 text-zinc-400" />
                              <span className="text-[10px] text-zinc-400 mt-1">{typeLabel}</span>
                              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleItemPhoto(itemId, type, e)} />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{t("inst_notes_opt", "Installation Notes (Optional)")}</label>
              <textarea 
                rows={2} 
                value={note} 
                onChange={e => setNote(e.target.value)}
                placeholder={t("inst_notes_ph", "Any wire length notes, junction box placement, or customer handover tips...")}
                className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <div className="flex flex-wrap justify-between items-end gap-2 mb-2">
                <label className="block text-xs font-bold text-amber-600 uppercase tracking-widest">{t("inst_cust_pin", "Customer Completion PIN")}</label>
                <button 
                  onClick={handleResendPin}
                  disabled={resending}
                  className="text-[10px] font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2 whitespace-normal h-auto"
                >
                  {resending ? t("inst_sending", "Sending...") : t("inst_resend_pin_wa", "Resend PIN via WhatsApp")}
                </button>
              </div>
              <input 
                type="text" 
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder={t("inst_enter_4_pin_ph", "Enter 4-digit PIN")}
                className="w-full px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-700 font-bold tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-amber-500/50"
              />
            </div>

            {/* On-Site Change Order / Extra Work Trigger */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                  {t("inst_extra_found_title", "Extra Work / Materials Found?")}
                </label>
                <span className="text-[10px] bg-amber-200 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full shrink-0">
                  {t("inst_gst_supp_badge", "GST Supplementary")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {t("inst_extra_found_desc", "Raise a separate site change order for extra cable length, conduit pipes, or drilling labor and generate instant payment QR.")}
              </p>
              <button 
                type="button"
                onClick={() => setIsChangeOrderModalOpen(true)}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] whitespace-normal h-auto text-center"
              >
                <span>{t("inst_add_extra_btn", "+ Add Site Extra / Change Order")}</span>
              </button>
            </div>

            {lead?.status !== "won" && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
                  {t("inst_pay_col_stage3", "Payment Collection (Stage 3 Handover)")}
                </label>
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full py-4 px-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.99] whitespace-normal h-auto text-center"
                >
                  {t("inst_collect_pay_btn", "Collect Payment (On-Screen UPI QR / Cash)")}
                </button>
              </div>
            )}
            
            <button 
              onClick={() => setIsBlockageModalOpen(true)}
              className="w-full py-3.5 px-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 mb-3 whitespace-normal h-auto text-center"
            >
              {t("inst_report_blockage", "Report Blockage / Reschedule")}
            </button>
            <button onClick={() => setShowSignoffModal(true)} className="w-full py-4 px-4 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 whitespace-normal h-auto text-center"><CheckCircle2 className="w-5 h-5 shrink-0" /> {t("inst_proceed_signoff", "Proceed to Customer Sign-Off")}</button>
          </div>
        </div>
      )}

      {/* Offline Payment Modal with On-Screen UPI QR & Admin Cash Gate */}
      <SubmitOfflinePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        leadId={leadId}
        quoteId={(lead as any).last_quote_id || lead.latest_quote_id || (lead as any).quote_id || leadId}
        isCashApproved={Boolean((lead as any).cash_collection_approved || (lead as any).job_level_cash_authority)}
        expectedAmount={Number((lead as any).amount_due || 0)}
      />

      {/* On-Site Change Order Modal with On-Screen Dynamic QR */}
      <InstallerChangeOrderModal
        isOpen={isChangeOrderModalOpen}
        onClose={() => setIsChangeOrderModalOpen(false)}
        leadId={leadId}
        quoteId={(lead as any).last_quote_id || lead.latest_quote_id || (lead as any).quote_id || leadId}
        jobId={job?.id}
        isCashApproved={Boolean((lead as any).cash_collection_approved || (lead as any).job_level_cash_authority)}
        onSuccess={() => {
          toast.success(t("inst_co_registered_toast", "Site Change Order registered successfully!"));
        }}
      />

      <InstallerBlockageModal 
        isOpen={isBlockageModalOpen} 
        onClose={() => setIsBlockageModalOpen(false)} 
        jobId={job?.id || ''} 
        leadId={leadId} 
      />

      {/* Already Completed State */}
      {isCompleted && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-emerald-600 mb-1">{t("inst_job_done_title", "Job Completed")}</h3>
          <p className="text-sm font-medium text-emerald-600/80 mb-6">{t("inst_job_done_desc", "You have successfully submitted proof of installation for this lead.")}</p>
          
          {leadInstallationUrls.length > 0 && (
            <div className="w-full max-w-sm grid grid-cols-2 gap-3">
              {leadInstallationUrls.map((url: string, idx: number) => {
                const imgLabel = idx === 0 ? t("inst_before", "Before") : t("inst_after", "After");
                return (
                  <div key={idx}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 mb-1.5 text-center">
                      {imgLabel}
                    </p>
                    <div className="relative aspect-square rounded-xl overflow-hidden border border-emerald-500/20">
                      <Image src={url} alt={imgLabel} fill className="object-cover" unoptimized />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}


