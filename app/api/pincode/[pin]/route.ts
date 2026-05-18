import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/pincode/[pin]
 *
 * Proxies the free Indian Postal API to avoid CORS and add server-side caching.
 * Returns the district and state for a valid 6-digit Indian pincode.
 *
 * Response shape:
 *   200 { district: string, state: string, city: string }
 *   400 { error: "Invalid pincode format" }
 *   404 { error: "Pincode not found" }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;

  // Validate — must be exactly 6 digits
  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "Invalid pincode format" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      next: {
        // Cache for 7 days — pincode data rarely changes
        revalidate: 604800,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Postal API unavailable" }, { status: 502 });
    }

    const data = await res.json();

    // API returns an array; first element has Status and PostOffice array
    const block = data?.[0];

    if (!block || block.Status !== "Success" || !block.PostOffice?.length) {
      return NextResponse.json({ error: "Pincode not found" }, { status: 404 });
    }

    const office = block.PostOffice[0];
    const district: string = office.District ?? "";
    const state: string = office.State ?? "";
    // Use Division or District as "city" — Division is often the nearest city
    const city: string = office.Division || office.District || "";

    const served = district.toLowerCase().includes("jaipur") || pin.startsWith("302");

    return NextResponse.json(
      { district, state, city, served },
      {
        status: 200,
        headers: {
          // Browser cache: 1 day
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (err) {
    console.error("[pincode-api] fetch error:", err);
    return NextResponse.json({ error: "Failed to lookup pincode" }, { status: 500 });
  }
}
