import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { KycService } from "@/lib/kyc-service";

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    // Allow operations or super admin to verify
    const hasPower = session.role === "super_admin" || session.permissions?.operations?.manage_hubs === true;
    
    if (!hasPower) {
      return NextResponse.json({ error: "Forbidden. Requires Admin Power." }, { status: 403 });
    }

    const { pan_number, expected_name } = await req.json();

    if (!pan_number || typeof pan_number !== "string" || pan_number.length !== 10) {
      return NextResponse.json({ error: "Valid 10-character PAN number is required" }, { status: 400 });
    }

    const result = await KycService.verifyPAN(pan_number, expected_name);

    // Additionally check if name roughly matches if expected_name was provided
    if (result.valid && expected_name && result.registeredName) {
       const regName = result.registeredName.toLowerCase().replace(/\\s+/g, '');
       const expName = expected_name.toLowerCase().replace(/\\s+/g, '');
       
       // Extremely loose check (e.g., if one string includes the other)
       // In real life, Razorpay provides a Name Match Score (e.g., 90%). 
       const matches = regName.includes(expName) || expName.includes(regName);
       if (!matches) {
          result.message = \`Warning: Registered PAN name (\${result.registeredName}) differs from provided name.\`;
       }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
