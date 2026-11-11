"use client";

import { useRef, useEffect, useState } from "react";
import { Download, AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface EDMGeneratorProps {
  referralCode: string;
  templates?: any[];
}

const DEFAULT_TEMPLATES = [
  {
    id: "diwali_special",
    name: "Festival Offer (Diwali)",
    nameKey: "prt_tpl_diwali_name",
    badge: "Seasonal",
    badgeKey: "prt_tpl_seasonal",
    type: "image",
    imageUrl: "https://images.unsplash.com/photo-1572947113192-3c1a3db613e5?auto=format&fit=crop&q=80&w=1080&h=1350",
    textColor: "#ffffff",
    accentColor: "#fbbf24", // Amber
    title: "UPGRADE YOUR HOME SECURITY",
    titleKey: "prt_tpl_diwali_title",
    subtitle: "Get professional CCTV installation with our festive offer.",
    subtitleKey: "prt_tpl_diwali_sub",
    offerText: "₹500 INSTANT DISCOUNT",
    offerTextKey: "prt_tpl_diwali_offer",
  },
  {
    id: "standard_discount",
    name: "Home Security",
    nameKey: "prt_tpl_home_name",
    badge: "Standard",
    badgeKey: "wz_standard",
    type: "image",
    imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=1080&h=1350", // Smart home/security vibe
    textColor: "#ffffff",
    accentColor: "#38bdf8", // Sky blue
    title: "PROTECT WHAT MATTERS",
    titleKey: "prt_tpl_home_title",
    subtitle: "Branded CCTV cameras with 1-year warranty and neat installation.",
    subtitleKey: "prt_tpl_home_sub",
    offerText: "CLAIM ₹500 OFF TODAY",
    offerTextKey: "prt_tpl_home_offer",
  },
  {
    id: "business_security",
    name: "Business Security",
    nameKey: "prt_tpl_biz_name",
    badge: "B2B",
    badgeKey: "",
    type: "image",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1080&h=1350", // Modern office
    textColor: "#ffffff",
    accentColor: "#34d399", // Emerald
    title: "SECURE YOUR BUSINESS",
    titleKey: "prt_tpl_biz_title",
    subtitle: "Heavy-duty surveillance solutions for shops and offices.",
    subtitleKey: "prt_tpl_biz_sub",
    offerText: "GET ₹500 FLAT DISCOUNT",
    offerTextKey: "prt_tpl_biz_offer",
  }
];

function splitGraphemes(text: string): string[] {
  try {
    if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
      const seg = new (Intl as any).Segmenter("en", { granularity: "grapheme" });
      return Array.from(seg.segment(text), (s: any) => s.segment);
    }
  } catch {
    // Fallback below
  }
  return Array.from(text);
}

const CANVAS_FONT_MAP: Record<string, { family: string; file: string }> = {
  en: { family: "EDMNotoSans", file: "NotoSans" },
  hi: { family: "EDMNotoDevanagari", file: "NotoSansDevanagari" },
  mr: { family: "EDMNotoDevanagari", file: "NotoSansDevanagari" },
  gu: { family: "EDMNotoGujarati", file: "NotoSansGujarati" },
  ta: { family: "EDMNotoTamil", file: "NotoSansTamil" },
  te: { family: "EDMNotoTelugu", file: "NotoSansTelugu" },
  kn: { family: "EDMNotoKannada", file: "NotoSansKannada" },
  bn: { family: "EDMNotoBengali", file: "NotoSansBengali" },
  ml: { family: "EDMNotoMalayalam", file: "NotoSansMalayalam" },
  pa: { family: "EDMNotoGurmukhi", file: "NotoSansGurmukhi" },
  or: { family: "EDMNotoOriya", file: "NotoSansOriya" },
};

const loadedCanvasFontPromises = new Map<string, Promise<string>>();

async function loadFontFacePair(family: string, filePrefix: string) {
  if (typeof window === "undefined" || !("FontFace" in window) || !document.fonts) return;
  const specs = [
    { file: `${filePrefix}-Regular.ttf`, weight: "400" },
    { file: `${filePrefix}-Bold.ttf`, weight: "700" },
    { file: `${filePrefix}-Bold.ttf`, weight: "900" },
  ];
  await Promise.all(
    specs.map(async ({ file, weight }) => {
      try {
        const face = new FontFace(family, `url(/fonts/indic/${file})`, { weight });
        const loaded = await face.load();
        document.fonts.add(loaded);
      } catch {
        // Non-fatal; fallback system font handles rendering
      }
    })
  );
}

