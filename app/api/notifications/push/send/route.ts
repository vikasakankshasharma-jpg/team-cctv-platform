import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendAdminNotification } from "@/lib/notification-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role, userId, title, message, url = "/", tag = "team-alert", broadcastWhatsApp = false } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message are required" }, { status: 400 });
    }

    let query = adminDb.collection("push_subscriptions").where("is_active", "==", true);
    if (role && role !== "all") {
      query = query.where("role", "==", role);
    }
    if (userId) {
      query = query.where("user_id", "==", userId);
    }

    const snap = await query.get().catch(() => ({ docs: [], size: 0 }));

    // Log the notification in Firestore alerts ledger
    await adminDb.collection("system_alerts").add({
      title,
      message,
      role: role || "all",
      user_id: userId || null,
      url,
      tag,
      recipients_count: snap.size,
      created_at: new Date().toISOString(),
    }).catch((e) => console.warn("Failed to write to system_alerts:", e));

    // Optional WhatsApp Priority Broadcast
    if (broadcastWhatsApp || role === "admin") {
      await sendAdminNotification(`🔔 *${title}*\n${message}\n🔗 Link: https://cctvquotation.com${url}`).catch((e) =>
        console.warn("WhatsApp alert fallback failed:", e)
      );
    }

    return NextResponse.json({
      success: true,
      recipients: snap.size,
      delivered_channels: {
        push: snap.size,
        whatsapp: broadcastWhatsApp || role === "admin",
      },
    });
  } catch (error: unknown) {
    console.error("Push Send Error:", error);
    const errMessage = error instanceof Error ? error.message : "Failed to dispatch notification";
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
