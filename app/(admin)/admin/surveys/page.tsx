import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { SurveyManagerClient } from "@/components/admin/SurveyManagerClient";
import { CrmSubNav } from "@/components/admin/navigation/AdminSubNav";

export const dynamic = "force-dynamic";

export default async function AdminSurveysPage() {
  await requireAdmin();

  let surveys: any[] = [];
  let installers: any[] = [];

  try {
    const surveysSnap = await adminDb.collection("site_surveys").orderBy("created_at", "desc").limit(50).get();
    surveys = surveysSnap.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });

    const installersSnap = await adminDb.collection("installers").where("is_active", "==", true).limit(50).get();
    installers = installersSnap.docs.map(d => ({
      id: d.id,
      name: d.data().name || d.data().full_name || "Technician",
      phone: d.data().mobile_number || d.data().phone || ""
    }));
  } catch (err) {
    console.warn("⚠️ Failed to load surveys from Firestore:", err);
  }

  return (
    <div className="space-y-6">
      <CrmSubNav />
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Site Surveys Hub</h1>
        <p className="text-zinc-500 font-medium text-xs mt-0.5">Manage and assign requested physical site inspections.</p>
      </div>

      <SurveyManagerClient initialSurveys={surveys} availableInstallers={installers} />
    </div>
  );
}
