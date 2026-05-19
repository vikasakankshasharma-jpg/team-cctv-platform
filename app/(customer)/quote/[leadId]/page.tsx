import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
import { ConfiguratorView } from "@/components/quotation/ConfiguratorView";
import { Lead, Product, Addon, AddonRule, AppSettings, Promoter } from "@/types";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { WaitlistBanner } from "@/components/quotation/WaitlistBanner";

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
  let card_layouts: any[] = [];

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
      rulesSnap2,
      layoutsSnap
    ] = await Promise.all([
      lead ? Promise.resolve(null) : adminDb.collection("leads").doc(leadId).get(),
      adminDb.collection("products").where("is_active", "==", true).where("is_deleted", "==", false).get(),
      adminDb.collection("addons").where("is_active", "==", true).where("is_deleted", "==", false).get(),
      adminDb.collection("addon_rules").get(),
      adminDb.collection("settings").doc(SETTINGS_DOC_ID).get(),
      adminDb.collection("recommendation_rules").orderBy("priority", "asc").get(),
      adminDb.collection("comparison_card_layouts").where("is_active", "==", true).get()
    ]);

    // Populate Lead if not in mock mode
    if (!lead && leadSnap && leadSnap.exists) {
      lead = { id: leadSnap.id, ...leadSnap.data() } as Lead;
    }

    // Populate Pricing Components (Masked for Client Security)
    products = productsSnap.docs.map(doc => {
      const data = doc.data() as Product;
      // STRIP SENSITIVE FIELDS: Never expose internal costs/margins to the browser
      const { base_cost, margin_percentage, ...publicData } = data;
      return { id: doc.id, ...publicData } as Product;
    });

    addons = addonsSnap.docs.map(doc => {
      const data = doc.data() as Addon;
      const { base_cost, ...publicData } = data;
      return { id: doc.id, ...publicData } as Addon;
    });
    
    addon_rules = rulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AddonRule));
    
    if (settingsSnap.exists) {
      settings = settingsSnap.data() as AppSettings;
    }

    recommendation_rules = rulesSnap2.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((rule: any) => rule.is_active === true);

    card_layouts = layoutsSnap.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));

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
    card_layouts = serializeDoc(card_layouts);

  } catch (err) {
    console.error("Error fetching quote data:", err);
  }

  if (!lead) return notFound();

  // DEFAULT FALLBACK DATA (If DB is empty or seed failed)
  if (products.length === 0) {
    // Fallback products for mock lead or when DB fails
    products = [
      // Cameras
      { id: "f_i_1", technical_name: "cam_ip_opt1", display_name: "2MP Eco Digital Camera", category: "camera", technology: "IP", unit_price: 2400, resolution_tier: "standard", is_active: true, catalog_path: "TEAM/IP/ECO", features: ["Mic"] },
      { id: "f_i_2", technical_name: "cam_ip_opt2", display_name: "2MP Smart Digital Camera", category: "camera", technology: "IP", unit_price: 2800, resolution_tier: "good", is_active: true, catalog_path: "TEAM/IP/SMART", features: ["Mic", "Color"] },
      { id: "f_i_4", technical_name: "cam_ip_opt4", display_name: "2MP Elite Digital Camera", category: "camera", technology: "IP", unit_price: 3500, resolution_tier: "best", is_active: true, catalog_path: "TEAM/IP/ELITE", features: ["Mic", "Color", "PTZ"] },
      { id: "f_h_1", technical_name: "cam_hd_opt1", display_name: "2MP Classic HD Camera", category: "camera", technology: "HD", unit_price: 1200, resolution_tier: "standard", is_active: true, catalog_path: "TEAM/HD/CLASSIC", features: ["Mic"] },
      
      // Recorders
      { id: "f_r_1", technical_name: "nvr_4ch", display_name: "4-Channel Smart NVR", category: "recorder", technology: "IP", unit_price: 4500, channels: 4, max_cameras: 4, is_active: true, compatible_paths: ["TEAM/IP"] },
      { id: "f_r_2", technical_name: "nvr_8ch", display_name: "8-Channel Smart NVR", category: "recorder", technology: "IP", unit_price: 7500, channels: 8, max_cameras: 8, is_active: true, compatible_paths: ["TEAM/IP"] },
      { id: "f_r_3", technical_name: "dvr_4ch", display_name: "4-Channel Pro DVR", category: "recorder", technology: "HD", unit_price: 3200, channels: 4, max_cameras: 4, is_active: true, compatible_paths: ["TEAM/HD"] },

      // Storage
      { id: "f_s_1", technical_name: "hdd_1tb", display_name: "1TB Surveillance HDD", category: "accessory", technology: "both", unit_price: 3800, is_active: true },
      { id: "f_s_2", technical_name: "hdd_2tb", display_name: "2TB Surveillance HDD", category: "accessory", technology: "both", unit_price: 5800, is_active: true },

      // Accessories
      { id: "f_a_1", technical_name: "poe_4port", display_name: "4-Port PoE Switch", category: "accessory", technology: "IP", unit_price: 1800, max_cameras: 4, is_active: true, compatible_paths: ["TEAM/IP"] },
      { id: "f_a_2", technical_name: "poe_8port", display_name: "8-Port PoE Switch", category: "accessory", technology: "IP", unit_price: 3200, max_cameras: 8, is_active: true, compatible_paths: ["TEAM/IP"] },
      { id: "f_a_3", technical_name: "psu_4port", display_name: "4-Port Power Supply", category: "accessory", technology: "HD", unit_price: 850, max_cameras: 4, is_active: true, compatible_paths: ["TEAM/HD"] },
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
    recommendation_rules,
    card_layouts
  };

  // Check if pincode belongs to an unserved/coming soon city
  const leadPincode = String(lead.wizard_answers?.lead_pincode || "");
  let unservedCityName: string | null = null;
  
  if (leadPincode && leadPincode.length === 6) {
    if (leadPincode.startsWith("342")) unservedCityName = "Jodhpur";
    else if (leadPincode.startsWith("324")) unservedCityName = "Kota";
    else if (leadPincode.startsWith("305")) unservedCityName = "Ajmer";
  }

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 relative overflow-hidden font-sans selection:bg-blue-100 dark:selection:bg-blue-900 transition-colors duration-500">
      
      {/* ELITE PREMIERE GRADIENT DESIGN */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-blue-100/40 dark:bg-blue-600/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-indigo-100/30 dark:bg-indigo-600/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto py-12 sm:py-24 px-4 sm:px-6 md:px-12 lg:px-16 flex flex-col items-center">
        
        {/* ELITE HEADER SECTION */}
        <div className="max-w-3xl w-full text-center mb-12 sm:mb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
           <div className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 text-white font-black px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.15em] mb-6 sm:mb-8 shadow-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Calculated for {lead.customer_name}
           </div>

           {unservedCityName && lead.id && (
             <WaitlistBanner leadId={lead.id} unservedCityName={unservedCityName} />
           )}
           
           <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.9] sm:leading-[0.85] mb-5 sm:mb-8">
              Your Security<br/>
              <span className="text-blue-600 dark:text-blue-400">Quote.</span>
           </h1>
           
           <p className="text-base sm:text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-2xl mx-auto">
              We have engineered three professional security tiers for your <span className="text-zinc-900 dark:text-white font-bold">{lead.property_type.toUpperCase()}</span>, precisely tailored to your requirements.
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
             customLayoutId={promoter?.custom_layout_id}
           />
        </div>


      </div>
    </main>
  );
}

