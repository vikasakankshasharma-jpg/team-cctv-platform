import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, role, userId, userName, userAgent } = body;

    if (!role) {
      return NextResponse.json({ success: false, error: "Role is required" }, { status: 400 });
    }

    const docId = userId && userId !== "anonymous" ? `${role}_${userId}` : `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await adminDb.collection("push_subscriptions").doc(docId).set(
      {
        role,
        user_id: userId || "anonymous",
        user_name: userName || "Staff",
        subscription: subscription || null,
        user_agent: userAgent || "",
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, message: "Subscription registered successfully", id: docId });
  } catch (error: unknown) {
    console.error("Push Subscription Error:", error);
    const message = error instanceof Error ? error.message : "Failed to register subscription";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
