import { adminDb } from "@/lib/firebase-admin";
import { SurveyManagerClient } from "@/components/admin/SurveyManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminSurveysPage() {
  const surveysSnap = await adminDb.collection("site_surveys").orderBy("created_at", "desc").get();
  const surveys = surveysSnap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      created_at: data.created_at?.toDate()?.toISOString() || new Date().toISOString()
    };
  });

  const installersSnap = await adminDb.collection("installers").where("is_active", "==", true).get();
  const installers = installersSnap.docs.map(d => ({
    id: d.id,
    name: d.data().name,
    phone: d.data().mobile_number || d.data().phone
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Site Surveys Hub</h1>
        <p className="text-gray-500 font-medium">Manage and assign requested physical site inspections.</p>
      </div>

      <SurveyManagerClient initialSurveys={surveys} availableInstallers={installers} />
    </div>
  );
}
