import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Zap,
  Target,
  Cpu,
  Layers,
  Star,
  Award,
  CreditCard,
  CheckCircle2,
  PhoneCall,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import FaqJsonLd from "@/components/landing/FaqJsonLd";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import { HomeVariationEstimator } from "@/components/landing/HomeVariationEstimator";
import { DealerComparisonTable } from "@/components/landing/DealerComparisonTable";
import { TrustAssuranceGrid } from "@/components/landing/TrustAssuranceGrid";
import { TranslatedText } from "@/components/shared/TranslatedText";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instant Free CCTV Quotation & CCTV Setup on EMI | Compare CP Plus, Hikvision & Prama",
  description: "Get an instant free CCTV quotation online. Complete CCTV setup with installation on easy EMI starting ₹649/mo. Compare multiple brand variations for your home or business.",
  keywords: ["Instant free CCTV quotation", "CCTV on EMI", "CCTV setup with installation", "CP Plus quotation", "Hikvision CCTV price", "CCTV price with installation", "CCTVQuotation", "TEAM CCTV"],
  alternates: {
    canonical: "https://cctvquotation.com",
  },
  openGraph: {
    title: "Instant Free CCTV Quotation & CCTV Setup on EMI | Compare Brands",
    description: "Instant CCTV quotation online. Complete setup with installation on EMI starting ₹649/month. Compare CP Plus, Hikvision, and Prama with transparent pricing.",
    type: "website",
    url: "https://cctvquotation.com",
    siteName: "CCTVQuotation",
    locale: "en_IN",
    images: [
      {
        url: "https://cctvquotation.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "CCTVQuotation — Free Instant CCTV Quotation & CCTV on EMI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Instant Free CCTV Quotation & CCTV Setup on EMI",
    description: "Get your exact CCTV installation cost online in 2 minutes. Easy EMI options starting ₹649/month.",
    images: ["https://cctvquotation.com/og-image.png"],
  },
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "CCTVQuotation",
    "alternateName": "TEAM CCTV",
    "image": "https://cctvquotation.com/og-image.jpg",
    "@id": "https://cctvquotation.com",
    "url": "https://cctvquotation.com",
    "telephone": "+91-7357612865",
    "priceRange": "₹₹",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Malviya Nagar",
      "addressLocality": "Jaipur",
      "postalCode": "302017",
      "addressRegion": "RJ",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 26.8524,
      "longitude": 75.8203
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "09:00",
      "closes": "20:00"
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#050B14] transition-colors duration-500">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Hero Section - Styled adhering strictly to the clean original theme */}
      <section className="relative px-4 sm:px-6 pt-10 pb-12 sm:pt-14 sm:pb-16 md:pt-16 md:pb-20 overflow-hidden">
        {/* Subtle grid pattern background matching the original theme */}
        <div className="absolute inset-0 -z-10 bg-slate-50 dark:bg-[#050B14]">
          <svg className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0ea5e9" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          
          {/* Trust Badge Strip */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-blue-500/20 text-slate-800 dark:text-blue-100 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-6 sm:mb-8 shadow-xs">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span><TranslatedText tKey="landing_hero_highlight" defaultText="100% Free Instant Quotations" /></span>
            </span>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-blue-500/50 hidden sm:block" />
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Easy EMI from ₹649/mo</span>
            </span>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-blue-500/50 hidden sm:block" />
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">18% GST Bill & Fitting Included</span>
          </div>

          {/* Core USP Headline in Authentic Blue-Indigo Theme */}
          <h1 className="text-3xl sm:text-5xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-5xl mb-4 sm:mb-6 leading-[1.25] md:leading-[1.18]">
            <span>CCTV Setup with Installation on </span>
            <span className="text-blue-600 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-blue-600 md:to-indigo-600 dark:text-blue-400">
              Easy EMI.
            </span>
            <br />
            <span className="text-slate-800 dark:text-slate-200 text-2xl sm:text-4xl lg:text-5xl font-extrabold">
              Compare Multiple Brand Variations for Your Site.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-blue-100/70 max-w-3xl mb-8 sm:mb-10 font-medium leading-relaxed">
            Get your exact quotation online in 2 minutes. Compare <strong className="text-slate-900 dark:text-white font-bold">CP Plus, Hikvision, and Prama</strong> packages side-by-side with transparent pricing. Full hardware, cabling, professional mounting, and mobile app setup included.
          </p>

          {/* Interactive Live Variation Estimator Widget */}
          <div className="w-full mb-8">
            <HomeVariationEstimator />
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] sm:text-xs font-black text-slate-400 dark:text-blue-300/50 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 18% GST Bill</span>
            <span>·</span>
            <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400" /> 500+ Installs</span>
            <span>·</span>
            <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-blue-500" /> BIS-ER Certified</span>
          </div>

        </div>
      </section>

      {/* 2. Four Core Customer Assurances (Trust Strip) */}
      <TrustAssuranceGrid />

      {/* 3. "CCTVQuotation vs Local CCTV Dealer" Table */}
      <DealerComparisonTable />

      {/* 4. Architecture Philosophy & 3-Step Journey */}
      <section className="bg-white dark:bg-zinc-950 transition-colors duration-500 py-12 md:py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-blue-600 dark:text-blue-500 font-black text-xs uppercase tracking-[0.4em] mb-3">
                <TranslatedText tKey="how_it_works" defaultText="Simple 3-Step Process" />
              </h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                From Online Quote to Live Cameras on Your Phone
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                { 
                  icon: Target, 
                  step: "01",
                  title: "Choose Your Cameras & Compare", 
                  desc: "Select your required cameras, pick between CP Plus, Hikvision or Prama, and see your exact monthly EMI or upfront discounted price." 
                },
                { 
                  icon: Cpu, 
                  step: "02",
                  title: "Book with ₹500 Token or Free Survey", 
                  desc: "Lock in your hardware pricing and installation date for just ₹500. Pay the remaining balance only after physical delivery and verification." 
                },
                { 
                  icon: Layers, 
                  step: "03",
                  title: "Certified Setup & Mobile Live View", 
                  desc: "Our verified technician completes cable routing, camera mounting, DVR setup, and connects high-speed live camera view to your smartphone." 
                },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center p-6 md:p-8 rounded-[32px] bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 shadow-xs hover:-translate-y-1.5 transition-all duration-300 group hover:shadow-lg dark:hover:shadow-none hover:border-blue-500/30">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md shrink-0 mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">Step {item.step}</span>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">{item.title}</h4>
                  <p className="text-slate-600 dark:text-zinc-400 font-medium leading-relaxed text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Final Call-to-Action & FAQ Section */}
      <section className="py-12 md:py-20 px-4 sm:px-6 relative overflow-hidden text-center bg-slate-50 dark:bg-[#050B14] transition-colors duration-500">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 dark:bg-blue-600/10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-500 mb-6 shadow-sm">
            <Zap className="w-7 h-7 sm:w-9 sm:h-9 fill-current" />
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
            Ready to secure your space <br className="hidden sm:block" /> with transparent pricing?
          </h2>
          <p className="text-slate-600 dark:text-blue-100/70 text-base sm:text-lg mb-8 font-medium max-w-xl text-center">
            2-minute setup. Multiple brand options. 18% GST invoice and manufacturer warranty included.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-12">
            <Link
              href="/wizard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Get Your Free Quotation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="https://wa.me/917357612865?text=Hi,%20I'm%20interested%20in%20CCTV%20Setup%20on%20EMI"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          <FaqAccordion />
          <FaqJsonLd />

          {/* Partner Trust Strip */}
          <div className="mt-16 sm:mt-20 flex flex-col items-center gap-6 sm:gap-8 w-full">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
              <TranslatedText tKey="trusted_partners" defaultText="Trusted Hardware Partners & Verified Installs" />
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 md:gap-16">
              <Image src="/partners/cpplus.png" alt="CP PLUS" width={120} height={40} className="h-6 md:h-8 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" />
              <Image src="/partners/dahua.png" alt="Dahua" width={120} height={40} className="h-6 md:h-8 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" />
              <Image src="/partners/hikvision.png" alt="Hikvision" width={120} height={40} className="h-6 md:h-8 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" />
              <Image src="/partners/prama.png" alt="PRAMA" width={120} height={40} className="h-6 md:h-8 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" />
              <div className="flex items-center gap-2 opacity-60 dark:opacity-40">
                <ShieldCheck className="w-6 h-6" />
                <span className="font-black text-base tracking-tight uppercase">BIS-ER</span>
              </div>
            </div>
            <div className="px-5 py-2.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <Star className="w-4 h-4 fill-emerald-500/50" />
              <span><TranslatedText tKey="preferred_platform" defaultText="India's Preferred CCTV Platform | 500+ Properties Secured" /></span>
            </div>
          </div>
          <div className="h-20 md:hidden" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
