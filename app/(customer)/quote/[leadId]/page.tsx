import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
import { ConfiguratorView } from "@/components/quotation/ConfiguratorView";
import { Lead, Product, Addon, AddonRule, AppSettings, Promoter } from "@/types";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { WaitlistBanner } from "@/components/quotation/WaitlistBanner";
import { TranslatedText } from "@/components/shared/TranslatedText";
import { getPincodeCoordinates, findNearestHub, HubWithCoordinates } from "@/lib/geo-utils";

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
    title: `Quotation for ${data?.customer_name || "Client"} - TEAM CCTV`,
    description: `Your customized security system quote. Compare simple packages and build your perfect setup.`,
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
  let hubs: HubWithCoordinates[] = [];

  if (leadId === "mock-lead" || leadId === "mock-e2e-lead") {
    lead = {
      id: leadId,
      customer_name: name || "Demo Customer",
      mobile_number: mobile || "9876543210",
      email: "mock@cctvquotation.com",
      property_type: "home",
      technology_choice: "IP",
      camera_count: 4,
      status: "qualified",
      created_at: new Date().toISOString(),
      address: {
        city: "Jaipur",
        area: "Vaishali Nagar",
        pincode: "302001"
      },
      wizard_answers: {
        lead_pincode: "302001",
        q_property_type: "home",
        q_camera_count: 4,
        q_technology: "IP",
        q_storage_days: 7,
        q_features: ["color", "mic"],
        q_internet: "yes"
      }
    } as unknown as Lead;
  }

  try {
    const results = await Promise.allSettled([
      lead ? Promise.resolve({ exists: true, id: lead.id, data: () => lead } as any) : adminDb.collection("leads").doc(leadId).get(),
      adminDb.collection("products").where("is_active", "==", true).get(),
      adminDb.collection("addons").where("is_active", "==", true).get(),
      adminDb.collection("addon_rules").get(),
      adminDb.collection("settings").doc(SETTINGS_DOC_ID).get(),
      adminDb.collection("recommendation_rules").orderBy("priority", "asc").get(),
      adminDb.collection("comparison_card_layouts").where("is_active", "==", true).get(),
      adminDb.collection("hubs").where("is_active", "==", true).get()
    ]);

    const leadResult = results[0];
    if (leadResult.status === "fulfilled" && !lead && leadResult.value && leadResult.value.exists) {
      lead = { id: leadResult.value.id, ...leadResult.value.data() } as Lead;
    }

    if (results[1].status === "fulfilled" && results[1].value) {
      products = results[1].value.docs.map(doc => {
        const data = doc.data() as any;
        if (data.is_deleted === true) return null;
        if (!Array.isArray(data.technologies)) {
          data.technologies = data.technology ? [data.technology] : ["Common"];
        }
        // Strip heavy fields that the client doesn't need for generating the quote
        const { 
          base_cost, 
          margin_percentage, 
          custom_attributes,
          focus_reason,
          focus_active_until,
          ...publicData 
        } = data;
        return { id: doc.id, ...publicData } as Product;
      }).filter(Boolean) as Product[];
    }

    if (results[2].status === "fulfilled" && results[2].value) {
      addons = results[2].value.docs.map(doc => {
        const data = doc.data() as Addon;
        if ((data as any).is_deleted === true) return null;
        const { base_cost, ...publicData } = data;
        return { id: doc.id, ...publicData } as Addon;
      }).filter(Boolean) as Addon[];
    }
    
    if (results[3].status === "fulfilled" && results[3].value) {
      addon_rules = results[3].value.docs.map(doc => ({ id: doc.id, ...doc.data() } as AddonRule));
    }
    
    if (results[4].status === "fulfilled" && results[4].value && results[4].value.exists) {
      settings = results[4].value.data() as AppSettings;
    }

    if (results[5].status === "fulfilled" && results[5].value) {
      recommendation_rules = results[5].value.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((rule: any) => rule.is_active === true);
    }

    if (results[6].status === "fulfilled" && results[6].value) {
      card_layouts = results[6].value.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));
    }

    if (results[7].status === "fulfilled" && results[7].value) {
      hubs = results[7].value.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    }

    if (lead?.promoter_id) {
      const promoterSnap = await adminDb.collection("promoters").doc(lead.promoter_id).get().catch(() => null);
      if (promoterSnap && promoterSnap.exists) {
        promoter = { id: promoterSnap.id, ...promoterSnap.data() } as Promoter;
      }
    }

    const { serializeDoc } = await import("@/lib/serialize");
    lead = serializeDoc(lead);
    products = serializeDoc(products);
    addons = serializeDoc(addons);
    addon_rules = serializeDoc(addon_rules);
    settings = serializeDoc(settings);
    promoter = serializeDoc(promoter);
    recommendation_rules = serializeDoc(recommendation_rules);
    card_layouts = serializeDoc(card_layouts);

    // If lead not found directly, check if leadId is actually a quoteId
    if (!lead) {
      const quoteSnap = await adminDb.collection("quotes").doc(leadId).get().catch(() => null);
      if (quoteSnap && quoteSnap.exists) {
        const qData = quoteSnap.data() as any;
        lead = {
          id: qData.leadId || qData.lead_id || leadId,
          customer_name: qData.customer_name || "Valued Customer",
          mobile_number: qData.customer_mobile || "",
          property_type: qData.requirementSnapshot?.property_type || "home",
          technology_choice: qData.requirementSnapshot?.technology_preference || "HD",
          cabling_done: qData.requirementSnapshot?.cabling_done ?? false,
          wizard_answers: qData.requirementSnapshot || {},
          latest_quote_id: leadId,
          status: "new"
        } as unknown as Lead;
      }
    }

  } catch (err) {
    console.error("Error fetching quote data:", err);
  }

  if (!lead) return notFound();

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
    cable_pure_copper: 65,
    connector_rj45_cost: 25,
    connector_bnc_dc_cost: 70,
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

  const leadPincode = String(lead.wizard_answers?.lead_pincode || "");
  let unservedCityName: string | null = null;
  let nearestHubName: string | undefined = undefined;
  let distanceKm: number | undefined = undefined;
  
  if (leadPincode && leadPincode.length === 6) {
    // 1. Check if the exact pincode is already covered by an active hub
    let isServed = hubs.some(hub => hub.pincode_coverage?.includes(leadPincode));

    // 2. Check distance to nearest active hub dynamically
    const customerCoords = getPincodeCoordinates(leadPincode);
    if (customerCoords) {
      const nearest = findNearestHub(customerCoords, hubs);
      if (nearest) {
        if (nearest.distanceKm <= 40) {
          isServed = true; // Served if within 40km of any active hub
        } else {
          nearestHubName = nearest.hub.city_name || nearest.hub.name;
          distanceKm = nearest.distanceKm;
        }
      }
    }

    // 3. Fallback: If it's a Jaipur pincode (302xxx) but not explicitly covered, still consider it served
    if (!isServed && leadPincode.startsWith("302")) {
      isServed = true;
    }

    if (!isServed) {
      // It's unserved. Set the unserved city name for the banner.
      if (leadPincode.startsWith("342")) unservedCityName = "Jodhpur";
      else if (leadPincode.startsWith("324")) unservedCityName = "Kota";
      else if (leadPincode.startsWith("305")) unservedCityName = "Ajmer";
      else unservedCityName = (lead.wizard_answers?.lead_city as string) || "Your Area";
    }
  }

  // Check expiration (7 days)
  const leadDate = new Date((lead.created_at as any)?.toDate?.() || lead.created_at || Date.now());
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays > 7 && lead.id !== "mock-e2e-lead" && lead.id !== "mock-lead";

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-black font-sans selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-500 pb-32">
      
      {/* MINIMALIST HERO SECTION (Apple Aesthetic) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 pt-16 sm:pt-24 pb-8 sm:pb-12 text-center">
          
          {/* DYNAMIC WAITLIST BANNER WITH DISTANCE */}
          {unservedCityName && (
            <WaitlistBanner 
              leadId={lead.id!} 
              unservedCityName={unservedCityName} 
              nearestHubName={nearestHubName}
              distanceKm={distanceKm}
            />
          )}
           
           <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight leading-tight mb-4">
              <TranslatedText tKey="quote_h1" defaultText="Your security," /><br />
              <span className="text-[#0066cc] dark:text-[#2997ff]"><TranslatedText tKey="quote_h1_span" defaultText="made simple." /></span>
           </h1>
           
           <p className="text-lg sm:text-xl text-[#86868b] dark:text-[#a1a1a6] font-normal leading-relaxed max-w-2xl mx-auto">
              <TranslatedText tKey="quote_prep" defaultText="Prepared just for " /> <span className="text-[#1d1d1f] dark:text-white font-medium">{lead.customer_name}</span>. <TranslatedText tKey="quote_rec" defaultText="Look at our recommended" /> {(lead.property_type || "").toLowerCase()} <TranslatedText tKey="quote_pkg" defaultText="packages below or build your own." />
           </p>
         </div>
      
      {/* MAIN CONFIGURATOR VIEW */}
      <div className="w-full animate-in fade-in fill-mode-both delay-300 duration-1000">
         {isExpired ? (
           <div className="max-w-2xl mx-auto bg-white dark:bg-[#1d1d1f] rounded-3xl p-8 sm:p-12 text-center shadow-sm">
             <h2 className="text-2xl sm:text-4xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight mb-4"><TranslatedText tKey="quote_exp" defaultText="Quotation Expired" /></h2>
             <p className="text-[#86868b] font-normal mb-8">
               <TranslatedText tKey="quote_exp_desc" defaultText="This quote is over 7 days old. Prices for camera parts change, so we need to make a new one for you." />
             </p>
             <a 
               href={`/wizard?requote=${lead.id}`}
               className="inline-flex items-center justify-center bg-[#0071e3] hover:bg-[#0077ED] text-white px-8 py-3.5 rounded-full font-medium text-[15px] transition-colors"
             >
               <TranslatedText tKey="quote_req_new" defaultText="Request Re-quote" />
             </a>
           </div>
         ) : (
           <ConfiguratorView 
             lead={lead} 
             pricingCache={pricingCache} 
             promoterDiscount={{
               percent: promoter?.discount_type === "percent" ? (promoter.discount_value || 0) : 0,
               flat: promoter?.discount_type === "flat" ? (promoter.discount_value || 0) : 0
             }}
             customLayoutId={promoter?.custom_layout_id}
           />
         )}
      </div>
    </main>
  );
}
