import { NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase-client"; // Actually we should use firebase-admin if available, but for this client API route we can use admin if it exists or client if we are using the client SDK on the server, wait.

// Let's use firebase-admin since this is a Next.js API route. Let's see if admin is configured.
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.name || !body.mobile_number || !body.primary_pincode || body.years_experience === undefined) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Assuming adminDb exists. Let's write to it. If adminDb is not there, we'll see a compilation error.
    const docRef = await adminDb.collection("installer_applications").add({
      name: body.name,
      mobile_number: body.mobile_number,
      company_name: body.company_name || null,
      primary_pincode: body.primary_pincode,
      years_experience: Number(body.years_experience),
      gstin: body.gstin || null,
      status: "pending",
      created_at: new Date(),
    });

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error: any) {
    console.error("Installer apply error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit application." }, { status: 500 });
  }
}
