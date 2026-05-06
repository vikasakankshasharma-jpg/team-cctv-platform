import { NextResponse } from "next/server";
import { getSettingsConfig } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
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
