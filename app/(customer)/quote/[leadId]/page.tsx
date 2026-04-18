import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
import { ConfiguratorView } from "@/components/quotation/ConfiguratorView";
import { Lead, Product, Addon, AddonRule, AppSettings } from "@/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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
      settingsSnap
    ] = await Promise.all([
      lead ? Promise.resolve(null) : adminDb.collection("leads").doc(leadId).get(),
      adminDb.collection("products").where("is_active", "==", true).get(),
      adminDb.collection("addons").where("is_active", "==", true).get(),
      adminDb.collection("addon_rules").get(),
      adminDb.collection("settings").doc(SETTINGS_DOC_ID).get()
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
    ] as any;
  }

  if (addons.length === 0) {
    addons = [
      { id: "f_add_1", technical_name: "wire_mgr", display_name: "Wire Management Box", price: 450, is_active: true },
      { id: "f_add_2", technical_name: "audio_mic", display_name: "Sound Recording Mic", price: 850, is_active: true },
    ] as any;
  }

  const finalSettings: AppSettings = settings || {
    company_name: "TEAM CCTV",
    gst_rate: 18,
    labor_fitting_only_rate: 650,
    labor_full_installation_rate: 1800,
    wire_cost_per_meter: 45,
    whatsapp_template: "Hi {{customer_name}}, your quote for ₹{{total_amount}} is ready."
  } as any;

  const pricingCache = {
    products,
    addons,
    addon_rules,
    settings: finalSettings
  };

  return (
    <main className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-blue-100">
      
      {/* ELITE PREMIERE GRADIENT DESIGN */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-blue-100/40 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-indigo-100/30 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto py-24 px-6 md:px-12 lg:px-16 flex flex-col items-center">
        
        {/* ELITE HEADER SECTION */}
        <div className="max-w-3xl w-full text-center mb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
           <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-white font-black px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.3em] mb-8 shadow-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Calculated for {lead.customer_name}
           </div>
           
           <h1 className="text-6xl md:text-8xl font-black text-zinc-900 tracking-tighter leading-[0.85] mb-8">
              Your Security<br/>
              <span className="text-blue-600">Quote.</span>
           </h1>
           
           <p className="text-xl md:text-2xl text-zinc-400 font-medium leading-relaxed max-w-2xl mx-auto">
              We have made three great plans for your <span className="text-zinc-900 font-bold">{lead.property_type.toUpperCase()}</span> based on what you need.
           </p>
        </div>
        
        {/* INTERACTIVE CONFIGURATOR */}
        <div className="w-full animate-in fade-in fill-mode-both delay-300 duration-1000">
           <ConfiguratorView 
             lead={lead} 
             pricingCache={pricingCache} 
           />
        </div>

        {/* TRUST SIGNALS */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-zinc-100 pt-16 w-full">
           <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Clear Pricing</span>
              <p className="text-sm font-bold text-zinc-900 leading-snug">Every rupee is clearly shown. You get a full list of all parts and work.</p>
           </div>
           <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Best Quality</span>
              <p className="text-sm font-bold text-zinc-900 leading-snug">We only use top-brand cameras. 100% original products with full warranty.</p>
           </div>
           <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Expert Help</span>
              <p className="text-sm font-bold text-zinc-900 leading-snug">Talk to our security experts if you have any questions about your plan.</p>
           </div>
        </div>

      </div>
    </main>
  );
}

