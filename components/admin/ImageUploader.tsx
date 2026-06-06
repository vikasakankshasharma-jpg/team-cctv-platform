"use client";

import { useState, useRef } from "react";
import { storage } from "@/lib/firebase-client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { UploadCloud, Image as ImageIcon, X, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
}

export function ImageUploader({ value, onChange, folder = "products", label = "Product Image" }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Image must be smaller than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);

      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        },
        (error) => {
          console.error("Upload error:", error);
          toast.error("Failed to upload image");
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadURL);
          setIsUploading(false);
          toast.success("Image uploaded successfully");
        }
      );
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during upload");
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">{label}</label>
      
      {value ? (
        <div className="space-y-3">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 group">
            <Image 
              src={value} 
              alt={label} 
              fill 
              className="object-contain p-4"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-black uppercase tracking-widest transition-colors border border-white/40 backdrop-blur-sm"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="w-10 h-10 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors border border-red-500 backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-1">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Replace Image
            </button>
            <button 
              type="button" 
              onClick={() => onChange(null)} 
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              Remove Image
            </button>
          </div>
        </div>
      ) : (
        <div 
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`w-full aspect-video rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-4 transition-all ${
            isUploading ? "bg-blue-50 dark:bg-blue-900/10 border-blue-500/50" : "bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer group"
          }`}
        >
          {isUploading ? (
            <>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90 text-blue-100 dark:text-blue-900/30">
                   <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
                <svg className="absolute inset-0 w-full h-full -rotate-90 text-blue-500 transition-all duration-300" strokeDasharray="175" strokeDashoffset={175 - (progress / 100) * 175}>
                   <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tabular-nums">{Math.round(progress)}%</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Uploading to Storage...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-[24px] bg-white dark:bg-zinc-950 shadow-md border border-zinc-100 dark:border-zinc-800 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <UploadCloud className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="text-center px-4">
                <p className="text-xs font-black text-zinc-600 dark:text-zinc-300">Click or drag image to upload</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">PNG, JPG up to 5MB</p>
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
          // reset input so the same file can be selected again if needed
          if (e.target) e.target.value = '';
        }}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
}
