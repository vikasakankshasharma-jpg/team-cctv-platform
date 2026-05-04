import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" });

  const doc = await adminDb.collection(COLLECTIONS.PARTNER_OTP_VERIFICATIONS).doc(email).get();
  if (!doc.exists) return NextResponse.json({ error: "Not found" });

  return NextResponse.json(doc.data());
}
