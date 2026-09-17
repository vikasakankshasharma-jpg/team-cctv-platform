import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    // Allow mock token in local development for E2E testing
    if (idToken === "mock-jwt-token" && process.env.NODE_ENV !== "production") {
      const response = NextResponse.json({ status: "success" }, { status: 200 });
      response.cookies.set({
        name: "admin_session",
        value: "mock_session_cookie",
        maxAge: 1000 * 60 * 60 * 24 * 5 / 1000,
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "lax",
      });
      return response;
    }

    // Set session expiration to 5 days
    const expiresIn = 1000 * 60 * 60 * 24 * 5;

    // Create the session cookie. This will also verify the ID token in the process.
    // The session cookie will have the same claims as the ID token.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const decoded = await adminAuth.verifyIdToken(idToken);
    const role = decoded.role;

    const response = NextResponse.json({ status: "success" }, { status: 200 });

    const cookieOptions = {
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax" as const,
    };

    // Set role-specific cookies
    if (role === "partner") {
      response.cookies.set({ name: "partner_session", ...cookieOptions });
    } else if (role === "installer") {
      response.cookies.set({ name: "installer_session", ...cookieOptions });
    } else {
      response.cookies.set({ name: "admin_session", ...cookieOptions });
    }

    return response;
  } catch (error: unknown) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: "success" }, { status: 200 });
  
  // Clear all role session cookies
  response.cookies.set({ name: "admin_session", value: "", maxAge: 0, path: "/" });
  response.cookies.set({ name: "partner_session", value: "", maxAge: 0, path: "/" });
  response.cookies.set({ name: "installer_session", value: "", maxAge: 0, path: "/" });

  return response;
}
