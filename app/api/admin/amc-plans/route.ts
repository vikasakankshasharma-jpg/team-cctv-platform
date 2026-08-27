import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "SALES"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const snapshot = await adminDb.collection("amc_plans").get();
    const plans = snapshot.docs.map(doc => doc.data());
    
    return NextResponse.json({ success: true, data: plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    
    if (!body.name || !body.durationMonths) {
       return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const ref = adminDb.collection("amc_plans").doc();
    
    const newPlan = {
       id: ref.id,
       name: body.name,
       durationMonths: body.durationMonths,
       includedVisits: body.includedVisits || 0,
       emergencyVisits: body.emergencyVisits || 0,
       remoteSupport: body.remoteSupport || false,
       onsiteSupport: body.onsiteSupport || false,
       labourIncluded: body.labourIncluded || false,
       consumablesIncluded: body.consumablesIncluded || false,
       hardwareReplacementIncluded: body.hardwareReplacementIncluded || false,
       price: body.price || 0,
       isActive: body.isActive !== undefined ? body.isActive : true,
       createdAt: new Date().toISOString()
    };

    await ref.set(newPlan);

    return NextResponse.json({ success: true, data: newPlan });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
