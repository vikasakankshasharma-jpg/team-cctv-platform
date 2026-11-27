import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendAdminNotification } from "@/lib/notification-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role") || "admin";

    // 1. Calculate IST bounds (Asia/Kolkata)
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const currentHour = istTime.getHours();
    const isMorning = currentHour >= 4 && currentHour < 14;

    const startOfToday = new Date(istTime);
    startOfToday.setHours(0, 0, 0, 0);

    // 2. Fetch today's operational indicators
    const [leadsSnap, jobsSnap, quotesSnap] = await Promise.all([
      adminDb
        .collection("leads")
        .where("created_at", ">=", startOfToday.toISOString())
        .get()
        .catch(() => ({ docs: [], size: 0 })),
      adminDb
        .collection("jobs")
        .where("scheduled_date", ">=", startOfToday.toISOString().slice(0, 10))
        .get()
        .catch(() => ({ docs: [], size: 0 })),
      adminDb
        .collection("quotes")
        .where("created_at", ">=", startOfToday.toISOString())
        .get()
        .catch(() => ({ docs: [], size: 0 })),
    ]);

    const newLeadsCount = leadsSnap.size;
    const scheduledJobsCount = jobsSnap.size;
    const quotesGeneratedCount = quotesSnap.size;

    const summary = {
      timestamp: istTime.toISOString(),
      mode: isMorning ? "morning" : "evening",
      role: roleParam,
      metrics: {
        newLeadsToday: newLeadsCount,
        scheduledJobsToday: scheduledJobsCount,
        quotesGeneratedToday: quotesGeneratedCount,
      },
      briefingMessage: isMorning
        ? `🌅 Morning Kickoff: ${newLeadsCount} new leads and ${scheduledJobsCount} field jobs queued for today.`
        : `🌇 Evening Pulse: ${quotesGeneratedCount} quotations generated and ${newLeadsCount} deals progressed today.`,
    };

    return NextResponse.json({ success: true, ...summary });
  } catch (error: unknown) {
    console.error("Daily Briefing Trigger Error:", error);
    const errMessage = error instanceof Error ? error.message : "Failed to compute daily briefing";
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
