import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getDefaultFallbackWizard } from "@/lib/queries";

export async function GET() {
  try {
    const steps = getDefaultFallbackWizard();
    let count = 0;

    for (const step of steps) {
      // Create or update the step document
      const stepRef = adminDb.collection("wizard_steps").doc(step.id!);
      await stepRef.set({
        title: step.title,
        description: step.description,
        position: step.position,
        is_active: step.is_active,
        created_at: adminDb.collection("wizard_steps").doc().path ? new Date() : new Date(), // using generic timestamp
      }, { merge: true });

      // Create or update questions
      if (step.questions) {
        for (const q of step.questions) {
          const qRef = stepRef.collection("questions").doc(q.id!);
          await qRef.set({
            question_text: q.question_text,
            input_type: q.input_type,
            is_required: q.is_required,
            position: q.position,
          }, { merge: true });

          // Create or update options
          if (q.options) {
            for (const opt of q.options) {
              const optRef = qRef.collection("options").doc(opt.id!);
              await optRef.set({
                label: opt.label,
                value: opt.value,
                position: opt.position,
                ...(opt.icon && { icon: opt.icon }),
                ...(opt.tier_hint && { tier_hint: opt.tier_hint }),
              }, { merge: true });
            }
          }
        }
      }
      count++;
    }

    return NextResponse.json({ success: true, seeded_steps: count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
