import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { id_token } = await request.json();

    if (!id_token) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    // Set session expiration (e.g., 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // Verify the token and set the custom claim if not present
    // In a real scenario, you'd exchange a custom token for an ID token on the client.
    // For this flow, we'll verify the token provided.
    const decoded = await adminAuth.verifyIdToken(id_token);
    
    // Set custom claim for franchise_dealer if it doesn't exist
    if (decoded.role !== "franchise_dealer") {
      await adminAuth.setCustomUserClaims(decoded.uid, { role: "franchise_dealer" });
    }

    // Create session cookie
    const sessionCookie = await adminAuth.createSessionCookie(id_token, { expiresIn });

    const response = NextResponse.json({ success: true, message: "Session created" });

    // Set cookie
    (await cookies()).set("dealer_session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    console.error("[Dealer Session API]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  (await cookies()).delete("dealer_session");
  return NextResponse.json({ success: true, message: "Logged out" });
}
