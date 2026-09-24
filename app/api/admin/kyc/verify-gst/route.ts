import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { KycService } from "@/lib/kyc-service";

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const hasPower = session.role === "super_admin" || session.permissions?.operations?.manage_hubs === true;
    
    if (!hasPower) {
      return NextResponse.json({ error: "Forbidden. Requires Admin Power." }, { status: 403 });
    }

    const { gst_number } = await req.json();

    if (!gst_number || typeof gst_number !== "string" || gst_number.length !== 15) {
      return NextResponse.json({ error: "Valid 15-character GST number is required" }, { status: 400 });
    }

    const result = await KycService.verifyGST(gst_number);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
