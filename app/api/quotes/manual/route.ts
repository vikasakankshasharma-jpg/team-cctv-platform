import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      lead_id, items, addons, discount_percent, discount_amount, 
      subtotal, total_payable, installation_cost, note,
      total_purchase_cost, gross_profit_value, gross_profit_percent 
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: "Missing items" }, { status: 400 });
    }

    // Generate Quote ID
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const quoteId = `QT-${year}-${randomSuffix}-M`; // -M for manual

    let customer_name = "Manual Walk-in";
    let customer_mobile = "0000000000";
    let customerId = `CUST-${year}-${Math.floor(10000 + Math.random() * 90000)}`;

    if (lead_id) {
        const leadDoc = await adminDb.collection("leads").doc(lead_id).get();
        if (leadDoc.exists) {
            const data = leadDoc.data();
            customer_name = data?.customer_name || customer_name;
            customer_mobile = data?.mobile_number || customer_mobile;
            
            if (data?.customerId) {
                customerId = data.customerId;
            } else if (data?.firebase_uid) {
                const custDocs = await adminDb.collection("customers").where("authUid", "==", data.firebase_uid).limit(1).get();
                if (!custDocs.empty) {
                    customerId = custDocs.docs[0].id;
                } else {
                    await adminDb.collection("customers").doc(customerId).set({
                        id: customerId,
                        authUid: data.firebase_uid,
                        name: customer_name,
                        phone: customer_mobile,
                        type: "ONLINE_PORTAL",
                        createdAt: new Date().toISOString()
                    });
                }
            } else {
                await adminDb.collection("customers").doc(customerId).set({
                    id: customerId,
                    authUid: null,
                    name: customer_name,
                    phone: customer_mobile,
                    type: "WALK_IN",
                    createdAt: new Date().toISOString()
                });
            }
        }
    } else {
         await adminDb.collection("customers").doc(customerId).set({
             id: customerId,
             authUid: null,
             name: customer_name,
             phone: customer_mobile,
             type: "WALK_IN",
             createdAt: new Date().toISOString()
         });
    }

    // Map manual items to any structure
    const pricingSnapshot = {
        plan_type: "custom",
        technology: "custom",
        items: items,
        addons: addons || [],
        base_hardware_cost: subtotal,
        cabling_cost: 0,
        labor_cost: installation_cost || 0,
        addons_total: 0,
        gross_subtotal: subtotal + installation_cost,
        referral_discount: discount_amount || 0,
        net_taxable_amount: total_payable,
        gst_rate: 0,
        gst_amount: 0,
        total_payable: total_payable,
        total_purchase_cost: total_purchase_cost || 0,
        gross_profit_value: gross_profit_value || 0,
        gross_profit_percent: gross_profit_percent || 0
    };

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 7);

    const snapshot: any = {
      id: quoteId,
      customerId,
      customer_mobile,
      customer_name,
      requirementSnapshot: { manual: true, camera_count: items.reduce((acc: number, curr: any) => curr.display_name.toLowerCase().includes('camera') ? acc + curr.qty : acc, 0) },
      configurationSnapshot: { selected_items: items },
      pricingSnapshot,
      selectedPlan: "custom" as any,
      source: "manual",
      status: "GENERATED",
      leadStatus: "NEW",
      version: 1,
      salesNotes: note,
      createdAt: new Date().toISOString(),
      validUntil: validUntilDate.toISOString()
    };

    // Save to unified 'quotes' collection
    await adminDb.collection("quotes").doc(quoteId).set({
        ...snapshot,
        _serverCreatedAt: serverTimestamp(),
    });

    // Optional: Keep legacy leads update for backward compatibility
    if (lead_id) {
        await adminDb.collection("leads").doc(lead_id).update({
            status: "quoted",
            last_quote_id: quoteId
        });
    }

    return NextResponse.json({ id: quoteId, message: "Manual Quote generated successfully" }, { status: 201 });
  } catch (err: any) {
    console.error("[Manual Quote Error]", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}



