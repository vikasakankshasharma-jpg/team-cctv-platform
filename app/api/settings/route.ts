import { NextResponse } from "next/server";
import { getSettingsConfig } from "@/lib/queries";
import { verifySession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifySession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getSettingsConfig();
    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }
    return NextResponse.json(settings);
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching settings:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

