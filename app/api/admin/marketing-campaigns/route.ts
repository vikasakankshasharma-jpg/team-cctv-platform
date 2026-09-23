import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth-server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated || !["super_admin", "admin"].includes(session.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const { title, medium, keyword } = payload;

    if (!title || !medium || !keyword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicate keyword
    const existing = await adminDb
      .collection(COLLECTIONS.MARKETING_CAMPAIGNS)
      .where("keyword", "==", keyword.toUpperCase())
      .get();
      
    if (!existing.empty) {
      return NextResponse.json({ error: "Campaign Keyword is already in use" }, { status: 400 });
    }

    const wa_link = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919024097475"}?text=Hi ${keyword.toUpperCase()}`;

    const newDoc = adminDb.collection(COLLECTIONS.MARKETING_CAMPAIGNS).doc();
    await newDoc.set({
      title,
      medium,
      keyword: keyword.toUpperCase(),
      wa_link,
      is_active: true,
      total_leads: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    return NextResponse.json({ success: true, id: newDoc.id });
  } catch (error: any) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated || !["super_admin", "admin"].includes(session.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const { id, is_active } = payload;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await adminDb.collection(COLLECTIONS.MARKETING_CAMPAIGNS).doc(id).update({
      is_active,
      updated_at: serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update campaign:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated || !["super_admin", "admin"].includes(session.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await adminDb.collection(COLLECTIONS.MARKETING_CAMPAIGNS).doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete campaign:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
