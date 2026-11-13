import { Font } from "@react-pdf/renderer";
import type { LocaleCode } from "@/lib/i18n/mapping";
import { isValidLocale } from "@/lib/i18n/mapping";

const registeredFamilies = new Set<string>();
let hyphenationRegistered = false;

const LOCALE_FONT_META: Record<
  LocaleCode,
  { family: string; filePrefix: string }
> = {
  en: { family: "NotoSans", filePrefix: "NotoSans" },
  hi: { family: "NotoSansDevanagari", filePrefix: "NotoSansDevanagari" },
  mr: { family: "NotoSansDevanagari", filePrefix: "NotoSansDevanagari" },
  gu: { family: "NotoSansGujarati", filePrefix: "NotoSansGujarati" },
  ta: { family: "NotoSansTamil", filePrefix: "NotoSansTamil" },
  te: { family: "NotoSansTelugu", filePrefix: "NotoSansTelugu" },
  kn: { family: "NotoSansKannada", filePrefix: "NotoSansKannada" },
  bn: { family: "NotoSansBengali", filePrefix: "NotoSansBengali" },
  ml: { family: "NotoSansMalayalam", filePrefix: "NotoSansMalayalam" },
  pa: { family: "NotoSansGurmukhi", filePrefix: "NotoSansGurmukhi" },
  or: { family: "NotoSansOriya", filePrefix: "NotoSansOriya" },
};

function resolveFontSrc(fileName: string): string {
  if (typeof window === "undefined") {
    try {
      const pathMod = eval("require")("path") as typeof import("path");
      const fsMod = eval("require")("fs") as typeof import("fs");
      const absPath = pathMod.join(process.cwd(), "public", "fonts", "indic", fileName);
      if (fsMod.existsSync(absPath)) {
        return absPath;
      }
    } catch {
      // Fallback to public URL below
    }
  }
  return `/fonts/indic/${fileName}`;
}

function registerFontPair(family: string, filePrefix: string) {
  if (registeredFamilies.has(family)) return;
  try {
    Font.register({
      family,
      fonts: [
        { src: resolveFontSrc(`${filePrefix}-Regular.ttf`), fontWeight: 400 },
        { src: resolveFontSrc(`${filePrefix}-Bold.ttf`), fontWeight: 700 },
      ],
    });
    // Pre-populate fontkit's internal glyph->codePoints cache via glyphForCodePoint()
    // before TTFSubset._addGlyph() can visit composite sub-glyphs (e.g. U+00B7 -> '.')
    // with empty codePoints=[], which otherwise corrupts ToUnicode CMaps and line wrapping.
    const fontFamilies = (Font as any).getRegisteredFonts?.();
    const sources: Array<any> = fontFamilies?.[family]?.sources || [];
    for (const srcObj of sources) {
      if (!srcObj || srcObj.__warmPatched || typeof srcObj.load !== "function") continue;
      srcObj.__warmPatched = true;
      const origLoad = srcObj.load.bind(srcObj);
      srcObj.load = async () => {
        const res = await origLoad();
        const fontData = srcObj.data;
        if (fontData && !fontData.__glyphsWarmed && typeof fontData.glyphForCodePoint === "function") {
          fontData.__glyphsWarmed = true;
          const cps: number[] = Array.isArray(fontData.characterSet) ? fontData.characterSet : [];
          for (let i = 0; i < cps.length; i++) {
            try {
              fontData.glyphForCodePoint(cps[i]);
            } catch {
              // Non-fatal
            }
          }
        }
        return res;
      };
    }
    registeredFamilies.add(family);
  } catch (err) {
    console.warn(`[PDF Fonts] Failed to register ${family}:`, err);
  }
}

export function normalizePdfLocale(raw?: unknown): LocaleCode {
  if (typeof raw === "string") {
    const clean = raw.trim().toLowerCase();
    if (isValidLocale(clean)) return clean;
  }
  return "en";
}

/**
 * Registers clean local Noto Sans TTF fonts (Latin + active Indic script) for @react-pdf/renderer
 * and returns a fontFamily value ready for `<Page style={{ fontFamily }}>`.
 */
export function ensurePdfFontsForLocale(rawLocale?: unknown): string | string[] {
  const locale = normalizePdfLocale(rawLocale);

  if (!hyphenationRegistered) {
    try {
      Font.registerHyphenationCallback((word) => [word]);
      hyphenationRegistered = true;
    } catch {
      // Non-fatal
    }
  }

  // Always ensure base Latin + ₹ symbol font is available
  registerFontPair("NotoSans", "NotoSans");

  if (locale === "en") {
    return "NotoSans";
  }

  const meta = LOCALE_FONT_META[locale];
  registerFontPair(meta.family, meta.filePrefix);
  return [meta.family, "NotoSans"];
}

export function getPdfFontFamily(rawLocale?: unknown): string | string[] {
  return ensurePdfFontsForLocale(rawLocale);
}
