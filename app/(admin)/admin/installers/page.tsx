import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { Installer, InstallerApplication } from "@/types";
import { InstallersClient } from "@/components/admin/InstallersClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verified Installers | Intelligence Hub",
};

export const dynamic = "force-dynamic";

export default async function InstallersAdminPage() {
  await requireAdmin();

  let installers: Installer[] = [];
  try {
    const snapshot = await adminDb.collection("installers").orderBy("created_at", "desc").get();
    installers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || null,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || null,
      };
    }) as Installer[];
  } catch (err) {
    const snapshot = await adminDb.collection("installers").get();
    installers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];
  }

  let applications: InstallerApplication[] = [];
  try {
    const appSnapshot = await adminDb.collection("installer_applications").orderBy("created_at", "desc").get();
    applications = appSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || null,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || null,
      };
    }) as InstallerApplication[];
  } catch (err) {
    try {
      const appSnapshot = await adminDb.collection("installer_applications").get();
      applications = appSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];
    } catch {
      applications = [];
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <InstallersClient initialInstallers={installers} initialApplications={applications} />
    </div>
  );
}
