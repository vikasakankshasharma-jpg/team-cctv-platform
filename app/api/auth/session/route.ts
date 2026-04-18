import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    // Set session expiration to 5 days
    const expiresIn = 1000 * 60 * 60 * 24 * 5;

    // Create the session cookie. This will also verify the ID token in the process.
    // The session cookie will have the same claims as the ID token.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ status: "success" }, { status: 200 });

    // Set the cookie in the response header with HttpOnly and Secure flags
    response.cookies.set({
      name: "admin_session",
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: "success" }, { status: 200 });
  
  // Clear the cookie
  response.cookies.set({
    name: "admin_session",
    value: "",
    maxAge: 0,
    path: "/",
  });

  return response;
}
