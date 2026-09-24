import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    // 1. Leads & Conversions
    const leadsSnapshot = await adminDb.collection("leads").get();
    const totalLeads = leadsSnapshot.size;
    let completedLeads = 0;
    let totalRevenue = 0;

    leadsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === "completed") {
        completedLeads++;
        if (data.final_quote_amount) {
          totalRevenue += data.final_quote_amount;
        }
      }
    });

    const conversionRate = totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0;

    // 2. Feedback Ratings
    const feedbackSnapshot = await adminDb.collection("feedbacks").get();
    let totalStars = 0;
    let feedbackCount = feedbackSnapshot.size;
    let pendingIssues = 0;

    feedbackSnapshot.forEach(doc => {
      const data = doc.data();
      totalStars += data.rating || 0;
      if (data.status === "pending_action") pendingIssues++;
    });

    const averageRating = feedbackCount > 0 ? (totalStars / feedbackCount).toFixed(1) : "0.0";

    // 3. Support Tickets (Installer Utilization)
    const ticketsSnapshot = await adminDb.collection("support_tickets").get();
    let openTickets = 0;
    ticketsSnapshot.forEach(doc => {
      if (doc.data().status !== "resolved") openTickets++;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalLeads,
        completedLeads,
        conversionRate,
        totalRevenue,
        averageRating,
        feedbackCount,
        pendingIssues,
        openTickets
      }
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
  }
}
