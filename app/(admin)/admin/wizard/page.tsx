import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { WizardStep, WizardQuestion, WizardOption } from "@/types";
import { WizardBuilderClient } from "@/components/admin/wizard/WizardBuilderClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wizard Orchestrator | Intelligence Hub",
  description: "Design and deploy complex customer decision trees and automated logic blueprints for the TEAM CCTV platform.",
};

export const dynamic = "force-dynamic";

export default async function WizardBuilderAdminPage() {
  await requireAdmin();

  // We use the exact same recursive fetch strategy as the API route for parity
  // We explicitly order by position for all levels
  const stepsSnapshot = await adminDb
    .collection("wizard_steps")
    .orderBy("position", "asc")
    .get();

  const wizardSteps: WizardStep[] = [];

  const stepPromises = stepsSnapshot.docs.map(async (stepDoc) => {
    const stepData = stepDoc.data();
    const serializedStep = {
      ...stepData,
      created_at: stepData.created_at?.toDate?.()?.toISOString() || null,
      updated_at: stepData.updated_at?.toDate?.()?.toISOString() || null,
    };
    
    // Fetch questions for this step
    const questionsSnapshot = await stepDoc.ref
      .collection("questions")
      .orderBy("position", "asc")
      .get();
    
    const questionsPromises = questionsSnapshot.docs.map(async (qDoc) => {
      const qData = qDoc.data();
      
      // Fetch options for this question
      const optionsSnapshot = await qDoc.ref
        .collection("options")
        .orderBy("position", "asc")
        .get();
      
      const options = optionsSnapshot.docs.map(optDoc => ({
        id: optDoc.id,
        ...optDoc.data()
      })) as WizardOption[];

      return { id: qDoc.id, ...qData, options };
    });

    const questions = await Promise.all(questionsPromises);
    return { id: stepDoc.id, ...serializedStep, questions };
  });

  const resolvedSteps = await Promise.all(stepPromises);
  wizardSteps.push(...resolvedSteps as unknown as WizardStep[]);

  return (
    <div className="space-y-6">
      <WizardBuilderClient initialSteps={wizardSteps} />
    </div>
  );
}
