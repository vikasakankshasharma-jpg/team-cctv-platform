import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    if (!(await checkRole())) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { jobId } = await params;
    
    let certId = "";

    await adminDb.runTransaction(async (transaction) => {
       // 1. Validate Job
       const jobRef = adminDb.collection("jobs").doc(jobId);
       const jobDoc = await transaction.get(jobRef);
       
       if (!jobDoc.exists) throw new Error("Job not found");
       const job = jobDoc.data()!;
       
       if (job.status !== "COMPLETED") {
          throw new Error("Job must be completed to generate a warranty certificate.");
       }
       
       // 2. Check Idempotency (Already Generated?)
       const existingSnapshot = await transaction.get(adminDb.collection("warranty_certificates").where("jobId", "==", jobId));
       if (!existingSnapshot.empty) {
          throw new Error(`Warranty Certificate already exists: ${existingSnapshot.docs[0].id}`);
       }
       
       // 3. Fetch Serialized Assets Installed in this Job
       const assetsSnapshot = await transaction.get(adminDb.collection("serial_assets").where("jobId", "==", jobId));
       const assets = assetsSnapshot.docs.map(d => d.data());
       
       if (assets.length === 0) {
          throw new Error("No serialized assets found for this job. Cannot generate warranty.");
       }
       
       // 4. Calculate Dates (Defaulting to 12 months if not specified)
       const installationDate = new Date(job.completedDate);
       const warrantyStart = installationDate.toISOString();
       
       // 5. Build Immutable Certificate Document
       const certRef = adminDb.collection("warranty_certificates").doc();
       certId = certRef.id;
       
       const certNumber = `WARR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
       
       const immutableAssetsList = assets.map(a => {
          const endDate = new Date(installationDate);
          const months = a.warrantyMonths || 12; // Fallback to 12 if undefined
          endDate.setMonth(endDate.getMonth() + months);
          
          return {
             serialNumber: a.serialNumber,
             skuId: a.skuId,
             productName: a.productName,
             warrantyMonths: months,
             warrantyEndDate: endDate.toISOString()
          };
       });
       
       transaction.set(certRef, {
          id: certId,
          certNumber,
          jobId,
          dealId: job.dealId,
          customerId: job.customerId,
          issuedAt: new Date().toISOString(),
          installationDate: warrantyStart,
          assets: immutableAssetsList,
          terms: "1. Warranty covers manufacturing defects only. 2. Physical damage voids warranty.",
          status: "ACTIVE"
       });
    });

    return NextResponse.json({ success: true, message: "Warranty Certificate generated successfully", certId });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
