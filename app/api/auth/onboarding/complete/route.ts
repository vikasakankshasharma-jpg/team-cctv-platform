import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth-server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated || !session.uid || !session.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { legalName, panNumber, gstNumber, address } = await req.json();

    if (!legalName || !panNumber) {
      return NextResponse.json({ error: "Legal Name and PAN are required to complete onboarding." }, { status: 400 });
    }

    // Determine which collection this user belongs to based on their role claim
    let collectionName = "";
    let redirectUrl = "";
    
    if (session.role === "installer") {
       collectionName = "installers";
       redirectUrl = "/installer/dashboard";
    } else if (session.role === "promoter") {
       collectionName = "promoters";
       redirectUrl = "/partner/dashboard";
    } else if (session.role === "external_ca") {
       collectionName = "admins";
       redirectUrl = "/admin/finance/exports";
    } else {
       collectionName = "admins";
       redirectUrl = "/admin/dashboard";
    }

    // Find the user document by firebase_uid
    const userQuery = await adminDb.collection(collectionName).where("firebase_uid", "==", session.uid).limit(1).get();
    
    if (userQuery.empty) {
       return NextResponse.json({ error: "User profile not found in database." }, { status: 404 });
    }

    const docRef = userQuery.docs[0].ref;

    // Update the profile to ACTIVE and save KYC data
    await docRef.update({
      status: "ACTIVE", // Clears the PENDING_KYC trap
      name: legalName, // Overwrite with Official Govt Name
      pan_number: panNumber,
      gst_number: gstNumber || null,
      address: address || null,
      kyc_verified_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return NextResponse.json({ success: true, redirectUrl });
  } catch (error: any) {
    console.error("Onboarding Complete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
