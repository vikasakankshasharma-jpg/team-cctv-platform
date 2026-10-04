"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, Share2, Image as ImageIcon } from "lucide-react";

interface Template {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  codePosition: { x: number, y: number }; // Percentage from left, percentage from top
}

interface Props {
  partnerName: string;
  referralCode: string;
  isB2B: boolean;
  templates: Template[];
}

export function EdmGeneratorClient({ partnerName, referralCode, isB2B, templates }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!selectedTemplate) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = selectedTemplate.imageUrl;
    
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw background image
      ctx.drawImage(img, 0, 0);
      
      // Draw referral code text
      const x = (selectedTemplate.codePosition.x / 100) * canvas.width;
      const y = (selectedTemplate.codePosition.y / 100) * canvas.height;
      
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Draw text shadow/background for visibility
      ctx.font = "bold 64px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(referralCode, x, y);
      
      // Draw subtitle based on partner type
      ctx.font = "bold 32px sans-serif";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = "#ffcc00"; // yellow
      
      const benefitText = isB2B ? "Use Code for 3% OFF!" : "Use Code for ₹500 OFF!";
      ctx.fillText(benefitText, x, y + 60);

      setImageLoaded(true);
    };

    img.onerror = () => {
      // Fallback for missing images - draw a solid background
      canvas.width = 1080;
      canvas.height = 1080;
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1e3a8a'); // blue-900
      gradient.addColorStop(1, '#2563eb'); // blue-600
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      
      ctx.font = "bold 80px sans-serif";
      ctx.fillText("TEAM CCTV", canvas.width/2, 200);
      
      ctx.font = "40px sans-serif";
      ctx.fillText(selectedTemplate.name, canvas.width/2, 300);
      
      ctx.font = "bold 120px sans-serif";
      ctx.fillStyle = "#fbbf24"; // amber-400
      ctx.fillText(referralCode, canvas.width/2, canvas.height/2);
      
      ctx.font = "bold 50px sans-serif";
      ctx.fillStyle = "#ffffff";
      const benefitText = isB2B ? "Use Code for 3% OFF!" : "Use Code for ₹500 OFF!";
      ctx.fillText(benefitText, canvas.width/2, canvas.height/2 + 100);

      setImageLoaded(true);
    };

  }, [selectedTemplate, referralCode, isB2B]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `referral_${selectedTemplate.id}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Create blob from canvas
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;

      const file = new File([blob], `referral_${selectedTemplate.id}.png`, { type: 'image/png' });
      const benefitText = isB2B ? "3% OFF" : "₹500 OFF";
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'TEAM CCTV Referral Code',
          text: `Get ${benefitText} on your TEAM CCTV installation! Use my referral code: ${referralCode}. Visit cctvquotation.com`,
          files: [file],
        });
      } else {
        // Fallback to WhatsApp URL
        const msg = encodeURIComponent(`Get ${benefitText} on your TEAM CCTV installation! Use my referral code: *${referralCode}*. Visit https://cctvquotation.com`);
        window.open(`https://wa.me/?text=${msg}`, '_blank');
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">EDM Posters & Marketing</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Download personalized posters with your referral code to share on WhatsApp Status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Template Selection */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-4">Choose Template</h2>
          <div className="space-y-3">
            {templates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                  selectedTemplate.id === tpl.id 
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                }`}
              >
                <div>
                  <h3 className={`font-semibold ${selectedTemplate.id === tpl.id ? "text-blue-700 dark:text-blue-400" : "text-zinc-800 dark:text-zinc-200"}`}>
                    {tpl.name}
                  </h3>
                  <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded mt-1 inline-block">
                    {tpl.category}
                  </span>
                </div>
                {selectedTemplate.id === tpl.id && (
                  <div className="w-4 h-4 rounded-full bg-blue-600 border-4 border-blue-200 shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Col: Canvas Preview & Actions */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center p-8 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-h-[500px]">
          
          <div className="relative shadow-2xl rounded-lg overflow-hidden border-4 border-white dark:border-zinc-800 max-w-sm w-full aspect-[4/5] bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full object-cover block"
            />
          </div>

          <div className="flex gap-4 mt-8 w-full max-w-sm">
            <button 
              onClick={handleDownload}
              className="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
            >
              <Download size={20} />
              Download
            </button>
            <button 
              onClick={handleShare}
              className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
            >
              <Share2 size={20} />
              Share
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
