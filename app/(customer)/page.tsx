import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Cpu,
  Layers,
  ChevronRight,
  Star,
  Award,
  Globe,
} from "lucide-react";
import FaqJsonLd from "@/components/landing/FaqJsonLd";
import { PincodeWidget } from "@/components/landing/PincodeWidget";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = {
  title: "CCTVQuotation | Get Free & Instant CCTV Installation Price Online",
  description: "Get an instant CCTV camera price with professional installation. Answer a few simple questions and receive three dynamic quotes for CP Plus & Prama systems with 18% GST included.",
  keywords: ["CCTV price with installation", "CCTV camera price", "Online CCTV quotation", "CCTVQuotation", "TEAM CCTV"],
  alternates: {
    canonical: "https://cctvquotation.com",
  },
  openGraph: {
    title: "CCTVQuotation | Get Free & Instant CCTV Installation Price Online",
    description: "Get an instant CCTV camera price with professional installation. Answer a few simple questions and receive three dynamic quotes for CP Plus & Prama systems with 18% GST included.",
    type: "website",
    url: "https://cctvquotation.com",
    siteName: "CCTVQuotation",
    locale: "en_IN",
    images: [
      {
        url: "https://cctvquotation.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "CCTVQuotation — Free Instant CCTV Quotation Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CCTVQuotation | Get Free & Instant CCTV Installation Price Online",
    description: "Get an instant CCTV camera price with professional installation. Answer a few simple questions and receive three dynamic quotes for CP Plus & Prama systems with 18% GST included.",
    images: ["https://cctvquotation.com/og-image.png"],
  },
};

export default function LandingPage() {
  // Structured Data for Local Business
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "CCTVQuotation",
    "alternateName": "TEAM CCTV",
    "image": "https://cctvquotation.com/og-image.jpg",
    "@id": "https://cctvquotation.com",
    "url": "https://cctvquotation.com",
    "telephone": "+91-9772699395",
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

      {/* 1. Elite Hero Hub: Smart City Theme */}
      <section className="relative px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Smart City Background Elements */}
        <div className="absolute inset-0 overflow-hidden -z-10 bg-slate-50 dark:bg-[#050B14] transition-colors duration-500">
          {/* Glowing City Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:[mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          
          {/* Neon Glow Orbs */}
          <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-blue-600/20 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen" />
          
          {/* Horizon Line Glow */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
          <div className="absolute bottom-0 left-0 w-full h-[200px] bg-gradient-to-t from-blue-900/10 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col items-center lg:items-start text-center lg:text-left relative z-10">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-blue-500/20 text-slate-800 dark:text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-8 sm:mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>Enterprise Smart City Security</span>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-blue-500/50 hidden sm:block" />
            <span className="text-emerald-700 dark:text-emerald-400 hidden sm:inline">100% Free Quotes</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter max-w-5xl mb-6 sm:mb-8 md:mb-10 leading-[1.05] transition-colors">
            Secure Your Property. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:via-cyan-300 dark:to-emerald-400 drop-shadow-sm">
              Empower Your City.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-2xl text-slate-600 dark:text-blue-100/70 max-w-2xl mb-8 sm:mb-10 md:mb-16 font-medium leading-relaxed transition-colors">
            Get an exact price for your CCTV setup in under 2 minutes. Tap into the intelligence of modern security networks.
          </p>

          <div className="w-full mb-8 sm:mb-10 md:mb-16 relative group">
             {/* Radar Pulse Effect behind Widget */}
             <div className="absolute inset-0 bg-blue-500/20 rounded-[32px] sm:rounded-[48px] animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <div className="absolute -inset-4 bg-blue-500/10 dark:bg-blue-500/5 blur-xl rounded-full -z-10 transition-colors" />
             <PincodeWidget variant="hero" />
          </div>

          <div className="flex sm:hidden items-center gap-4 mt-8 text-[10px] font-black text-blue-300/50 uppercase tracking-widest">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> 18% GST Bill</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> 500+ Installs</span>
          </div>
        </div>
      </section>

      {/* 2. Architecture Philosophy Section */}
      <section className="bg-white dark:bg-zinc-950 transition-colors duration-500 py-16 sm:py-24 md:py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 dark:via-blue-900 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="space-y-12 sm:space-y-16">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-blue-600 dark:text-blue-500 font-black text-xs uppercase tracking-[0.4em] mb-4 sm:mb-6">How It Works</h2>
              <h3 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none transition-colors">Smart Security <br /> Made for You.</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                { icon: Target, title: "Perfect Coverage", desc: "We make sure every corner of your property is covered, leaving no blind spots for complete peace of mind." },
                { icon: Cpu, title: "Right Cameras", desc: "We'll suggest the best camera technology for your specific needs, whether it's a small home or a large warehouse." },
                { icon: Layers, title: "Clear Pricing", desc: "Get three easy-to-understand price options (Value, Professional, and Elite) so you can choose what fits your budget." },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center p-8 rounded-[32px] bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-sm hover:-translate-y-1.5 transition-all duration-300 group hover:shadow-lg dark:hover:shadow-none hover:border-blue-500/30">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md shrink-0 mb-6">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-3 transition-colors">{item.title}</h4>
                  <p className="text-slate-600 dark:text-zinc-400 font-medium leading-relaxed text-sm transition-colors">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Final Deployment CTA */}
      <section className="py-16 sm:py-24 md:py-20 px-4 sm:px-6 relative overflow-hidden text-center bg-slate-50 dark:bg-[#050B14] transition-colors duration-500">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-100 dark:bg-blue-600/10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-500 mb-8 sm:mb-12 animate-bounce shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Zap className="w-7 h-7 sm:w-10 sm:h-10 fill-current" />
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter mb-5 sm:mb-8 leading-[0.9] sm:leading-[0.85] transition-colors">
            Secure your space <br className="hidden sm:block" /> today.
          </h2>
          <p className="text-slate-600 dark:text-blue-100/70 text-base sm:text-xl md:text-2xl mb-12 sm:mb-16 font-medium max-w-2xl text-center transition-colors">
            2-minute setup. No hidden costs. 18% GST included in all plans.
          </p>

          <FaqAccordion />
          <FaqJsonLd />

          {/* Partner Trust Strip */}
          <div className="mt-16 sm:mt-20 flex flex-col items-center gap-6 sm:gap-8 w-full">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Trusted Hardware Partners &amp; Verified Installs</div>
            <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 md:gap-16 lg:gap-20">
              <Image src="/partners/cpplus.png" alt="CP PLUS" width={120} height={40} unoptimized className="h-6 md:h-8 w-auto object-contain" />
              <Image src="/partners/dahua.png" alt="Dahua" width={120} height={40} unoptimized className="h-6 md:h-8 w-auto object-contain" />
              <Image src="/partners/hikvision.png" alt="Hikvision" width={120} height={40} unoptimized className="h-6 md:h-8 w-auto object-contain" />
              <Image src="/partners/prama.png" alt="PRAMA" width={120} height={40} unoptimized className="h-6 md:h-8 w-auto object-contain" />
              <div className="flex items-center gap-3 opacity-60 dark:opacity-40">
                <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="font-black text-lg sm:text-xl tracking-tight uppercase">BIS-ER</span>
              </div>
            </div>
            <div className="px-5 py-3 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <Star className="w-4 h-4 fill-emerald-500/50" />
              <span>India&apos;s Preferred CCTV Platform | 500+ Properties Secured</span>
            </div>
          </div>
          <div className="h-20 md:hidden" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
