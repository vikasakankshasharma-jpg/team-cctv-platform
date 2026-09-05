import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb, serverTimestamp, arrayUnion } from "@/lib/firebase-admin";
import { QuoteSnapshot, Product, Addon, AppSettings } from "@/types";
import { generateConfiguration } from "@/lib/configuration-engine";
import { resolveProducts } from "@/lib/product-resolver";
import { generatePricingSnapshot } from "@/lib/pricing-engine";
import { SETTINGS_DOC_ID } from "@/lib/constants";

async function getAdminSettings(): Promise<AppSettings> {
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

    // 1. Validate & Normalize Mobile Number
    const customer_mobile = String(rawMobile || "").replace(/\D/g, "").slice(-10);
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
      getAdminSettings(),
      adminDb.collection("products").where("is_active", "==", true).where("is_quotation_eligible", "==", true).get(),
      adminDb.collection("addons").where("is_active", "==", true).get(),
    ]);

    const catalog = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    const addons = addonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));

    // 3. Authoritatively Calculate Pricing Server-Side (Zero Client Trust)
    let authoritativePricing: any = null;
    let finalConfig = configurationSnapshot;

    if (source === "pro_builder" && configurationSnapshot?.items) {
      // Pro Builder Item-by-Item Verification — Zero Client Trust
      let subtotal = 0;
      const verifiedItems: any[] = [];

      for (const item of configurationSnapshot.items as any[]) {
        const dbProduct = catalog.find(p => p.id === item.product_id) || addons.find(a => a.id === item.product_id);

        if (!dbProduct) {
          // Unknown product — reject entirely rather than trusting client price
          return NextResponse.json(
            { success: false, message: `Product ${item.product_id} not found in catalog` },
            { status: 400 }
          );
        }

        // Server-authoritative unit price — ignore any client-provided price
        const verifiedUnitPrice = dbProduct.unit_price || 0;

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
      customer_name: customer_name || "",
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
      validUntil: validUntilDate.toISOString(),
    };

    // Save as a brand new immutable document
    await adminDb.collection("quotes").doc(quoteId).set({
      ...snapshot,
      _serverCreatedAt: serverTimestamp(),
    });

    // 6. Lead Association (Find or Create Lead)
    let leadId: string | null = data.leadId || null;
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
          "wizard_answers.latest": requirementSnapshot,
        });
      } else {
        const newLeadRef = leadsRef.doc();
        leadId = newLeadRef.id;
        await newLeadRef.set({
          id: leadId,
          customer_name: customer_name || "Prospective Client",
          mobile_number: customer_mobile,
          property_type: requirementSnapshot.property_type || "home",
          technology_choice: requirementSnapshot.technology_preference || "HD",
          cabling_done: requirementSnapshot.cabling_done ?? false,
          camera_count: requirementSnapshot.camera_count || 0,
          wizard_answers: { latest: requirementSnapshot },
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