function ensureCanvasFont(localeCode: string): Promise<string> {
  const meta = CANVAS_FONT_MAP[localeCode] || CANVAS_FONT_MAP.en;
  const cached = loadedCanvasFontPromises.get(meta.family);
  if (cached) return cached;

  const task = (async () => {
    await Promise.all([
      loadFontFacePair("EDMNotoSans", "NotoSans"),
      meta.family !== "EDMNotoSans" ? loadFontFacePair(meta.family, meta.file) : Promise.resolve(),
    ]);
    try {
      await document.fonts.ready;
    } catch {
      // Ignore
    }
    return meta.family === "EDMNotoSans"
      ? '"EDMNotoSans", sans-serif'
      : `"${meta.family}", "EDMNotoSans", sans-serif`;
  })();

  loadedCanvasFontPromises.set(meta.family, task);
  return task;
}

function layoutWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) {
      lines.push(line);
      line = "";
    }
    if (ctx.measureText(word).width <= maxWidth) {
      line = word;
    } else {
      // Break overlong word cleanly on grapheme boundaries
      let chunk = "";
      for (const g of splitGraphemes(word)) {
        const testChunk = chunk + g;
        if (ctx.measureText(testChunk).width > maxWidth && chunk) {
          lines.push(chunk);
          chunk = g;
        } else {
          chunk = testChunk;
        }
      }
      if (chunk) line = chunk;
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [text];
}

function drawFittedWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  maxBottomY: number,
  initialFontSize: number,
  minFontSize: number,
  fontWeight: string,
  fontStack: string
) {
  let fontSize = initialFontSize;
  let lineHeight = Math.round(fontSize * 1.24);
  let lines: string[] = [text];

  while (fontSize >= minFontSize) {
    ctx.font = `${fontWeight} ${fontSize}px ${fontStack}`;
    lineHeight = Math.round(fontSize * 1.24);
    lines = layoutWrappedLines(ctx, text, maxWidth);
    const endY = startY + (lines.length - 1) * lineHeight;
    if (endY <= maxBottomY) break;
    fontSize -= 4;
  }

  let y = startY;
  for (const l of lines) {
    ctx.fillText(l, x, y);
    y += lineHeight;
  }
  return y;
}

