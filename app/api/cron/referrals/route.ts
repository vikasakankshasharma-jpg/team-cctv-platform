import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { msg91 } from "@/lib/whatsapp/msg91-provider";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Verify Vercel Cron Secret (if configured)
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Find jobs completed more than 48 hours ago where review_request_sent is false/missing
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    // We fetch COMPLETED jobs and filter by date/flag in memory to avoid complex compound indexing issues on newly added fields
    const snapshot = await adminDb.collection("jobs")
      .where("status", "==", "COMPLETED")
      .get();

    const jobsToProcess: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.review_request_sent) {
        if (data.completedDate) {
          const completedAt = new Date(data.completedDate);
          if (completedAt < fortyEightHoursAgo) {
            jobsToProcess.push({ id: doc.id, ...data });
          }
        }
      }
    });

    if (jobsToProcess.length === 0) {
      return NextResponse.json({ success: true, message: "No eligible jobs found for referral campaign" });
    }

    const REVIEW_LINK = process.env.GOOGLE_REVIEW_LINK || "https://g.page/r/TEAM-CCTV-REVIEW";
    let sentCount = 0;

    // 3. Process each job
    for (const job of jobsToProcess) {
      try {
        const leadDoc = await adminDb.collection("leads").doc(job.leadId).get();
        if (!leadDoc.exists) continue;
        const lead = leadDoc.data()!;
        const phone = lead.phone || lead.mobile;
        
        if (!phone) continue;

        // Generate a unique referral code for this customer (e.g. Rahul -> RAHULXXXX)
        const namePrefix = (lead.name || "CCTV").substring(0, 4).toUpperCase();
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const referralCode = `${namePrefix}${randomSuffix}`;

        // Save referral code logic to customer profile
        if (lead.firebase_uid) {
           await adminDb.collection("customers").doc(lead.firebase_uid).set({
             referralCode: referralCode,
           }, { merge: true });
        }

        // Send WhatsApp Template Message
        await msg91.sendReviewAndReferral({
           phone: phone,
           customerName: lead.name || "Valued Customer",
           referralCode: referralCode,
           reviewLink: REVIEW_LINK
        });

        // Mark the job as processed
        await adminDb.collection("jobs").doc(job.id).update({
           review_request_sent: true,
           referral_code_generated: referralCode
        });

        // Log the activity in CRM Timeline
        await adminDb.collection("leads").doc(job.leadId).collection("activities").add({
           type: "system",
           action: "Referral & Review Campaign Sent",
           description: `Automated WhatsApp sent with Referral Code: ${referralCode}`,
           timestamp: serverTimestamp(),
           userId: "system"
        });

        sentCount++;
      } catch (err: any) {
        console.error(`Failed to process referral for job ${job.id}:`, err);
      }
    }

    return NextResponse.json({ success: true, processed: sentCount, totalEligible: jobsToProcess.length });
  } catch (error: any) {
    console.error("[CRON Referral Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
