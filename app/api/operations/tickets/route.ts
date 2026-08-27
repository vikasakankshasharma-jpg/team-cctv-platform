import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "SALES", "OPERATIONS"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    
    let query: FirebaseFirestore.Query = adminDb.collection("service_tickets");
    if (customerId) {
       query = query.where("customerId", "==", customerId);
    }
    
    const snapshot = await query.orderBy("createdAt", "desc").get();
    const tickets = snapshot.docs.map(doc => doc.data());
    
    return NextResponse.json({ success: true, data: tickets });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

import { evaluateServiceEligibility } from "@/lib/service-eligibility";

export async function POST(request: Request) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "SALES", "OPERATIONS"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    let { customerId, category, priority, description, billingType, affectedAssetIds = [], dealId, jobId, skuId } = body;
    
    if (!customerId || !category || !priority || !description) {
       return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }
    
    // Evaluate Eligibility if not explicitly provided
    let eligibilityReason = "Manually specified";
    let amcContractId = null;
    
    if (!billingType || billingType === "AUTO") {
       const evalResult = await evaluateServiceEligibility(customerId, affectedAssetIds[0], skuId);
       billingType = evalResult.eligibility === "CHARGEABLE" ? "CHARGEABLE" : 
                     (evalResult.eligibility === "AMC_COVERAGE" ? "AMC" : "WARRANTY");
       eligibilityReason = evalResult.reason;
       amcContractId = evalResult.amcContractId;
    }

    const ticketRef = adminDb.collection("service_tickets").doc();
    const ticketNo = `ST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket = {
       id: ticketRef.id,
       ticketNo,
       customerId,
       dealId: dealId || null,
       jobId: jobId || null,
       category,
       priority,
       status: "OPEN",
       billingType,
       eligibilityReason,
       amcContractId: amcContractId || null,
       description,
       affectedAssetIds,
       createdAt: new Date().toISOString()
    };

    await ticketRef.set(newTicket);

    return NextResponse.json({ success: true, message: "Service Ticket created successfully", data: newTicket });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
