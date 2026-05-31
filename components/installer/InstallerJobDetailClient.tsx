"use client";

import { useState } from "react";
import { updateLeadInstallationProof } from "@/app/actions/leads";
import { toast } from "sonner";
import { storage } from "@/lib/firebase-client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { MapPin, Phone, User, Package, Camera, CheckCircle2, ArrowLeft, Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";
import type { Lead } from "@/types";

export default function InstallerJobDetailClient({ 
  leadId, 
  lead, 
  hardware, 
  isAssigned 
}: { 
  leadId: string, 
  lead: Partial<Lead>, 
  hardware: any[], 
  isAssigned: boolean 
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUploadAndComplete = async () => {
    if (!file) {
      toast.error("Please select a photo as proof of installation.");
      return;
    }
    
    setUploading(true);
    try {
      const filename = `installations/${leadId}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filename);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(p);
        },
        (error) => {
          console.error(error);
          toast.error("Upload failed");
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateLeadInstallationProof(leadId, downloadURL, "won", note);
          toast.success("Job marked as completed successfully!");
          setUploading(false);
        }
      );
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
      setUploading(false);
    }
  };

  const isCompleted = lead.status === "won" || !!(lead as any).installation_proof_url;

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

      {/* Hardware Requirements */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> Hardware Required
        </h3>
        
        {hardware && hardware.length > 0 ? (
          <div className="divide-y divide-border/50">
            {hardware.map((item, idx) => (
              <div key={idx} className="py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="font-bold text-sm bg-muted px-2 py-1 rounded-lg">x {item.quantity}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic py-4">No specific hardware configuration linked yet. Check dispatch notes or contact Admin.</div>
        )}
      </div>

      {/* Proof of Installation */}
      {isAssigned && !isCompleted && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" /> Proof of Installation
          </h3>
          <p className="text-sm text-muted-foreground">Upload a clear photo of the completed site installation to mark this job as Won and release payment.</p>

          <div className="space-y-4">
            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors group">
                <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                <span className="text-sm font-medium text-muted-foreground">Click to upload photo</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                {!uploading && (
                  <button onClick={() => { setFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black/80 transition-colors">
                    Change Photo
                  </button>
                )}
              </div>
            )}

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

            <button 
              onClick={handleUploadAndComplete}
              disabled={!file || uploading}
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

      {/* Already Completed State */}
      {isCompleted && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-emerald-600 mb-1">Job Completed</h3>
          <p className="text-sm font-medium text-emerald-600/80 mb-6">You have successfully submitted proof for this installation.</p>
          
          {(lead as any).installation_proof_url && (
            <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-emerald-500/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={(lead as any).installation_proof_url} alt="Installation Proof" className="w-full h-auto" />
            </div>
          )}
        </div>
      )}

    </div>
  );
}
