"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ArrowRight, 
  ShieldCheck, 
  ChevronRight,
  Shield,
  Award,
  MapPin,
  PhoneCall,
  CheckCircle2
} from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useI18nStore } from "@/lib/i18n/store";

interface CityLandingPageProps {
  cityName: string;
  citySlug?: string;
  tagline?: string;
  heroHighlight?: string;
  description?: string;
  neighborhoods: string[];
  commercialAreas?: string;
  ctaText?: string;
  brand?: string;
  intent?: string;
}

export default function CityLandingPage({
  cityName: defaultCityName,
  citySlug,
  tagline,
  heroHighlight = `Across ${defaultCityName}.`,
  description,
  neighborhoods: defaultNeighborhoods,
  commercialAreas = "local businesses",
  ctaText,
  brand = "",
  intent = "installation"
}: CityLandingPageProps) {
  const currentMonthYear = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const searchParams = useSearchParams();
  const pincodeParam = searchParams.get("pincode");
  
  const { t, locale } = useTranslation();
  const { isManuallySet, setLocaleFromPincode } = useI18nStore();
  
  // Dynamically derive translated variables on render based on current locale.
  
  // Wait, I should not use useState inside an inline hack.
  // Better approach:
  let localizedCityName = defaultCityName;
  let localizedNeighborhoods = defaultNeighborhoods;
  
  if (citySlug && typeof window !== "undefined") {
    // get localized data synchronously
    const { getCityData } = require("@/lib/city-data");
    const localizedData = getCityData(citySlug, locale);
    localizedCityName = localizedData.name;
    localizedNeighborhoods = localizedData.neighborhoods;
  }

  const wizardUrl = `/wizard?city=${localizedCityName}${pincodeParam ? `&pincode=${pincodeParam}` : ''}${brand ? `&brand=${brand}` : ''}`;

  useEffect(() => {
    if (pincodeParam && !isManuallySet) {
      import("@/app/actions/pincode").then(({ verifyPincodeAction }) => {
        verifyPincodeAction(pincodeParam).then((result: any) => {
          if (result.success && result.state) {
            import("@/lib/i18n/mapping").then(({ getStateLanguage }) => {
              setLocaleFromPincode(getStateLanguage(result.state));
            });
          }
        }).catch(console.error);
      });
    }
  }, [pincodeParam, isManuallySet, setLocaleFromPincode]);

  const brandPrefix = brand ? `${brand} ` : "";
  const derivedTagline = tagline || t('landing_hero_highlight', `Serving All of {city} with {brand} Security`).replace('{city}', localizedCityName).replace('{brand}', brand || "Premium");
  const derivedDescription = description || (
    intent === "quotation"
      ? t('protect_home', `Compare exact {brand} CCTV camera pricing and installation setup costs online in under 2 minutes for your {city} property.`).replace('{city}', localizedCityName).replace('{brand}', brandPrefix)
      : t('protect_home', `Protect your home or business in {city} with certified {brand} CCTV systems. Get an exact, transparent quote online in under 2 minutes.`).replace('{city}', localizedCityName).replace('{brand}', brandPrefix)
  );
  const derivedCtaText = ctaText || (
    intent === "quotation" 
      ? t('landing_exact_quote', `Get {brand} CCTV Quote`).replace('{brand}', brandPrefix)
      : t('get_instant_quote', `Get Instant Quotation`)
  );
  
  const mainTitle = intent === "quotation"
    ? `Get Instant ${brandPrefix}CCTV Quotation`
    : t('prof_installation', `Professional ${brandPrefix}CCTV Installation`);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 transition-colors duration-500">
      
      {/* Premium Breadcrumb for SEO & Navigation */}
      <div className="bg-zinc-50/50 dark:bg-zinc-900/10 border-b border-zinc-100/50 dark:border-zinc-800/30 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('home', 'Home')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-800 dark:text-zinc-200">{localizedCityName}</span>
          </div>
        </div>
      </div>

      {/* Hero Hub */}
      <section className="relative px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-32 md:pt-24 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-zinc-50 dark:bg-zinc-950">
          <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-200/40 dark:bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/20 dark:bg-indigo-600/5 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-12 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-500" />
            <span>{derivedTagline}</span>
            <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="text-blue-600 dark:text-emerald-500">{t('landing_same_day', 'Same-Day Survey')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter max-w-5xl mb-6 sm:mb-8 leading-[1.2] md:leading-[1.15] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {mainTitle} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 dark:from-blue-400 dark:via-blue-500 dark:to-indigo-500 italic mt-2 inline-block">
              {t('landing_hero_highlight', 'Across {city}.').replace('{city}', localizedCityName)}
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-2xl text-zinc-500 dark:text-zinc-400 max-w-3xl mb-8 sm:mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
             {derivedDescription}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center w-full sm:w-auto animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <Link
              href={wizardUrl}
              className="group relative inline-flex justify-center items-center gap-4 sm:gap-5 px-8 sm:px-12 py-4 sm:py-6 bg-zinc-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white rounded-[28px] sm:rounded-[32px] font-black text-lg sm:text-xl transition-all shadow-2xl shadow-zinc-900/30 dark:shadow-blue-500/40 hover:-translate-y-1 sm:hover:-translate-y-2 active:scale-95 touch-manipulation"
            >
              {derivedCtaText}
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>

            {/* Phone icon on mobile, full button on sm+ */}
            <a
              href="tel:+919772699395"
              aria-label="Call local support"
              className="flex sm:hidden items-center justify-center gap-3 w-full py-4 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold touch-manipulation"
            >
              <PhoneCall className="w-5 h-5 text-blue-600" />
              <span>+91 97726 99395</span>
            </a>
              <a
                href="tel:+919772699395"
                className="hidden sm:flex items-center gap-4 px-8 py-5 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('landing_call_support', 'Call Local Support')}</div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-white">+91 97726 99395</div>
                </div>
              </a>
          </div>
        </div>
      </section>

      {/* Pricing Context Section */}
      <section className="py-14 sm:py-20 md:py-32 px-4 sm:px-6 bg-zinc-50 dark:bg-zinc-900/30">
          <div className="max-w-5xl mx-auto">
            {/* Aligned residential pricing to platform base 18k-28k */}
            <div className="text-center mb-16">
               <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4">
                 {t('landing_pricing_title', '{brand} CCTV Installation Cost in {city}').replace('{city}', localizedCityName).replace('{brand}', brandPrefix)}
               </h2>
               <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                 {t('landing_pricing_subtitle', 'Updated transparent pricing for {date}').replace('{date}', currentMonthYear)}
               </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-zinc-900 p-6 sm:p-10 rounded-[28px] sm:rounded-[40px] shadow-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold mb-6">
                    {t('landing_residential_tag', 'Residential')}
                  </div>
                  <h3 className="text-2xl font-black mb-2">{t('landing_residential_title', 'Standard 4-Camera Setup')}</h3>
                  <div className="text-4xl font-black text-zinc-900 dark:text-white mb-6">₹18,000 <span className="text-xl text-zinc-400 font-medium">- ₹28,000</span></div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
                    {t('landing_residential_desc', 'Perfect for independent houses and small shops. Includes {brand} cameras, DVR, wiring, and professional installation.').replace('{brand}', brand || "CP Plus")}
                  </p>
                  <ul className="space-y-4 mb-8">
                     {[
                       t('feat_res_1', '4x 2MP/5MP HD {brand} Cameras').replace('{brand}', brand || "CP Plus"),
                       t('feat_res_2', '4-Channel DVR + HDD'),
                       t('feat_res_3', 'Power Supply & Connectors'),
                       t('feat_res_4', 'Complete Installation Labor')
                     ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                           <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {item}
                        </li>
                     ))}
                  </ul>
                  <Link
                    href={`/wizard?segment=residential&city=${encodeURIComponent(localizedCityName)}${brand ? `&brand=${brand}` : ''}`}
                    className="block w-full py-4 text-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold transition-colors"
                  >
                    {t('landing_exact_quote', 'Get Exact Quote →')}
                  </Link>
               </div>

                <div className="bg-zinc-900 dark:bg-blue-600 text-white p-6 sm:p-10 rounded-[28px] sm:rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                  <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold mb-6 backdrop-blur-md border border-white/10">
                    {t('landing_commercial_tag', 'Commercial')}
                  </div>
                  <h3 className="text-2xl font-black mb-2">{t('landing_commercial_title', '8 to 16-Camera Networks')}</h3>
                  <div className="text-4xl font-black text-white mb-6">₹30k <span className="text-xl text-zinc-400 font-medium">- ₹80k+</span></div>
                  <p className="text-zinc-300 text-sm mb-8 leading-relaxed">
                    {t('landing_commercial_desc', 'Ideal for offices, warehouses, and factories in {commercialAreas}. High-definition IP cameras with extended storage.').replace('{commercialAreas}', commercialAreas)}
                  </p>
                  <ul className="space-y-4 mb-8">
                     {[
                       t('feat_com_1', 'Network/IP {brand} Cameras').replace('{brand}', brand || "Hikvision"),
                       t('feat_com_2', 'High-Capacity NVR System'),
                       t('feat_com_3', 'Structured Cabling'),
                       t('feat_com_4', 'Advanced Remote Viewing Setup')
                     ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-medium text-white">
                           <CheckCircle2 className="w-5 h-5 text-blue-300 dark:text-blue-200" /> {item}
                        </li>
                     ))}
                  </ul>
                  <Link
                    href={`/wizard?segment=commercial&city=${encodeURIComponent(localizedCityName)}${brand ? `&brand=${brand}` : ''}`}
                    className="block w-full py-4 text-center rounded-2xl bg-white text-zinc-900 hover:bg-zinc-100 font-bold transition-colors"
                  >
                    {t('landing_custom_setup', 'Build Custom Setup →')}
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="py-14 sm:py-24 px-4 sm:px-6 relative">
         <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center mb-16">
               <MapPin className="w-12 h-12 text-blue-500 mb-6 opacity-80" />
               <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4">
                 {t('landing_areas_title', 'Areas We Serve in {city}').replace('{city}', localizedCityName)}
               </h2>
               <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl">
                 {t('landing_areas_desc', 'Our installation teams are dispatched daily across the entire city. We provide rapid service and maintenance to all major residential and commercial hubs.')}
               </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {localizedNeighborhoods.map((area, i) => (
                  <div key={i} className="px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 text-center font-bold text-sm text-zinc-700 dark:text-zinc-300 hover:border-blue-500/30 transition-colors">
                     {area}
                  </div>
               ))}
               <div className="px-6 py-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-center font-bold text-sm text-blue-600 dark:text-blue-400">
                  {t('landing_areas_all', '+ All Surrounding Areas')}
               </div>
            </div>
         </div>
      </section>

      {/* Final Deployment CTA */}
      <section className="py-14 sm:py-24 px-4 sm:px-6 relative overflow-hidden text-center bg-zinc-950 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 sm:mb-8 leading-[1.2] md:leading-[1.1]" dangerouslySetInnerHTML={{ __html: t('landing_final_cta_title', 'Secure your {city} property today.').replace('{city}', localizedCityName) }} />
            <p className="text-zinc-400 text-xl mb-12 font-medium max-w-2xl text-center">
              {t('landing_final_cta_desc', 'Get your exact quote in 2 minutes. 18% GST included. No hidden charges.')}
            </p>
            
            <Link
              href="/wizard"
              className="group relative flex items-center gap-4 sm:gap-6 bg-blue-600 hover:bg-blue-500 text-white px-8 sm:px-14 py-5 sm:py-8 rounded-[28px] sm:rounded-[36px] font-black text-lg sm:text-2xl transition-all shadow-[0_32px_64px_rgba(0,0,0,0.15)] shadow-blue-500/30 hover:-translate-y-1 sm:hover:-translate-y-2 touch-manipulation"
            >
              {t('get_quote', 'Get Free Quote')}
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>

            {/* Bottom spacer for mobile sticky CTA bar */}
            <div className="h-20 md:hidden" aria-hidden="true" />

            <div className="mt-20 flex flex-col items-center gap-8">
               <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50">
                 <div className="flex items-center gap-3">
                   <Shield className="w-8 h-8 text-white" />
                   <span className="font-black text-xl tracking-tight text-white">CP PLUS</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <ShieldCheck className="w-8 h-8 text-white" />
                   <span className="font-black text-xl tracking-tight text-white">BIS-ER</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <Award className="w-8 h-8 text-white" />
                   <span className="font-black text-xl tracking-tight text-white">SEAGATE</span>
                 </div>
               </div>
            </div>
        </div>
      </section>
    </div>
  );
}
