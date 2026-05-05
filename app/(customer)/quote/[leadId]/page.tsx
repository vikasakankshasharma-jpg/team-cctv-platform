import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
import { ConfiguratorView } from "@/components/quotation/ConfiguratorView";
import { Lead, Product, Addon, AddonRule, AppSettings, Promoter } from "@/types";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ leadId: string }>
}): Promise<Metadata> {
  const { leadId } = await params;
  
  if (leadId === "mock-e2e-lead" || leadId === "mock-lead") {
    return { title: "CCTV Quote Preview | TEAM CCTV" };
  }

  const doc = await adminDb.collection("leads").doc(leadId).get();
  const data = doc.data() as Lead;

  return {
    title: `CCTV Quotation for ${data?.customer_name || "Client"} | TEAM CCTV`,
    description: `Personalized security system quotation for ${data?.property_type || "your"} property. Review high-fidelity IP and HD configurations tailored for maximum coverage.`,
  };
}

export default async function QuoteResultPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ leadId: string }>,
  searchParams: Promise<{ name?: string, mobile?: string }>
}) {
  const { leadId } = await params;
  const { name, mobile } = await searchParams;

  // 1. DATA ENRICHMENT & FETCHING ─────────────────────────────────────────────
  
  let lead: Lead | null = null;
  let products: Product[] = [];
  let addons: Addon[] = [];
  let addon_rules: AddonRule[] = [];
  let settings: AppSettings | null = null;
  let promoter: Promoter | null = null;
  let recommendation_rules: any[] = [];

  // HANDLE MOCK SCENARIO (DEMO/E2E)
  if (leadId === "mock-e2e-lead" || leadId === "mock-lead") {
    lead = {
      id: "mock-e2e-lead",
      customer_name: name || "Elite Client",
      mobile_number: mobile || "9876543210",
      property_type: "home",
      technology_choice: "IP",
      cabling_done: false,
      wizard_answers: {
        "q_property": "Home",
        "q_tech": "IP",
        "q_features": ["Night Vision", "Mobile Alerts"]
      },
      status: "new",
      created_at: new Date()
    };
  }

  try {
    const [
      leadSnap,
      productsSnap,
      addonsSnap,
      rulesSnap,
      settingsSnap,
      rulesSnap2
    ] = await Promise.all([
      lead ? Promise.resolve(null) : adminDb.collection("leads").doc(leadId).get(),
      adminDb.collection("products").where("is_active", "==", true).where("is_deleted", "==", false).get(),
      adminDb.collection("addons").where("is_active", "==", true).where("is_deleted", "==", false).get(),
      adminDb.collection("addon_rules").get(),
      adminDb.collection("settings").doc(SETTINGS_DOC_ID).get(),
      adminDb.collection("recommendation_rules").orderBy("priority", "asc").get()
    ]);

    // Populate Lead if not in mock mode
    if (!lead && leadSnap && leadSnap.exists) {
      lead = { id: leadSnap.id, ...leadSnap.data() } as Lead;
    }

    // Populate Pricing Components
    products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    addons = addonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));
    addon_rules = rulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AddonRule));
    
    if (settingsSnap.exists) {
      settings = settingsSnap.data() as AppSettings;
    }

    recommendation_rules = rulesSnap2.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((rule: any) => rule.is_active === true);

    // 1.5 Fetch Promoter if exists
    if (lead?.promoter_id) {
      const promoterSnap = await adminDb.collection("promoters").doc(lead.promoter_id).get();
      if (promoterSnap.exists) {
        promoter = { id: promoterSnap.id, ...promoterSnap.data() } as Promoter;
      }
    }

    // 2. SERIALIZATION FOR CLIENT COMPONENTS ─────────────────────────────────
    // Essential for Next.js Server Components to pass data to Client Components
    const { serializeDoc } = await import("@/lib/serialize");
    lead = serializeDoc(lead);
    products = serializeDoc(products);
    addons = serializeDoc(addons);
    addon_rules = serializeDoc(addon_rules);
    settings = serializeDoc(settings);
    promoter = serializeDoc(promoter);
    recommendation_rules = serializeDoc(recommendation_rules);

  } catch (err) {
    console.error("Error fetching quote data:", err);
  }

  if (!lead) return notFound();

  // DEFAULT FALLBACK DATA (If DB is empty or seed failed)
  if (products.length === 0) {
    products = [
      { id: "f_h_2", technical_name: "cam_hd_2mp", display_name: "2MP HD Sharp Camera", category: "camera", technology: "HD", unit_price: 1450, resolution_tier: "good", is_active: true },
      { id: "f_h_5", technical_name: "cam_hd_5mp", display_name: "5MP HD Ultra Camera", category: "camera", technology: "HD", unit_price: 2200, resolution_tier: "very_clear", is_active: true },
      { id: "f_h_8", technical_name: "cam_hd_8mp", display_name: "8MP 4K Crystal Camera", category: "camera", technology: "HD", unit_price: 3500, resolution_tier: "crystal_clear", is_active: true },
      { id: "f_i_2", technical_name: "cam_ip_2mp", display_name: "2MP Smart Digital Camera", category: "camera", technology: "IP", unit_price: 2800, resolution_tier: "good", is_active: true },
      { id: "f_i_5", technical_name: "cam_ip_5mp", display_name: "5MP Smart Digital Camera", category: "camera", technology: "IP", unit_price: 3900, resolution_tier: "very_clear", is_active: true },
      { id: "f_i_8", technical_name: "cam_ip_8mp", display_name: "8MP 4K Smart Digital Camera", category: "camera", technology: "IP", unit_price: 5800, resolution_tier: "crystal_clear", is_active: true },
      { id: "f_d_4", technical_name: "dvr_4ch", display_name: "4-Channel Recorder (HD)", category: "recorder", technology: "HD", unit_price: 3800, channels: 4, is_active: true },
      { id: "f_n_4", technical_name: "nvr_4ch", display_name: "4-Channel Recorder (Digital)", category: "recorder", technology: "IP", unit_price: 5900, channels: 4, is_active: true },
      { id: "f_acc_h1", technical_name: "hdd_1tb", display_name: "1TB Video Memory", category: "accessory", unit_price: 4200, is_active: true },
    ] as Product[];
  }

  if (addons.length === 0) {
    addons = [
      { id: "f_add_1", display_name: "Wire Management Box", price: 450, is_active: true },
      { id: "f_add_2", display_name: "Sound Recording Mic", price: 850, is_active: true },
    ] as Addon[];
  }

  const finalSettings: AppSettings = settings || {
    company_name: "TEAM CCTV",
    gst_rate: 18,
    labor_fitting_only_rate: 650,
    labor_full_installation_rate: 1800,
    wire_cost_per_meter: 45,
    whatsapp_template: "Hi {{customer_name}}, your quote for ₹{{total_amount}} is ready.",
    tier_budget_label: "VALUE:",
    tier_budget_multiplier: 0.85,
    tier_recommended_label: "PROFESSIONAL:",
    tier_recommended_multiplier: 1.0,
    tier_premium_label: "ELITE:",
    tier_premium_multiplier: 1.25,
    max_supported_cameras: 16,
    labor_ip_per_camera: 1000,
    labor_hd_per_camera: 800,
    cable_copper_coated_ip: 45,
    cable_copper_coated_hd: 35,
    visit_charge: 500
  } as AppSettings;

  const pricingCache = {
    products,
    addons,
    addon_rules,
    settings: finalSettings,
    recommendation_rules
  };

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 relative overflow-hidden font-sans selection:bg-blue-100 dark:selection:bg-blue-900 transition-colors duration-500">
      
      {/* ELITE PREMIERE GRADIENT DESIGN */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-blue-100/40 dark:bg-blue-600/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-indigo-100/30 dark:bg-indigo-600/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto py-12 sm:py-24 px-4 sm:px-6 md:px-12 lg:px-16 flex flex-col items-center">
        
        {/* ELITE HEADER SECTION */}
        <div className="max-w-3xl w-full text-center mb-12 sm:mb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
           <div className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 text-white font-black px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.3em] mb-6 sm:mb-8 shadow-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Calculated for {lead.customer_name}
           </div>
           
           <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.9] sm:leading-[0.85] mb-5 sm:mb-8">
              Your Security<br/>
              <span className="text-blue-600 dark:text-blue-400">Quote.</span>
           </h1>
           
           <p className="text-base sm:text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-2xl mx-auto">
              We have made three great plans for your <span className="text-zinc-900 dark:text-white font-bold">{lead.property_type.toUpperCase()}</span> based on what you need.
           </p>
        </div>
        
        {/* INTERACTIVE CONFIGURATOR */}
        <div className="w-full animate-in fade-in fill-mode-both delay-300 duration-1000">
           <ConfiguratorView 
             lead={lead} 
             pricingCache={pricingCache} 
             promoterDiscount={{
               percent: promoter?.discount_type === "percent" ? (promoter.discount_value || 0) : 0,
               flat: promoter?.discount_type === "flat" ? (promoter.discount_value || 0) : 0
             }}
           />
        </div>

        {/* NEXT STEPS TIMELINE */}
        <div className="mt-16 sm:mt-32 w-full max-w-5xl">
           <div className="text-center mb-8 sm:mb-16">
              <span className="block text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.3em] mb-4">The Road to Security</span>
              <h3 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">What Happens Next?</h3>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8 relative">
              <div className="hidden md:block absolute top-8 left-0 w-full h-px bg-zinc-100 dark:bg-zinc-800 -z-10" />
              
              {[
                { step: "01", title: "Site Survey", desc: "Book a visit for a precise wiring measurement." },
                { step: "02", title: "Final Quote", desc: "Receive a binding contract with exact totals." },
                { step: "03", title: "Installation", desc: "Professional setup by our certified team." },
                { step: "04", title: "Go Live", desc: "System handover with mobile app setup." }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                   <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl flex items-center justify-center text-zinc-900 dark:text-white font-black text-base sm:text-xl mb-4 sm:mb-6 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-500">
                      {item.step}
                   </div>
                   <h4 className="text-sm sm:text-lg font-black text-zinc-900 dark:text-white mb-1 sm:mb-2 tracking-tight">{item.title}</h4>
                   <p className="text-xs font-medium text-zinc-400 dark:text-zinc-400 leading-relaxed px-1 sm:px-4">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>

      </div>
    </main>
  );
}

