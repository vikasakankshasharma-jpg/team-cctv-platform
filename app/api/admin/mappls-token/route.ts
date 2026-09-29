import { NextResponse } from "next/server";

/**
 * Server-side Mappls OAuth 2.0 token generation.
 * Exchanges client_id + client_secret for a temporary access_token.
 * The token is valid for ~24 hours, so we cache it in-memory.
 */

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function GET() {
  const clientId = process.env.MAPPLS_CLIENT_ID?.trim();
  const clientSecret = process.env.MAPPLS_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Mappls credentials not configured. Set MAPPLS_CLIENT_ID and MAPPLS_CLIENT_SECRET." },
      { status: 500 }
    );
  }

  // Return cached token if still valid (with 5-min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return NextResponse.json({ access_token: cachedToken.token });
  }

  try {
    const res = await fetch("https://outpost.mappls.com/api/security/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Mappls token error:", res.status, text);
      return NextResponse.json(
        { error: `Mappls token request failed (${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.access_token) {
      return NextResponse.json(
        { error: "Mappls returned no access_token" },
        { status: 502 }
      );
    }

    // Cache the token (default validity is ~24h, we use expires_in if provided)
    const expiresInMs = (data.expires_in || 86400) * 1000;
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + expiresInMs,
    };

    return NextResponse.json({ access_token: data.access_token });
  } catch (err: any) {
    console.error("Mappls token fetch error:", err);
    return NextResponse.json(
      { error: "Failed to connect to Mappls OAuth service" },
      { status: 502 }
    );
  }
}
