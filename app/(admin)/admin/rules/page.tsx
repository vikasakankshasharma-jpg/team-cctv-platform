import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { RecommendationRule } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Zap } from "lucide-react";
import RulesClient from "@/components/admin/RulesClient";

export const dynamic = "force-dynamic";

export default async function AdminRulesPage() {
  await requireAdmin();

  // Fetch all recommendation rules, sorted by priority
  const snapshot = await adminDb
    .collection("recommendation_rules")
    .orderBy("priority", "asc")
    .get();

  const rules = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.()?.toISOString() || null,
      updated_at: data.updated_at?.toDate?.()?.toISOString() || null,
    };
  }) as RecommendationRule[];

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Zap} 
        title="Recommendation Logic" 
        description="Define rules that map customer wizard answers to recommended camera configurations."
        badge={`${rules.length} Rules Active`}
      />

      <RulesClient initialRules={rules} />
    </div>
  );
}
