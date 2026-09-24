import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { idToken, authMethod, identifier, roleContext } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing authentication token." }, { status: 400 });
    }

    let uid = "";
    let email = "";
    let phoneNumber = "";

    // MOCK BYPASS FOR LOCAL DEVELOPMENT (Since Google Auth won't easily work without actual domains)
    if (idToken === "mock-jwt-token") {
      uid = "mock-uid-" + Date.now();
      email = identifier?.includes("@") ? identifier.toLowerCase().trim() : "";
      phoneNumber = !identifier?.includes("@") ? identifier : "";
    } else {
      // PROD: Verify real Firebase ID Token
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        uid = decodedToken.uid;
        email = decodedToken.email || "";
        phoneNumber = decodedToken.phone_number || "";
      } catch (err: any) {
        return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
      }
    }

    // 1. CUSTOMER ROUTING
    if (roleContext === "customer") {
      // In production, you would mint a session cookie and redirect to /customer/dashboard
      // For this unified router, we just grant access.
      const redirectUrl = "/customer/dashboard";
      
      // Setup Custom Claims for Customer
      if (idToken !== "mock-jwt-token") {
         await adminAuth.setCustomUserClaims(uid, { role: "customer" });
      }

      return NextResponse.json({ success: true, role: "customer", redirectUrl });
    }

    // 2. STAFF & PARTNER ROUTING (Enterprise Whitelist Gate)
    if (roleContext === "staff") {
      let assignedRole = "";
      let redirectUrl = "";
      let permissions = {};

      // A. Check Admins (Staff/Accountants/CA)
      if (email) {
        
        const adminDoc = await adminDb.collection("admins").where("email", "==", email).limit(1).get();
        if (!adminDoc.empty) {
          const data = adminDoc.docs[0].data();
          if (data.is_active === false) {
             return NextResponse.json({ error: "Your account is suspended." }, { status: 403 });
          }
          assignedRole = data.role || "staff";
          permissions = data.permissions || {};
          
          if (data.status === "PENDING_KYC") {
             redirectUrl = "/onboarding";
          } else if (assignedRole === "external_ca") {
             redirectUrl = "/admin/finance/exports";
          } else {
             redirectUrl = "/admin/dashboard"; 
          }
        }

      }

      // B. Check Installers (if not admin)
      if (!assignedRole && (email || phoneNumber)) {
        let installerQuery: any = adminDb.collection("installers");
        if (email) installerQuery = installerQuery.where("email", "==", email);
        else installerQuery = installerQuery.where("mobile_number", "==", phoneNumber);

        
        const instDoc = await installerQuery.limit(1).get();
        if (!instDoc.empty) {
           const data = instDoc.docs[0].data();
           if (data.is_active === false) return NextResponse.json({ error: "Account suspended." }, { status: 403 });
           assignedRole = "installer";
           
           if (data.status === "PENDING_KYC") {
             redirectUrl = "/onboarding";
           } else {
             redirectUrl = "/installer/dashboard";
           }
        }

      }

      // C. Check Promoters (if not admin/installer)
      if (!assignedRole && (email || phoneNumber)) {
        let promoterQuery: any = adminDb.collection("promoters");
        if (email) promoterQuery = promoterQuery.where("email", "==", email);
        else promoterQuery = promoterQuery.where("mobile_number", "==", phoneNumber);

        
        const promDoc = await promoterQuery.limit(1).get();
        if (!promDoc.empty) {
           const data = promDoc.docs[0].data();
           if (data.is_active === false) return NextResponse.json({ error: "Account suspended." }, { status: 403 });
           assignedRole = "promoter";
           
           if (data.status === "PENDING_KYC") {
             redirectUrl = "/onboarding";
           } else {
             redirectUrl = "/partner/dashboard";
           }
        }

      }

      // Rejection Gate
      if (!assignedRole) {
        return NextResponse.json({ 
          error: "Unauthorized: This identity is not registered as authorized staff or partner." 
        }, { status: 403 });
      }

      // Set Claims
      if (idToken !== "mock-jwt-token") {
         await adminAuth.setCustomUserClaims(uid, { role: assignedRole, permissions });
      }

      return NextResponse.json({ success: true, role: assignedRole, redirectUrl });
    }

    return NextResponse.json({ error: "Invalid role context." }, { status: 400 });
  } catch (error: any) {
    console.error("Unified Auth Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
