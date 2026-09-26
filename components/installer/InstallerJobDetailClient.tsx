"use client";

import { useState } from "react";
import { updateLeadInstallationProof } from "@/app/actions/leads";
import { toast } from "sonner";
import { storage } from "@/lib/firebase-client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { MapPin, Phone, User, Package, Camera, CheckCircle2, ArrowLeft, Loader2, UploadCloud, Store, ScanBarcode } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { InstallerBlockageModal } from "./InstallerBlockageModal";
import SubmitOfflinePaymentModal from "./SubmitOfflinePaymentModal";
import BarcodeScanner from "./BarcodeScanner";
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
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isBlockageModalOpen, setIsBlockageModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [resending, setResending] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
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

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (files.length >= 2) {
        toast.error("You can upload up to 2 photos (Before & After).");
        return;
      }
      const selectedFile = e.target.files[0];
      setFiles((prev) => [...prev, selectedFile]);
      setPreviewUrls((prev) => [...prev, URL.createObjectURL(selectedFile)]);
    }
  };

  const removePhoto = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const handleResendPin = async () => {
    try {
      setResending(true);
      const { resendCompletionPin } = await import("@/app/actions/leads");
      await resendCompletionPin(leadId);
      toast.success("PIN has been resent to the customer's WhatsApp.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend PIN");
    } finally {
      setResending(false);
    }
  };

  const handleUploadAndComplete = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one photo as proof of installation.");
      return;
    }
    if (flatHardware.length > 0 && !allItemsScanned) {
      toast.error("Please scan or mark all hardware items as installed.");
      return;
    }
    if (pin.length !== 6) {
      toast.error("Please enter the 6-digit Completion PIN from the customer.");
      return;
    }
    
    setUploading(true);
    setProgress(0);
    try {
      const uploadPromises = files.map((file, index) => {
        return new Promise<string>((resolve, reject) => {
          const filename = `installations/${leadId}_${Date.now()}_${index}_${file.name}`;
          const storageRef = ref(storage, filename);
          const uploadTask = uploadBytesResumable(storageRef, file);
          
          uploadTask.on('state_changed', 
            (snapshot) => {
              // We could calculate total progress here, but for simplicity let's just show an indeterminate state or approximate
              const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(Math.round(p)); 
            }, 
            (error) => reject(error), 
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            }
          );
        });
      });

      const downloadURLs = await Promise.all(uploadPromises);
      
      try {
        const { updateLeadInstallationProof } = await import("@/app/actions/leads");
        await updateLeadInstallationProof(leadId, downloadURLs, "completed", note, pin, scannedAssets);
        toast.success("Job successfully marked as Completed!");
      } catch (serverError: any) {
         toast.error(serverError.message || "Failed to update job status. Please check the PIN.");
         setUploading(false);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during upload");
      setUploading(false);
    }
  };

  const isCompleted = lead.status === "won" || !!(lead as any).installation_proof_url;
  const leadInstallationUrls = (lead as any).installation_proof_urls || ((lead as any).installation_proof_url ? [(lead as any).installation_proof_url] : []);

  return (
    <div className="max-w-3xl space-y-8 pb-20 animate-in fade-in duration-500">
      
      <Link href="/installer/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Pipeline
      </Link>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">{lead.customer_name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-2 font-medium text-sm">
              <MapPin className="w-4 h-4" /> 
              {lead.address?.full_address || (lead as any).detected_city || "Address not provided"}
            </div>
            {lead.mobile_number && (
              <div className="flex items-center gap-2 text-muted-foreground mt-1 font-medium text-sm">
                <Phone className="w-4 h-4" /> {lead.mobile_number}
              </div>
            )}
          </div>
          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${isCompleted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
            {lead.status}
          </span>
        </div>
      </div>

      {/* Hardware Location */}
      {job && (
        <div className={`border rounded-3xl p-6 shadow-sm space-y-3 ${job.hub_id ? 'bg-card border-border' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <h3 className={`font-bold flex items-center gap-2 ${job.hub_id ? 'text-foreground' : 'text-emerald-700 dark:text-emerald-400'}`}>
            <Store className={`w-5 h-5 ${job.hub_id ? 'text-primary' : ''}`} /> 
            Hardware Location
          </h3>
          
          {job.hub_id && hub ? (
            <div>
              <p className="text-sm font-bold text-foreground mb-1">Pick up from: {hub.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {hub.address}</p>
              {hub.contact_phone && (
                 <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1"><Phone className="w-3.5 h-3.5" /> {hub.contact_phone}</p>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Hardware is already at the Customer Site. No pickup required.
            </p>
          )}
        </div>
      )}

      {/* Site Survey & Technical Scope */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" /> Site &amp; Installation Scope
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Outdoor Cams</span>
            <span className="text-base font-black text-foreground">{lead.wizard_answers?.outdoor_camera_count as any ?? 0} Bullet</span>
          </div>
          <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Indoor Cams</span>
            <span className="text-base font-black text-foreground">{lead.wizard_answers?.indoor_camera_count as any ?? 0} Dome</span>
          </div>
          <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Ceiling Height</span>
            <span className="text-base font-black text-foreground">
              {lead.wizard_answers?.ladder_required ? "> 10 ft (Ladder)" : "Standard (< 10 ft)"}
            </span>
          </div>
          <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Wiring Scope</span>
            <span className="text-base font-black text-foreground">
              {lead.wizard_answers?.cabling_done ? "Reuse Existing" : "Fresh Conduit/Run"}
            </span>
          </div>
        </div>

        {Boolean(lead.wizard_answers?.primary_purpose) && (
          <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-xl border border-primary/10 flex items-center justify-between">
            <span>Primary Security Purpose: <strong className="text-foreground capitalize">{String(lead.wizard_answers?.primary_purpose ?? '').replace('_', ' ')}</strong></span>
            <span>Target Budget: <strong className="text-foreground">{String(lead.wizard_answers?.budget_range || 'Standard').replace('_', ' ')}</strong></span>
          </div>
        )}
      </div>

      {/* Hardware Requirements & Scanning */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> Hardware Tracking
        </h3>
        <p className="text-sm text-muted-foreground">Scan or mark all items to generate the customer's warranty certificate.</p>
        
        {flatHardware.length > 0 ? (
          <div className="space-y-4">
            {flatHardware.map((item, idx) => {
              const isScanned = scannedAssets.some(a => a._checklistId === item._checklistId);
              const asset = scannedAssets.find(a => a._checklistId === item._checklistId);

              return (
                <div key={item._checklistId} className={`p-4 border rounded-xl flex flex-col gap-3 transition-all ${isScanned ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-background border-border'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm">{item.name || item.display_name}</h4>
                      <p className="text-xs text-muted-foreground">{item.sku || "N/A"}</p>
                    </div>
                    {isScanned ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">
                        <CheckCircle2 className="w-3 h-3" /> {item.has_serial_number ? "Scanned" : "Installed"}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-md">
                        Pending
                      </span>
                    )}
                  </div>

                  {!isScanned && (
                    <div className="flex gap-2">
                      {item.has_serial_number ? (
                        <button
                          type="button"
                          onClick={() => setActiveScannerIndex(idx)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        >
                          <ScanBarcode className="w-4 h-4" /> Scan Barcode
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
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark Installed
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
                          toast.success(`Scanned: ${decodedText}`);
                        }}
                        onError={() => {}}
                      />
                      <button 
                        onClick={() => setActiveScannerIndex(null)}
                        className="mt-2 text-xs text-muted-foreground underline w-full text-center"
                      >
                        Cancel Scan
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic py-4">No specific hardware configuration linked yet. Check dispatch notes or contact Admin.</div>
        )}
      </div>

      {/* Handover & Quality Checklist */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Handover Quality Checklist
        </h3>
        <p className="text-xs text-muted-foreground">Verify all 6 points with customer before asking for the 6-digit completion PIN:</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground font-medium">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-[10px]">✓</span>
            All cameras firmly mounted &amp; angle focused
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-[10px]">✓</span>
            Cables dressed neatly with conduit / casing
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-[10px]">✓</span>
            DVR/NVR recording active with time stamp synced
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-[10px]">✓</span>
            Mobile app connected on customer phone
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-[10px]">✓</span>
            Day and Night-vision / Color test verified
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-[10px]">✓</span>
            Site cleaned up &amp; packaging removed
          </div>
        </div>
      </div>

      {/* Proof of Installation */}
      {isAssigned && !isCompleted && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" /> Proof of Installation
          </h3>
          <p className="text-sm text-muted-foreground">Upload <strong>Before</strong> and <strong>After</strong> photos of the installation site to mark this job as Won.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((idx) => (
                <div key={idx}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 text-center">
                    {idx === 0 ? "Before" : "After"}
                  </p>
                  {previewUrls[idx] ? (
                    <div className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200">
                      <Image src={previewUrls[idx]} alt={idx === 0 ? "Before" : "After"} fill className="object-cover" unoptimized />
                      {!uploading && (
                        <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/80 transition-colors">✕</button>
                      )}
                    </div>
                  ) : (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <Camera className="w-6 h-6 text-zinc-400" />
                      <span className="text-[10px] text-zinc-400 mt-1">{idx === 0 ? "Before" : "After"}</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAddPhoto} />
                    </label>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Installation Notes (Optional)</label>
              <textarea 
                rows={2} 
                value={note} 
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Completed successfully. Left wire extra 5 meters."
                className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-bold text-amber-600 uppercase tracking-widest">Customer Completion PIN</label>
                <button 
                  onClick={handleResendPin}
                  disabled={resending}
                  className="text-[10px] font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
                >
                  {resending ? "Sending..." : "Resend PIN via WhatsApp"}
                </button>
              </div>
              <input 
                type="text" 
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter 6-digit PIN"
                className="w-full px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-700 font-bold tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-amber-500/50"
              />
            </div>

            {lead?.status !== "won" && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                <label className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Payment Collection</label>
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  Collect Payment (Cash / UPI)
                </button>
              </div>
            )}
            
            <button 
              onClick={() => setIsBlockageModalOpen(true)}
              className="w-full py-3.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 mb-3"
            >
              Report Blockage / Reschedule
            </button>
            <button 
              onClick={handleUploadAndComplete}
              disabled={files.length === 0 || uploading || pin.length !== 6}
              className="w-full py-4 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {uploading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Uploading {progress}%</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Mark Job as Won</>
              )}
            </button>
          </div>
        </div>
      )}

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
          <h3 className="text-xl font-black text-emerald-600 mb-1">Job Completed</h3>
          <p className="text-sm font-medium text-emerald-600/80 mb-6">You have successfully submitted proof for this installation.</p>
          
          {leadInstallationUrls.length > 0 && (
            <div className="w-full max-w-sm grid grid-cols-2 gap-3">
              {leadInstallationUrls.map((url: string, idx: number) => (
                <div key={idx}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 mb-1.5 text-center">
                    {idx === 0 ? "Before" : "After"}
                  </p>
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-emerald-500/20">
                    <Image src={url} alt={idx === 0 ? "Before" : "After"} fill className="object-cover" unoptimized />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
