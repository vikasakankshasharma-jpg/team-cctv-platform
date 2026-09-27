"use client";

import { useState, useRef, useEffect } from "react";
import { X, PenTool, CheckCircle2, Loader2, Camera, Barcode } from "lucide-react";
import { toast } from "sonner";
import BarcodeScanner from "./BarcodeScanner"; // Re-using existing scanner

interface JobSignoffModalProps {
  leadId: string;
  onClose: () => void;
  onSuccess: () => void;
  productsToInstall: any[]; // The products from the quote
}

export function JobSignoffModal({ leadId, onClose, onSuccess, productsToInstall }: JobSignoffModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scannedSerials, setScannedSerials] = useState<Record<string, string[]>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeScanner, setActiveScanner] = useState<string | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
      }
    }
  }, []);

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleScanSuccess = (productId: string, code: string) => {
    setScannedSerials(prev => {
      const existing = prev[productId] || [];
      if (existing.includes(code)) return prev;
      return { ...prev, [productId]: [...existing, code] };
    });
    toast.success(`Scanned: ${code}`);
    setActiveScanner(null); // Close scanner
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Quick check if canvas is empty
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      return toast.error("Please ask the customer to sign.");
    }

    if (photos.length === 0) {
      return toast.error("Please upload at least 1 installation photo.");
    }

    setIsSubmitting(true);
    try {
      const signatureDataUrl = canvas.toDataURL("image/png");
      
      // Upload photos (simulated here for brevity, assume they get uploaded to Storage)
      const photoUrls = ["https://placeholder.co/400"]; // Mock URL

      const res = await fetch(`/api/installer/leads/${leadId}/signoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature: signatureDataUrl,
          serials: scannedSerials,
          photos: photoUrls
        })
      });

      if (!res.ok) throw new Error("Failed to sign-off");
      
      toast.success("Job Signed Off Successfully!");
      onSuccess();
    } catch (err) {
      toast.error("Failed to complete job");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in slide-in-from-bottom-10">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        <div className="p-6 border-b sticky top-0 bg-white z-10 rounded-t-3xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">Job Sign-Off</h2>
            <p className="text-gray-500 text-sm">Scan serials and capture customer signature.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Step 1: Scan Serials */}
          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-blue-700">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">1</div>
              Scan Hardware Serials
            </h3>
            
            <div className="space-y-3">
              {productsToInstall.map(p => (
                <div key={p.id} className="border rounded-xl p-4 bg-gray-50 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm">{p.name}</div>
                    <div className="text-xs text-gray-500">Qty: {p.quantity}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(scannedSerials[p.id] || []).map(code => (
                        <span key={code} className="px-2 py-1 bg-white border text-xs rounded font-mono shadow-sm">{code}</span>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveScanner(p.id)}
                    className="p-3 bg-white rounded-xl shadow border text-blue-600 hover:bg-blue-50"
                  >
                    <Barcode className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            
            {activeScanner && (
              <div className="mt-4 border-2 border-blue-500 rounded-xl overflow-hidden p-2 bg-black">
                <div className="text-white text-xs text-center mb-2 flex justify-between px-2">
                  <span>Scanning...</span>
                  <button onClick={() => setActiveScanner(null)}>Cancel</button>
                </div>
                <BarcodeScanner onScan={(code) => handleScanSuccess(activeScanner, code)} />
              </div>
            )}
          </div>

          {/* Step 2: Photos */}
          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-blue-700">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">2</div>
              Installation Photos
            </h3>
            <label className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors">
              <Camera className="w-8 h-8 mb-2" />
              <span className="font-bold">Tap to take photos</span>
              <span className="text-xs mt-1">Upload {photos.length} photos</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                if (e.target.files) setPhotos(Array.from(e.target.files));
              }} />
            </label>
          </div>

          {/* Step 3: Signature */}
          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-blue-700">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">3</div>
              Customer Signature
            </h3>
            <div className="border-2 rounded-xl bg-gray-50 overflow-hidden relative touch-none">
              <div className="absolute top-2 right-2 flex gap-2">
                <button onClick={clearSignature} className="px-3 py-1 bg-white shadow rounded-lg text-xs font-bold text-gray-500">Clear</button>
              </div>
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full h-[200px] bg-white cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="text-center p-2 text-xs text-gray-400 bg-gray-50 border-t">
                I confirm the installation is completed to my satisfaction.
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-white sticky bottom-0 rounded-b-3xl">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {isSubmitting ? "Finalizing..." : "Complete & Generate Warranty"}
          </button>
        </div>
      </div>
    </div>
  );
}
