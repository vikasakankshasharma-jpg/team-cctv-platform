import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { addLeadActivity } from "@/app/actions/leads";

export async function PATCH(req: Request, { params }: { params: any }) {
  try {
    const session = await requireAdmin();
    if (session.role !== "super_admin" && !session.permissions?.operations?.manage_hubs) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, assigned_installer_id, is_third_party, third_party_name, third_party_phone } = await req.json();
    const { surveyId } = params;

    const surveyRef = adminDb.collection("site_surveys").doc(surveyId);
    const surveySnap = await surveyRef.get();
    
    if (!surveySnap.exists) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    const survey = surveySnap.data()!;
    const updateData: any = { status, updated_at: new Date() };

    if (assigned_installer_id !== undefined) {
      updateData.assigned_installer_id = assigned_installer_id;
    }

    await surveyRef.update(updateData);

    // Log the assignment to the CRM
    if (status === "assigned" && survey.lead_id) {
       await addLeadActivity(survey.lead_id, session.user!.uid, `Assigned engineer to conduct Site Survey on ${survey.date}.`);
    } else if (status === "completed" && survey.lead_id) {
       await addLeadActivity(survey.lead_id, session.user!.uid, `Site Survey marked as Completed.`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Update Survey Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
