import { getCachedProducts, getCachedAddons } from "@/lib/cached-catalog";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb, serverTimestamp, arrayUnion } from "@/lib/firebase-admin";
import { QuoteSnapshot, Product, Addon, AppSettings } from "@/types";
import { generateConfiguration } from "@/lib/configuration-engine";
import { resolveProducts } from "@/lib/product-resolver";
import { generatePricingSnapshot } from "@/lib/pricing-engine";
import { SETTINGS_DOC_ID } from "@/lib/constants";
import { MarginEngine, DEFAULT_MARGIN_POLICY } from "@/lib/margin-engine";

async function getCachedAdminSettings(): Promise<AppSettings> {
  const doc = await adminDb.collection("settings").doc(SETTINGS_DOC_ID).get();
  if (doc.exists) {
    return doc.data() as AppSettings;
  }
  return {
    company_name: "TEAM CCTV",
    gst_rate: 18,
    labor_fitting_only_rate: 300,
    labor_full_installation_rate: 500,
    wire_cost_per_meter: 12,
    labor_ip_per_camera: 500,
    labor_hd_per_camera: 400,
    cable_copper_coated_ip: 12,
    cable_copper_coated_hd: 8,
    connector_rj45_cost: 25,
    connector_bnc_dc_cost: 70,
    quote_validity_days: 7,
  } as AppSettings;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      customer_mobile: rawMobile, 
      customer_name, 
      requirementSnapshot, 
      configurationSnapshot, 
      selectedPlan = "recommended",
      parentQuoteId,
      source = "wizard"
    } = data;

    let customer_mobile = String(rawMobile || "").replace(/\D/g, "").slice(-10);
    
    let leadId: string | null = data.leadId || null;
    let finalCustomerName = customer_name;

    if (leadId && !customer_mobile) {
      const doc = await adminDb.collection("leads").doc(leadId).get();
      if (doc.exists) {
        const leadData = doc.data();
        if (leadData?.mobile_number) customer_mobile = leadData.mobile_number;
        if (!finalCustomerName && leadData?.customer_name) finalCustomerName = leadData.customer_name;
      }
    }

    if (!customer_mobile || customer_mobile.length !== 10 || !/^[6-9]/.test(customer_mobile)) {
      return NextResponse.json(
        { success: false, message: "A valid 10-digit Indian mobile number is required" },
        { status: 400 }
      );
    }

    if (!requirementSnapshot) {
      return NextResponse.json(
        { success: false, message: "Missing requirementSnapshot" },
        { status: 400 }
      );
    }

    // 2. Fetch Fresh Catalog & Settings (Server Authority)
    const [settings, productsSnap, addonsSnap] = await Promise.all([
      getCachedAdminSettings(),
      adminDb.collection("products").where("is_active", "==", true).get(),
      adminDb.collection("addons").where("is_active", "==", true).get(),
    ]);

    const catalog = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)).filter(p => p.is_quotation_eligible !== false);
    const addons = addonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));

    // 3. Authoritatively Calculate Pricing Server-Side (Zero Client Trust)
    let authoritativePricing: any = null;
    let finalConfig = configurationSnapshot;

    const marginPolicy: any = {
      ...DEFAULT_MARGIN_POLICY,
      ...((settings as any)?.margin_policy || {}),
      margin_hdd: settings?.margin_hdd ?? (settings as any)?.margin_policy?.margin_hdd ?? DEFAULT_MARGIN_POLICY.margin_hdd,
      margin_hdd_budget: settings?.margin_hdd_budget ?? (settings as any)?.margin_policy?.margin_hdd_budget ?? DEFAULT_MARGIN_POLICY.margin_hdd_budget,
      margin_cctv_camera: settings?.margin_cctv_camera ?? (settings as any)?.margin_policy?.margin_cctv_camera ?? DEFAULT_MARGIN_POLICY.margin_cctv_camera,
      margin_cctv_camera_budget: settings?.margin_cctv_camera_budget ?? (settings as any)?.margin_policy?.margin_cctv_camera_budget ?? DEFAULT_MARGIN_POLICY.margin_cctv_camera_budget,
      margin_recorder: settings?.margin_recorder ?? (settings as any)?.margin_policy?.margin_recorder ?? DEFAULT_MARGIN_POLICY.margin_recorder,
      margin_junction_box: settings?.margin_junction_box ?? (settings as any)?.margin_policy?.margin_junction_box ?? DEFAULT_MARGIN_POLICY.margin_junction_box,
      margin_connectors: settings?.margin_connectors ?? (settings as any)?.margin_policy?.margin_connectors ?? DEFAULT_MARGIN_POLICY.margin_connectors,
      margin_hdmi_cable: settings?.margin_hdmi_cable ?? (settings as any)?.margin_policy?.margin_hdmi_cable ?? DEFAULT_MARGIN_POLICY.margin_hdmi_cable,
      margin_rack: settings?.margin_rack ?? (settings as any)?.margin_policy?.margin_rack ?? DEFAULT_MARGIN_POLICY.margin_rack,
      margin_power_supply: settings?.margin_power_supply ?? (settings as any)?.margin_policy?.margin_power_supply ?? DEFAULT_MARGIN_POLICY.margin_power_supply,
    };
    if (source === "pro_builder" && configurationSnapshot?.items) {
      // Pro Builder Item-by-Item Verification — Zero Client Trust
      
      let totalWiredCameras = 0;
      let totalCableMeters = 0;
      let isIPSystem = false;
      
      for (const item of configurationSnapshot.items as any[]) {
          const dbProduct: any = catalog.find(p => p.id === item.product_id) || addons.find(a => a.id === item.product_id) || { category: item.category };
          const cat = (dbProduct.category || "").toLowerCase();
          const qty = Math.max(1, Math.min(100, Math.floor(Number(item.qty || 1))));
          
          if (cat === "cctv_camera" || cat.includes("camera")) {
              if (item.product_id?.toLowerCase().includes("ip")) isIPSystem = true;
              if (!item.product_id?.toLowerCase().includes("wifi") && !item.product_id?.toLowerCase().includes("wireless")) {
                  totalWiredCameras += qty;
              }
          } else if (cat === "cable") {
              const name = (dbProduct.display_name || item.name || "").toLowerCase();
              let lengthInItem = 90;
              if (name.includes("305")) lengthInItem = 305;
              else if (name.includes("70")) lengthInItem = 70;
              else if (name.includes("100")) lengthInItem = 100;
              else if (name.match(/(\d+)\s*m/)) {
                  lengthInItem = parseInt(name.match(/(\d+)\s*m/)[1], 10);
              }
              totalCableMeters += (lengthInItem * qty);
          }
      }
      
      const cablingDone = requirementSnapshot.cabling_done ?? false;
      const strictLaborRate = cablingDone 
          ? (settings.labor_fitting_only_rate || 300)
          : (isIPSystem ? (settings.labor_ip_per_camera || settings.labor_full_installation_rate || 500) : (settings.labor_hd_per_camera || settings.labor_full_installation_rate || 400));

      let subtotal = 0;
      const verifiedItems: any[] = [];
      for (const item of configurationSnapshot.items as any[]) {
        let dbProduct: any = catalog.find(p => p.id === item.product_id) || addons.find(a => a.id === item.product_id);

        if (!dbProduct) {
          // Check known system-generated line items (cables, connectors, labor, surcharges)
          if (item.product_id === "cable_cat6") {
            dbProduct = { id: "cable_cat6", display_name: "CAT6 IP Camera Cable", category: "cable", unit_price: settings.cable_copper_coated_ip || 15 };
          } else if (item.product_id === "cable_3plus1") {
            dbProduct = { id: "cable_3plus1", display_name: "3+1 HD Camera Cable", category: "cable", unit_price: settings.cable_copper_coated_hd || 12 };
          } else if (item.product_id === "conn_rj45") {
            dbProduct = { id: "conn_rj45", display_name: "RJ45 Connectors", category: "accessory", unit_price: settings.connector_rj45_cost || 25 };
          } else if (item.product_id === "conn_bnc_dc") {
            dbProduct = { id: "conn_bnc_dc", display_name: "BNC & DC Connectors", category: "accessory", unit_price: settings.connector_bnc_dc_cost || 70 };
          } else if (item.product_id === "labor_install") {
            dbProduct = { id: "labor_install", display_name: "Installation & Labor", category: "labor", unit_price: settings.labor_ip_per_camera || 500 };
          } else if (item.product_id === "PRO_INSTALL_HD") {
            dbProduct = { id: "PRO_INSTALL_HD", display_name: "Standard Installation (HD)", category: "installation", unit_price: 600 };
          } else if (item.product_id === "PRO_INSTALL_IP") {
            dbProduct = { id: "PRO_INSTALL_IP", display_name: "Standard Installation (IP)", category: "installation", unit_price: 800 };
          } else if (item.product_id?.startsWith("PRO_INSTALL_")) {
            dbProduct = { id: item.product_id, display_name: item.display_name || item.name || "Standard Installation", category: "installation", unit_price: item.product_id.includes("HD") ? 600 : 800 };
          } else if (item.product_id?.startsWith("surcharge_")) {
            dbProduct = { id: item.product_id, display_name: item.name || item.display_name || "Site Surcharge", category: "labor", unit_price: 500 };
          } else if (item.product_id === "SYS_GIGABIT_SWITCH") {
            dbProduct = { id: "SYS_GIGABIT_SWITCH", display_name: "8-Port Gigabit Desktop Switch (Core Hub)", category: "accessory", unit_price: settings.network_switch_cost || 800 };
          }
        }

        if (!dbProduct) {
          // Unknown product — reject entirely rather than trusting client price
          return NextResponse.json(
            { success: false, message: `Product ${item.product_id} not found in catalog` },
            { status: 400 }
          );
        }

                // Determine the final retail price for the Custom Build following Guided Setup rules exactly
        let verifiedUnitPrice = 0;
        const cat = (dbProduct.category || "").toLowerCase();
        const baseCost = dbProduct.base_cost || dbProduct.unit_price || 0;

        if (cat === "cable") {
            const cableMarginPct = (settings as any).margin_cable ?? 50;
            verifiedUnitPrice = Math.round(baseCost * (1 + cableMarginPct / 100));
        } else if (cat === "labor" || cat === "installation") {
            // Strict rule: Overwrite any catalog price with the strict market rate
            verifiedUnitPrice = Math.round(strictLaborRate);
        } else if (cat.includes("surcharge")) {
            // Surcharges have no margin
            verifiedUnitPrice = Math.round(baseCost);
        } else {
            // Hardware and accessories use MarginEngine (resolving price/margin conflicts)
            const isStorage = cat.includes("storage") || cat.includes("hdd") || cat.includes("hard disk") || (dbProduct.storage_type && dbProduct.storage_type.toLowerCase().includes("hard disk"));
            const effectiveCat = isStorage ? "storage" : (cat || "cctv_camera");
            const calc = MarginEngine.calculateUnitPricing(baseCost, effectiveCat, "recommended", marginPolicy, dbProduct.brand);
            verifiedUnitPrice = calc.sellingPriceExTax;
        }

        // Clamp quantity: must be positive integer, max 100
        const rawQty = Number(item.qty || 1);
        const qty = Math.max(1, Math.min(100, Math.floor(rawQty)));

        const lineTotal = verifiedUnitPrice * qty;
        subtotal += lineTotal;

        verifiedItems.push({
          product_id: item.product_id,
          name: dbProduct.display_name || item.name || item.display_name,
          category: dbProduct.category || item.category,
          unit_price: verifiedUnitPrice,
          qty,
          line_total: lineTotal,
          // Deliberately omit any client-sent discount, coupon, or override fields
        });
      }

      // Strict Rule: Excess Cabling Labor
      if (!cablingDone && totalWiredCameras > 0 && totalCableMeters > 0) {
          const defaultMetersPerCamera = 15;
          const freeLimit = totalWiredCameras * defaultMetersPerCamera;
          const excessMeters = Math.max(0, totalCableMeters - freeLimit);
          
          if (excessMeters > 0) {
              const excessLaborRate = 15;
              const excessLineTotal = excessLaborRate * excessMeters;
              subtotal += excessLineTotal;
              verifiedItems.push({
                  product_id: "labor_cabling_excess",
                  name: `Excess Cabling Installation Labor (${excessMeters}m beyond ${freeLimit}m free limit)`,
                  category: "labor",
                  unit_price: excessLaborRate,
                  qty: excessMeters,
                  line_total: excessLineTotal
              });
          }
      }
      
      const gstRate = settings.gst_rate || 18;
      const gstAmount = Math.round(subtotal * (gstRate / 100));
      const totalPayable = subtotal + gstAmount;

      authoritativePricing = {
        base_hardware_cost: subtotal,
        gross_subtotal: subtotal,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total_payable: totalPayable,
        items: verifiedItems,
        addons: [],
      };
      finalConfig = { ...configurationSnapshot, items: verifiedItems };
    } else {
      // Wizard Configuration Flow
      const config = generateConfiguration(requirementSnapshot);
      finalConfig = config;

      // Extract optional brand prefix from selectedPlan (e.g., "CP Plus_HD_2MP" -> brand: "CP Plus")
      let brandFilter: string | undefined = undefined;
      if (selectedPlan && selectedPlan.includes("_")) {
        const parts = selectedPlan.split("_");
        if (["CP Plus", "Hikvision", "Prama", "Dahua"].includes(parts[0])) {
          brandFilter = parts[0];
        }
      }

      const res = resolveProducts(config, requirementSnapshot, catalog, brandFilter);
      let targetSystem = res.plans[selectedPlan] || Object.values(res.plans)[0];

      if (!targetSystem) {
        // Fallback to budget resolution if specific plan key not resolved
        const fallbackRes = resolveProducts(config, requirementSnapshot, catalog);
        targetSystem = Object.values(fallbackRes.plans)[0];
      }

      if (!targetSystem) {
        return NextResponse.json(
          { success: false, message: "Could not resolve compatible products for requirements" },
          { status: 400 }
        );
      }

      const selectedAddonIds = requirementSnapshot.selected_addons || [];
      authoritativePricing = generatePricingSnapshot(
        targetSystem,
        requirementSnapshot,
        addons,
        selectedAddonIds,
        settings
      );
    }

    // 4. Collision-Safe & Immutable Quote Identification
    const year = new Date().getFullYear();
    let quoteId: string;
    let version = 1;

    if (parentQuoteId) {
      // Transaction to safely read parent version and claim next version atomically
      const revisionResult = await adminDb.runTransaction(async (txn) => {
        const parentRef = adminDb.collection("quotes").doc(parentQuoteId);
        const parentDoc = await txn.get(parentRef);
        if (!parentDoc.exists) {
          return { error: `Parent quote ${parentQuoteId} not found` };
        }
        const parentData = parentDoc.data() as any;
        const nextVersion = (parentData.version || 1) + 1;
        const revisionId = `${parentQuoteId}_v${nextVersion}`;

        // Check the revision doc doesn't already exist (concurrent safety)
        const revisionRef = adminDb.collection("quotes").doc(revisionId);
        const revisionDoc = await txn.get(revisionRef);
        if (revisionDoc.exists) {
          return { error: `Revision ${revisionId} already exists` };
        }

        // Reserve the revision doc with a placeholder so no other txn can claim it
        txn.set(revisionRef, { _reserved: true, _reservedAt: new Date().toISOString() });

        return { quoteId: revisionId, version: nextVersion };
      });

      if (revisionResult.error) {
        return NextResponse.json(
          { success: false, message: revisionResult.error },
          { status: revisionResult.error.includes("not found") ? 404 : 409 }
        );
      }
      quoteId = revisionResult.quoteId!;
      version = revisionResult.version!;
    } else {
      // Collision-safe generation: 16.7M combinations with retry check
      let attempts = 0;
      let uniqueFound = false;
      let candidateId = "";

      while (attempts < 5 && !uniqueFound) {
        candidateId = `QT-${year}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
        const existing = await adminDb.collection("quotes").doc(candidateId).get();
        if (!existing.exists) {
          uniqueFound = true;
        }
        attempts++;
      }
      quoteId = candidateId;
    }

    // 5. Build and Save Immutable Snapshot
    const validityDays = settings.quote_validity_days || 7;
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validityDays);

    const snapshot: QuoteSnapshot = {
      id: quoteId,
      customer_mobile,
      customer_name: finalCustomerName || "",
      requirementSnapshot,
      configurationSnapshot: finalConfig,
      pricingSnapshot: authoritativePricing,
      total_payable: authoritativePricing.total_payable,
      selectedPlan,
      source: source || "wizard",
      status: "GENERATED",
      version,
      parentQuoteId: parentQuoteId || null,
      pricing_engine_version: "2026.1",
      catalog_version: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      generatedAt: serverTimestamp() as any,
      validUntil: validUntilDate.toISOString(),
      is_test: customer_mobile === "9999999999" || customer_name?.toLowerCase().includes("e2e test"),
      ttl: (customer_mobile === "9999999999" || customer_name?.toLowerCase().includes("e2e test")) ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
    };

    // Save as a brand new immutable document
    const cleanSnapshot = JSON.parse(JSON.stringify(snapshot));
    await adminDb.collection("quotes").doc(quoteId).set({
      ...cleanSnapshot,
      _serverCreatedAt: serverTimestamp(),
    });

    // 6. Lead Association (Find or Create Lead)
    
    try {
      const leadsRef = adminDb.collection("leads");
      let existingLeadSnap = null;
      
      if (leadId) {
        const doc = await leadsRef.doc(leadId).get();
        if (doc.exists) {
          existingLeadSnap = { empty: false, docs: [doc] };
        }
      }
      
      if (!existingLeadSnap || existingLeadSnap.empty) {
        existingLeadSnap = await leadsRef.where("mobile_number", "==", customer_mobile).limit(1).get();
      }

      if (!existingLeadSnap.empty) {
        leadId = existingLeadSnap.docs[0].id;
        
        await leadsRef.doc(leadId).update({
          updated_at: serverTimestamp(),
          latest_quote_id: quoteId,
          quote_ids: arrayUnion(quoteId),
          // Do not overwrite top-level camera_count, property_type, etc. 
          // to preserve the original conversation intent.
          // Just update the latest wizard_answers for reference.
          "wizard_answers.latest": JSON.parse(JSON.stringify(requirementSnapshot)),
        });
      } else {
        const newLeadRef = leadsRef.doc();
        leadId = newLeadRef.id;
        await newLeadRef.set({
          id: leadId,
          customer_name: finalCustomerName || "Prospective Client",
          mobile_number: customer_mobile,
          property_type: requirementSnapshot.property_type || "home",
          technology_choice: requirementSnapshot.technology_preference || "HD",
          cabling_done: requirementSnapshot.cabling_done ?? false,
          camera_count: requirementSnapshot.camera_count || 0,
          wizard_answers: { latest: JSON.parse(JSON.stringify(requirementSnapshot)) },
          latest_quote_id: quoteId,
          quote_ids: [quoteId],
          status: "new",
          source: source || "wizard",
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      // Also record leadId onto the quote
      await adminDb.collection("quotes").doc(quoteId).update({
        leadId,
        lead_id: leadId,
      });
    } catch (err) {
      console.error("[Quote Save Lead Association Error]:", err);
    }

    return NextResponse.json({
      success: true,
      quoteId,
      version,
      leadId,
      snapshot: { ...snapshot, leadId },
    });
  } catch (error: any) {
    console.error("[Quote Save Server Error]:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to save quote" }, { status: 500 });
  }
}






