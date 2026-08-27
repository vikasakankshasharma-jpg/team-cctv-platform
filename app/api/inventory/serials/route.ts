import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    if (!(await checkRole())) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const serialNumber = searchParams.get("serialNumber");
    const jobId = searchParams.get("jobId"); // Optional, but used for strict BOM checking

    if (!serialNumber) {
       return NextResponse.json({ success: false, message: "Serial Number is required" }, { status: 400 });
    }

    const snapshot = await adminDb.collection("serial_assets").where("serialNumber", "==", serialNumber).get();
    
    if (snapshot.empty) {
       return NextResponse.json({ success: false, message: "Serial Number not found" }, { status: 404 });
    }
    
    const asset = snapshot.docs[0].data();
    
    // Check if it's available
    if (asset.status !== "IN_STOCK" && asset.status !== "RESERVED") {
       return NextResponse.json({ 
          success: false, 
          message: `Asset is not available for allocation. Current status: ${asset.status}` 
       }, { status: 400 });
    }
    
    // If a jobId is provided, we can optionally check if this SKU belongs to the Job's BOM
    if (jobId) {
       const jobDoc = await adminDb.collection("jobs").doc(jobId).get();
       if (jobDoc.exists) {
          const job = jobDoc.data()!;
          let skuFoundInBom = false;
          
          if (job.bomCameras?.some((c: any) => c.product?.id === asset.skuId)) skuFoundInBom = true;
          if (job.bomRecorder?.product?.id === asset.skuId) skuFoundInBom = true;
          if (job.bomAccessories?.some((a: any) => a.product?.id === asset.skuId)) skuFoundInBom = true;
          
          if (!skuFoundInBom) {
             return NextResponse.json({ 
                success: false, 
                message: `SKU Mismatch: This serial number (${asset.skuId}) does not belong to the BOM for Job ${jobId}` 
             }, { status: 400 });
          }
       }
    }

    return NextResponse.json({ 
       success: true, 
       data: {
          serialNumber: asset.serialNumber,
          skuId: asset.skuId,
          productName: asset.productName,
          status: asset.status
       } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

