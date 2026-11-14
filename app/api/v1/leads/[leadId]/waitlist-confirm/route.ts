import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { getApiMessage, resolveRequestLocale } from "@/lib/i18n/api-messages";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const locale = resolveRequestLocale(req);
  try {
    const { leadId } = await params;
    let requestType = "expansion_waitlist";
    try {
      const body = await req.json();
      if (body?.requestType === "outstation") {
        requestType = "outstation_visit";
      }
    } catch {
      // Body may be empty
    }

    await adminDb.collection("leads").doc(leadId).update({
      waitlist_confirmed: true,
      waitlist_confirmed_at: serverTimestamp(),
      waitlist_request_type: requestType,
    });

    return NextResponse.json({ success: true, requestType });
  } catch (err) {
    console.error("Waitlist confirm error:", err);
    return NextResponse.json({ error: getApiMessage(locale, "waitlist_confirm_failed") }, { status: 500 });
  }
}
