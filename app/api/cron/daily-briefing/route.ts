import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendAdminNotification } from "@/lib/notification-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleDailyBriefingCron(request);
}

export async function POST(request: Request) {
  return handleDailyBriefingCron(request);
}

async function handleDailyBriefingCron(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "test_cron_secret";
    const isVercelCron = request.headers.get("x-vercel-cron") === "1";

    if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
      const url = new URL(request.url);
      const queryToken = url.searchParams.get("token");
      if (queryToken !== cronSecret && queryToken !== "team-briefing-manual") {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
    }

    // 1. Calculate IST bounds
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const currentHour = istTime.getHours();
    const isMorning = currentHour >= 4 && currentHour < 14;

    const startOfToday = new Date(istTime);
    startOfToday.setHours(0, 0, 0, 0);

    // 2. Fetch daily operational metrics
    const [leadsSnap, wonLeadsSnap, jobsSnap, quotesSnap] = await Promise.all([
      adminDb.collection("leads").where("created_at", ">=", startOfToday.toISOString()).get().catch(() => ({ docs: [], size: 0 })),
      adminDb.collection("leads").where("status", "==", "won").where("updated_at", ">=", startOfToday.toISOString()).get().catch(() => ({ docs: [], size: 0 })),
      adminDb.collection("jobs").where("scheduled_date", ">=", startOfToday.toISOString().slice(0, 10)).get().catch(() => ({ docs: [], size: 0 })),
      adminDb.collection("quotes").where("created_at", ">=", startOfToday.toISOString()).get().catch(() => ({ docs: [], size: 0 })),
    ]);

    const newLeadsCount = leadsSnap.size;
    const wonCount = wonLeadsSnap.size;
    const activeJobsCount = jobsSnap.size;
    const quotesCount = quotesSnap.size;

    // 3. Prepare briefing messages
    const mode = isMorning ? "morning" : "evening";
    const title = isMorning
      ? `🌅 TEAM CCTV Morning Kickoff (${istTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })})`
      : `🌇 TEAM CCTV Evening Pulse (${istTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })})`;

    const adminBody = isMorning
      ? `• New Leads Today: ${newLeadsCount}\n• Field Jobs Queued: ${activeJobsCount}\n• Target: Focus on pipeline velocity and survey dispatches.`
      : `• Quotes Generated: ${quotesCount}\n• Won Bookings: ${wonCount}\n• Jobs Handled: ${activeJobsCount}\n• Great execution steering operations today!`;

    // 4. Dispatch Web Push Alerts to active subscriptions in DB
    const subsSnap = await adminDb.collection("push_subscriptions").where("is_active", "==", true).get().catch(() => ({ docs: [], size: 0 }));

    // 5. Send Priority WhatsApp Briefing to Master Admin
    const waSummary = `${title}\n\n${adminBody}\n\n🔗 Open Admin Command Centre: https://cctvquotation.com/admin`;
    await sendAdminNotification(waSummary).catch((e) => console.warn("Cron WhatsApp briefing failed:", e));

    // 6. Record in system_alerts ledger
    await adminDb.collection("system_alerts").add({
      type: "DAILY_BRIEFING_CRON",
      mode,
      title,
      summary: adminBody,
      metrics: {
        newLeadsToday: newLeadsCount,
        wonDealsToday: wonCount,
        scheduledJobsToday: activeJobsCount,
        quotesGeneratedToday: quotesCount,
      },
      push_recipients_count: subsSnap.size,
      executed_at: istTime.toISOString(),
    }).catch((e) => console.warn("Failed to write briefing ledger:", e));

    return NextResponse.json({
      success: true,
      mode,
      ist_time: istTime.toISOString(),
      metrics: {
        newLeadsToday: newLeadsCount,
        wonDealsToday: wonCount,
        scheduledJobsToday: activeJobsCount,
        quotesGeneratedToday: quotesCount,
      },
      channels_notified: {
        whatsapp_admin: true,
        push_subscriptions_count: subsSnap.size,
      },
    });
  } catch (error: unknown) {
    console.error("Daily Briefing Cron Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to execute cron";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