export function EDMGenerator({ referralCode, templates = [] }: EDMGeneratorProps) {
  const { t, locale } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const activeTemplates = templates.length > 0 ? templates : DEFAULT_TEMPLATES;
  
  const [selectedTemplateId, setSelectedTemplateId] = useState(activeTemplates[0]?.id);
  const [downloading, setDownloading] = useState(false);

  // If templates array changes, make sure we have a valid selected template
  useEffect(() => {
    if (!activeTemplates.find(tpl => tpl.id === selectedTemplateId)) {
      setSelectedTemplateId(activeTemplates[0]?.id);
    }
  }, [activeTemplates, selectedTemplateId]);

  const activeTemplate = activeTemplates.find(tpl => tpl.id === selectedTemplateId) || activeTemplates[0];
  const getLabel = (tpl: any, field: "name" | "badge" | "title" | "subtitle" | "offerText") => {
    const key = tpl?.[`${field}Key`];
    const fallback = tpl?.[field] || "";
    return key ? t(key, fallback) : fallback;
  };

  useEffect(() => {
    let cancelled = false;
    drawCanvas(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [activeTemplate, referralCode, t, locale]);

  const drawCanvas = async (isCancelled: () => boolean = () => false) => {
    const canvas = canvasRef.current;
    if (!canvas || !activeTemplate) return;

    const fontStack = await ensureCanvasFont(locale);
    if (isCancelled()) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1350;

    // Helper to draw text and UI
    const drawUI = () => {
      if (isCancelled()) return;
      // Dark overlay for text readability
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Brand Logo/Header Area
      ctx.fillStyle = activeTemplate.textColor;
      ctx.font = `700 50px ${fontStack}`;
      ctx.textAlign = "center";
      ctx.fillText("TEAM CCTV", canvas.width / 2, 150);
      
      ctx.font = `700 28px ${fontStack}`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillText(t("prt_edm_canvas_tagline", "COMPLETE SECURITY SYSTEMS"), canvas.width / 2, 200, 960);

      // Main Title (auto-scaled & grapheme-wrapped so Indic headlines never clip boxY=800)
      ctx.fillStyle = activeTemplate.accentColor;
      const nextY = drawFittedWrappedText(
        ctx,
        getLabel(activeTemplate, "title"),
        canvas.width / 2,
        360,
        920,
        545,
        64,
        40,
        "900",
        fontStack
      );

      // Subtitle
      ctx.fillStyle = activeTemplate.textColor;
      drawFittedWrappedText(
        ctx,
        getLabel(activeTemplate, "subtitle"),
        canvas.width / 2,
        Math.max(545, nextY + 20),
        900,
        755,
        36,
        24,
        "400",
        fontStack
      );

      // Offer Highlight Box
      const boxY = 800;
      const boxHeight = 120;
      ctx.fillStyle = activeTemplate.accentColor;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(100, boxY, 880, boxHeight, 20) : ctx.fillRect(100, boxY, 880, boxHeight);
      ctx.fill();

      ctx.fillStyle = "#000000";
      const offerText = getLabel(activeTemplate, "offerText");
      let offerFontSize = 46;
      while (offerFontSize >= 26) {
        ctx.font = `900 ${offerFontSize}px ${fontStack}`;
        if (ctx.measureText(offerText).width <= 820) break;
        offerFontSize -= 2;
      }
      ctx.fillText(offerText, canvas.width / 2, boxY + 74, 840);

      // Referral Code Section
      ctx.fillStyle = activeTemplate.textColor;
      ctx.font = `700 34px ${fontStack}`;
      ctx.fillText(t("prt_edm_use_code_checkout", "USE THIS CODE AT CHECKOUT:"), canvas.width / 2, 1045, 920);

      // Dashed Referral Box
      ctx.setLineDash([15, 15]);
      ctx.lineWidth = 6;
      ctx.strokeStyle = activeTemplate.accentColor;
      ctx.strokeRect(240, 1100, 600, 120);
      ctx.setLineDash([]);

      ctx.fillStyle = activeTemplate.accentColor;
      ctx.font = '900 70px "EDMNotoSans", monospace';
      ctx.fillText(referralCode, canvas.width / 2, 1185);
    };

    if (activeTemplate.type === "image" && activeTemplate.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Prevents canvas tainting when downloading
      img.onload = () => {
        if (isCancelled()) return;
        // Draw the image filling the canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawUI();
      };
      img.onerror = () => {
        if (isCancelled()) return;
        ctx.fillStyle = "#111827";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawUI();
      };
      img.src = activeTemplate.imageUrl;
    } else {
      // Fallback to solid dark background
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawUI();
    }
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
      alert(t("prt_edm_err_img", "Could not generate image. Please try again."));
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
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
              <span className={`text-[10px] font-black text-zinc-400 dark:text-zinc-500 ${locale === "en" ? "uppercase tracking-widest" : "normal-case tracking-normal"}`}>{t("prt_edm_hub", "Marketing Hub")}</span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              {t("prt_edm_gen_title", "EDM Poster Generator")}
            </h2>
            <p className="text-sm font-medium text-zinc-500 mt-2">
              {t("prt_edm_gen_sub", "Create instant promotional posters with your referral code automatically embedded.")}
            </p>
          </div>

          <div className="space-y-3 flex-1">
            <h3 className={`text-[11px] font-black text-zinc-400 mb-1 ${locale === "en" ? "uppercase tracking-widest" : "normal-case tracking-normal"}`}>{t("prt_edm_sel_tpl", "Select a Template")}</h3>
            
            {activeTemplates.map((template: any) => {
              const isActive = selectedTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`w-full text-left p-4 h-auto whitespace-normal rounded-2xl transition-all border ${
                    isActive 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-md shadow-blue-500/10"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className={`font-black ${isActive ? "text-blue-700 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                      {getLabel(template, "name")}
                    </span>
                    <span className={`${locale === "en" ? "text-[9px] uppercase tracking-widest" : "text-[11px] normal-case tracking-normal"} font-black px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                      isActive ? "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {getLabel(template, "badge")}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-zinc-500 line-clamp-2">{getLabel(template, "title")}</p>
                </button>
              );
            })}
          </div>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
              {t("prt_edm_wa_tip", "Download the image and post it to your WhatsApp Status, Instagram Story, or Facebook. Include your direct link in the caption!")}
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
              className={`flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 h-auto whitespace-normal rounded-xl text-sm font-black transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${locale === "en" ? "uppercase tracking-widest" : "normal-case tracking-normal"}`}
            >
              {downloading ? t("prt_edm_saving", "Saving...") : t("prt_edm_dl_png", "Download PNG")} <Download className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
