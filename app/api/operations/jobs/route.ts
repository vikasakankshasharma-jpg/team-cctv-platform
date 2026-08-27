import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId } = body;
    
    if (!dealId) {
      return NextResponse.json({ success: false, message: "Deal ID required" }, { status: 400 });
    }

    const dealRef = adminDb.collection("deals").doc(dealId);
    
    let jobId = "";

    await adminDb.runTransaction(async (transaction) => {
       const dealDoc = await transaction.get(dealRef);
       if (!dealDoc.exists) throw new Error("Deal not found");
       
       const deal = dealDoc.data()!;
       if (deal.status !== "WON" && deal.status !== "READY_FOR_INSTALLATION") {
          // Idempotency check loosely depending on your flow. Let's just check jobs existence instead.
       }
       
       // Check if Job already exists
       const existingJobsQuery = adminDb.collection("jobs").where("dealId", "==", dealId);
       const existingJobs = await transaction.get(existingJobsQuery);
       if (!existingJobs.empty) {
          throw new Error("Job already exists for this deal");
       }

       const quoteDoc = await transaction.get(adminDb.collection("quotes").doc(deal.quoteSnapshotId));
       if (!quoteDoc.exists) throw new Error("Orphaned Deal, Quote not found");
       
       const quote = quoteDoc.data()!;
       const config = quote.configurationSnapshot?.resolvedSystem || {};
       const req = quote.requirementSnapshot || {};
       
       const bomCameras = config.cameras || [];
       const bomRecorder = config.recorder || null;
       const bomStorage = config.storage || null;
       const bomAccessories = config.accessories || [];
       const cameraCount = req.camera_count || bomCameras.length || 0;
       
       const needsAudio = bomCameras.some((c: any) => c.product?.features?.includes("audio") || c.product?.display_name?.toLowerCase().includes("audio"));

       jobId = `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
       
       const newJob = {
         id: jobId,
         dealId: dealId,
         quoteSnapshotId: deal.quoteSnapshotId,
         customerId: deal.customerId || "walk-in",
         customerName: deal.customerName || "Unknown",
         customerMobile: deal.customerMobile || "Unknown",
         siteAddress: "",
         
         bomCameras,
         bomRecorder,
         bomStorage,
         bomAccessories,
         cameraCount,
         
         status: "PENDING_SCHEDULE",
         
         checklist: {
           cameraMounting: false,
           cameraAngle: false,
           cableDressing: false,
           bncDcConnections: false,
           recorderConfigured: false,
           hddInitialized: false,
           recordingVerified: false,
           playbackVerified: false,
           networkConnectivityVerified: false,
           p2pCloudConfigured: false,
           mobileAppConfigured: false,
           remoteLiveViewVerified: false,
           remotePlaybackVerified: false,
           nightVisionChecked: false,
           ...(needsAudio ? { audioChecked: false } : {}),
           dateTimeConfigured: false,
           powerChecked: false,
           customerDemo: false
         },
         createdAt: new Date().toISOString()
       };
       
       transaction.set(adminDb.collection("jobs").doc(jobId), newJob);
       transaction.update(dealRef, { status: "READY_FOR_INSTALLATION" });
    });

    return NextResponse.json({ success: true, jobId, message: "Job Created (Atomic)" });
  } catch (error: any) {
    console.error("Job Creation Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const snapshot = await adminDb.collection('jobs').orderBy('createdAt', 'desc').limit(50).get();
    const jobs = snapshot.docs.map(doc => doc.data());
    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}