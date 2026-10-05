"use client";

import { useRef, useEffect, useState } from "react";
import { Download, Share2, ImageIcon, Sparkles, AlertCircle } from "lucide-react";

interface EDMGeneratorProps {
  referralCode: string;
}

const TEMPLATES = [
  {
    id: "diwali_special",
    name: "Festival Offer",
    badge: "Seasonal",
    type: "gradient",
    colors: ["#1e1b4b", "#3730a3"], // Deep Indigo to Purple
    textColor: "#ffffff",
    accentColor: "#fbbf24", // Amber
    title: "UPGRADE YOUR HOME SECURITY",
    subtitle: "Get professional CCTV installation with our festive offer.",
    offerText: "₹500 INSTANT DISCOUNT",
  },
  {
    id: "standard_discount",
    name: "General Offer",
    badge: "Standard",
    type: "gradient",
    colors: ["#020617", "#0f172a"], // Slate dark
    textColor: "#ffffff",
    accentColor: "#38bdf8", // Sky blue
    title: "PROTECT WHAT MATTERS",
    subtitle: "Premium CCTV cameras with 1-year warranty and free installation.",
    offerText: "CLAIM ₹500 OFF TODAY",
  },
  {
    id: "business_security",
    name: "Business Security",
    badge: "B2B",
    type: "gradient",
    colors: ["#042f2e", "#115e59"], // Teal
    textColor: "#ffffff",
    accentColor: "#34d399", // Emerald
    title: "SECURE YOUR BUSINESS",
    subtitle: "Industrial-grade surveillance solutions for shops and offices.",
    offerText: "GET ₹500 FLAT DISCOUNT",
  }
];

export function EDMGenerator({ referralCode }: EDMGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  const [downloading, setDownloading] = useState(false);

  const activeTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];

  useEffect(() => {
    drawCanvas();
  }, [activeTemplate, referralCode]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Standard WhatsApp Status portrait size (1080x1920 is standard, we use 1080x1080 for square posts or 1080x1350)
    // We will use 1080x1350 for a nice portrait poster.
    canvas.width = 1080;
    canvas.height = 1350;

    // Draw Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, activeTemplate.colors[0]);
    gradient.addColorStop(1, activeTemplate.colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Elements (Circles)
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.beginPath();
    ctx.arc(1080, 0, 400, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 1350, 600, 0, Math.PI * 2);
    ctx.fill();

    // Brand Logo/Header Area
    ctx.fillStyle = activeTemplate.textColor;
    ctx.font = "bold 50px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TEAM CCTV", canvas.width / 2, 150);
    
    ctx.font = "600 30px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("PREMIUM SECURITY SYSTEMS", canvas.width / 2, 200);

    // Main Title
    ctx.fillStyle = activeTemplate.accentColor;
    ctx.font = "900 75px sans-serif";
    ctx.fillText(activeTemplate.title, canvas.width / 2, 450);

    // Subtitle
    ctx.fillStyle = activeTemplate.textColor;
    ctx.font = "400 40px sans-serif";
    // Multiline subtitle naive wrap
    const words = activeTemplate.subtitle.split(" ");
    let line = "";
    let y = 550;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 900 && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + " ";
        y += 60;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    // Offer Highlight Box
    const boxY = 800;
    const boxHeight = 120;
    ctx.fillStyle = activeTemplate.accentColor;
    ctx.roundRect ? ctx.roundRect(140, boxY, 800, boxHeight, 20) : ctx.fillRect(140, boxY, 800, boxHeight); // Fallback
    ctx.fill();

    ctx.fillStyle = "#000000"; // Dark text for contrast inside the box
    ctx.font = "900 60px sans-serif";
    ctx.fillText(activeTemplate.offerText, canvas.width / 2, boxY + 80);

    // Referral Code Section
    ctx.fillStyle = activeTemplate.textColor;
    ctx.font = "600 40px sans-serif";
    ctx.fillText("USE THIS CODE AT CHECKOUT:", canvas.width / 2, 1050);

    // Dashed Referral Box
    ctx.setLineDash([15, 15]);
    ctx.lineWidth = 6;
    ctx.strokeStyle = activeTemplate.accentColor;
    ctx.strokeRect(240, 1100, 600, 120);
    ctx.setLineDash([]);

    ctx.fillStyle = activeTemplate.accentColor;
    ctx.font = "900 70px monospace";
    ctx.fillText(referralCode, canvas.width / 2, 1185);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setDownloading(true);
    
    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement("a");
      link.download = `TEAM-CCTV-Offer-${referralCode}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Failed to generate image", e);
      alert("Could not generate image. Please try again.");
    } finally {
      setTimeout(() => setDownloading(false), 500);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] p-6 lg:p-8 shadow-xl dark:shadow-2xl mb-8">
      
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Templates & Controls */}
        <div className="w-full md:w-1/3 flex flex-col space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Marketing Hub</span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              EDM Poster Generator
            </h2>
            <p className="text-sm font-medium text-zinc-500 mt-2">
              Create instant, high-quality promotional posters with your referral code automatically embedded.
            </p>
          </div>

          <div className="space-y-3 flex-1">
            <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-1">Select a Template</h3>
            
            {TEMPLATES.map(template => {
              const isActive = selectedTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${
                    isActive 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-md shadow-blue-500/10"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-black ${isActive ? "text-blue-700 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                      {template.name}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      isActive ? "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {template.badge}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-zinc-500 line-clamp-1">{template.title}</p>
                </button>
              );
            })}
          </div>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
              Download the image and post it to your WhatsApp Status, Instagram Story, or Facebook. Don't forget to include your direct link in the caption!
            </p>
          </div>
        </div>

        {/* Right Side: Live Canvas Preview */}
        <div className="w-full md:w-2/3 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950/40 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800/50">
          <div className="relative w-full max-w-[320px] aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-800">
            {/* The canvas is rendered large for quality, but scaled down via CSS for preview */}
            <canvas 
              ref={canvasRef} 
              className="w-full h-full object-contain bg-zinc-100"
            />
          </div>

          <div className="flex items-center justify-center gap-4 mt-8 w-full max-w-[320px]">
            <button 
              onClick={downloadImage}
              disabled={downloading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {downloading ? "Saving..." : "Download PNG"} <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
