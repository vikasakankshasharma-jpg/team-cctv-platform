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
import { FaqSection } from "@/components/landing/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online CCTV Quotation & Installation in Jaipur | TEAM CCTV",
  description: "Get an instant CCTV camera price with installation in Jaipur. Answer 4 simple questions and receive three dynamic quotes for CP Plus & Prama systems with 18% GST included.",
  keywords: ["CCTV Jaipur", "CCTV price with installation", "CCTV camera price Jaipur", "Online CCTV quotation", "TEAM CCTV"],
  alternates: {
    canonical: "https://cctvquotation.com",
  },
};

export default function LandingPage() {
  // Structured Data for Local Business
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "TEAM CCTV Jaipur",
    "image": "https://teamcctv.com/og-image.jpg",
    "@id": "https://teamcctv.com",
    "url": "https://teamcctv.com",
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
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 transition-colors duration-500">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Elite Hero Hub */}
      <section className="relative px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Background Depth Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-zinc-50 dark:bg-zinc-950">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-blue-200/40 dark:bg-blue-600/10 blur-[120px] rounded-full motion-safe:animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-indigo-200/20 dark:bg-indigo-600/5 blur-[100px] rounded-full" />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:32px_32px]" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col items-center lg:items-start text-center lg:text-left relative">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 sm:mb-12 shadow-2xl backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-500 shrink-0" />
            <span>Jaipur&apos;s #1 CCTV Estimator</span>
            <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
            <span className="text-blue-600 dark:text-emerald-500 hidden sm:inline">100% Free &amp; Instant</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-black text-zinc-900 dark:text-white tracking-tighter max-w-5xl mb-6 sm:mb-8 md:mb-10 leading-[0.9] sm:leading-[0.88]">
            High-Quality Security. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 dark:from-blue-400 dark:via-blue-500 dark:to-indigo-500 italic">
              Starting in Jaipur.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-2xl text-zinc-500 dark:text-zinc-400 max-w-2xl mb-8 sm:mb-10 md:mb-16 font-medium leading-relaxed">
            Get an exact price for your CCTV setup in under 2 minutes. No technical knowledge needed — answer 4 simple questions and we&apos;ll do the rest.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center w-full sm:w-auto">
            <Link
              href="/wizard"
              className="group relative inline-flex w-full sm:w-auto justify-center items-center gap-3 sm:gap-4 px-8 sm:px-12 py-4 sm:py-6 bg-zinc-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white rounded-[28px] sm:rounded-[32px] font-black text-base sm:text-xl transition-all shadow-2xl shadow-zinc-900/30 dark:shadow-blue-500/40 hover:-translate-y-1 sm:hover:-translate-y-2 active:scale-95 touch-manipulation"
            >
              Get CCTV Quotation Online
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
          </div>

          <div className="flex sm:hidden items-center gap-4 mt-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> STQC Certified</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> 500+ Installs</span>
            <span>·</span>
            <span>GST Included</span>
          </div>
        </div>
      </section>

      {/* 2. Architecture Philosophy Section */}
      <section className="bg-zinc-950 py-16 sm:py-24 md:py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-900 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 sm:gap-24 items-center">
            <div className="space-y-8 sm:space-y-12">
              <div>
                <h2 className="text-blue-500 font-black text-xs uppercase tracking-[0.4em] mb-4 sm:mb-6">How It Works</h2>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter leading-tight">Smart Security <br /> Made for You.</h3>
              </div>
              <div className="space-y-6 sm:space-y-8">
                {[
                  { icon: Target, title: "Perfect Coverage", desc: "We make sure every corner of your property is covered, leaving no blind spots for complete peace of mind." },
                  { icon: Cpu, title: "Right Cameras", desc: "We'll suggest the best camera quality for your specific needs, whether it's a small home or a large warehouse." },
                  { icon: Layers, title: "Clear Pricing", desc: "Get three easy-to-understand price options (Value, Professional, and Elite) so you can choose what fits your budget." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 sm:gap-6 group">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xl shrink-0">
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg sm:text-xl font-black text-white mb-1 sm:mb-2">{item.title}</h4>
                      <p className="text-zinc-500 font-medium leading-relaxed text-sm sm:text-base">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="aspect-square bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-[80px] border border-white/10 p-12 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-700">
                <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-3xl -z-10" />
                <div className="bg-black/60 border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-8 h-full flex flex-col justify-center">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">System Quality</span>
                      <span className="text-emerald-500 font-black text-xs">99.9%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[99.9%]" />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500"><Globe className="w-5 h-5" /></div>
                      <div>
                        <div className="text-sm font-black text-white">View on Your Phone</div>
                        <div className="text-[10px] font-bold text-zinc-500">Check your cameras from anywhere</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500"><Zap className="w-5 h-5" /></div>
                      <div>
                        <div className="text-sm font-black text-white">Clean Installation</div>
                        <div className="text-[10px] font-bold text-zinc-500">Neat wiring and professional finish</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Final Deployment CTA */}
      <section className="py-16 sm:py-24 md:py-20 px-4 sm:px-6 relative overflow-hidden text-center bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-50 dark:bg-blue-600/10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-500 mb-8 sm:mb-12 animate-bounce">
            <Zap className="w-7 h-7 sm:w-10 sm:h-10 fill-current" />
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter mb-5 sm:mb-8 leading-[0.9] sm:leading-[0.85]">
            Secure your space <br className="hidden sm:block" /> today.
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-xl md:text-2xl mb-10 sm:mb-16 font-medium max-w-2xl text-center">
            2-minute setup. No hidden costs. 18% GST included in all plans.
          </p>

          <Link
            href="/wizard"
            className="group relative flex items-center gap-4 sm:gap-6 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white px-8 sm:px-14 py-5 sm:py-8 rounded-[28px] sm:rounded-[36px] font-black text-lg sm:text-2xl transition-all shadow-[0_32px_64px_rgba(0,0,0,0.15)] dark:shadow-blue-500/30 hover:-translate-y-1 sm:hover:-translate-y-2 touch-manipulation"
          >
            Get CCTV Quotation Online
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-2 transition-transform duration-300" />
          </Link>

          <FaqSection />

          {/* Partner Trust Strip */}
          <div className="mt-16 sm:mt-20 flex flex-col items-center gap-6 sm:gap-8 w-full">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Trusted Hardware Partners &amp; Verified Installs</div>
            <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 md:gap-20 grayscale opacity-60 dark:opacity-40">
              <Image src="/partners/cpplus.png" alt="CP PLUS" width={120} height={40} className="h-6 md:h-8 w-auto object-contain" />
              <Image src="/partners/prama.png" alt="PRAMA" width={120} height={40} className="h-6 md:h-8 w-auto object-contain" />
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="font-black text-lg sm:text-xl tracking-tight uppercase">BIS-ER</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="font-black text-lg sm:text-xl tracking-tight uppercase">STQC</span>
              </div>
            </div>
            <div className="px-5 py-3 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <Star className="w-4 h-4 fill-emerald-500/50" />
              <span>Jaipur&apos;s Preferred CCTV Platform | 500+ Properties Secured</span>
            </div>
          </div>
          <div className="h-20 md:hidden" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
