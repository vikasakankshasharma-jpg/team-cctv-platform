import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-server";

// Server-side cache for high-speed response
const cache = new Map<string, any>();

export async function GET(req: Request) {
  try {
    await requireAdminApi();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const state = searchParams.get("state");
    const district = searchParams.get("district");

    let targetUrl = "";
    if (type === "states") {
      targetUrl = "https://aniket-thapa.github.io/india-pincode-api/states.json";
    } else if (type === "districts" && state) {
      targetUrl = `https://aniket-thapa.github.io/india-pincode-api/states/${encodeURIComponent(state)}.json`;
    } else if (type === "offices" && state && district) {
      targetUrl = `https://aniket-thapa.github.io/india-pincode-api/districts/${encodeURIComponent(state)}/${encodeURIComponent(district)}.json`;
    } else {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    if (cache.has(targetUrl)) {
      return NextResponse.json(cache.get(targetUrl), {
        headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
      });
    }

    const res = await fetch(targetUrl, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from postal dataset" }, { status: res.status });
    }

    const data = await res.json();
    cache.set(targetUrl, data);

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    });
  } catch (err: any) {
    console.error("Geo API proxy error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
