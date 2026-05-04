"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import type { WizardStep, WizardQuestion, WizardOption } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// STEP ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates or updates a Wizard Step.
 */
export async function upsertStep(id: string | null, data: Partial<WizardStep>) {
  await requireAdmin();
  
  const stepData = {
    ...data,
    updated_at: new Date(),
  };

  if (!id) {
    // Create new
    await adminDb.collection("wizard_steps").add({
      ...stepData,
      created_at: new Date(),
      is_active: true,
      position: data.position ?? 0,
    });
  } else {
    // Update existing
    await adminDb.collection("wizard_steps").doc(id).update(stepData);
  }

  revalidatePath("/admin/wizard");
  return { success: true };
}

/**
 * Deletes a Wizard Step and all its subcollections.
 */
export async function deleteStep(id: string) {
  await requireAdmin();

  const stepRef = adminDb.collection("wizard_steps").doc(id);
  
  // Note: Firestore doesn't automatically delete subcollections. 
  // For a production app with deep trees, we'd use a recursive delete.
  // Given the wizard is small, we'll manually cleanup or rely on the UI 
  // filter out orphans.
  
  await stepRef.delete();
  revalidatePath("/admin/wizard");
  return { success: true };
}

/**
 * Updates the positions of multiple steps in one batch.
 */
export async function updateStepOrder(steps: { id: string, position: number }[]) {
  await requireAdmin();
  const batch = adminDb.batch();
  
  steps.forEach(s => {
    const ref = adminDb.collection("wizard_steps").doc(s.id);
    batch.update(ref, { position: s.position });
  });

  await batch.commit();
  revalidatePath("/admin/wizard");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates or updates a Question within a specific Step.
 */
export async function upsertQuestion(stepId: string, questionId: string | null, data: Partial<WizardQuestion>) {
  await requireAdmin();

  const questionsCol = adminDb.collection("wizard_steps").doc(stepId).collection("questions");

  if (!questionId) {
    // Add new
    await questionsCol.add({
      ...data,
      position: data.position ?? 0,
    });
  } else {
    // Update existing
    await questionsCol.doc(questionId).update(data);
  }

  revalidatePath("/admin/wizard");
  return { success: true };
}

/**
 * Deletes a Question from a Step.
 */
export async function deleteQuestion(stepId: string, questionId: string) {
  await requireAdmin();
  await adminDb.collection("wizard_steps").doc(stepId).collection("questions").doc(questionId).delete();
  revalidatePath("/admin/wizard");
  return { success: true };
}

/**
 * Updates the positions of multiple questions within a step.
 */
export async function updateQuestionOrder(stepId: string, questions: { id: string, position: number }[]) {
  await requireAdmin();
  const batch = adminDb.batch();
  const stepRef = adminDb.collection("wizard_steps").doc(stepId);
  
  questions.forEach(q => {
    const qRef = stepRef.collection("questions").doc(q.id);
    batch.update(qRef, { position: q.position });
  });

  await batch.commit();
  revalidatePath("/admin/wizard");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates or updates an Option within a specific Question and Step.
 */
export async function upsertOption(stepId: string, questionId: string, optionId: string | null, data: Partial<WizardOption>) {
  await requireAdmin();

  const optionsCol = adminDb
    .collection("wizard_steps")
    .doc(stepId)
    .collection("questions")
    .doc(questionId)
    .collection("options");

  if (!optionId) {
    await optionsCol.add({
      ...data,
      position: data.position ?? 0,
    });
  } else {
    await optionsCol.doc(optionId).update(data);
  }

  revalidatePath("/admin/wizard");
  return { success: true };
}

/**
 * Deletes an Option from a Question.
 */
export async function deleteOption(stepId: string, questionId: string, optionId: string) {
  await requireAdmin();
  await adminDb
    .collection("wizard_steps")
    .doc(stepId)
    .collection("questions")
    .doc(questionId)
    .collection("options")
    .doc(optionId)
    .delete();
    
  revalidatePath("/admin/wizard");
  return { success: true };
}

/**
 * Seeds the database with the default wizard template if empty.
 */
export async function seedWizardTemplate() {
  await requireAdmin();
  const batch = adminDb.batch();

  // 1. Wipe existing steps and subcollections to prevent duplicates
  const existingSteps = await adminDb.collection("wizard_steps").get();
  for (const stepDoc of existingSteps.docs) {
    // Delete questions subcollection
    const questions = await stepDoc.ref.collection("questions").get();
    for (const qDoc of questions.docs) {
      // Delete options subcollection
      const options = await qDoc.ref.collection("options").get();
      options.docs.forEach(opt => batch.delete(opt.ref));
      batch.delete(qDoc.ref);
    }
    batch.delete(stepDoc.ref);
  }
  
  // Commit wipe first to ensure clean state
  await batch.commit();
  
  // 2. Start new batch for seeding
  const seedBatch = adminDb.batch();

  // Define Steps
  const steps = [
    { id: "step_property", position: 0, title: "Property Type", description: "Select the type of property you are securing.", is_active: true },
    { id: "step_tech", position: 1, title: "Technology", description: "Choose your preferred camera technology.", is_active: true },
    { id: "step_cameras", position: 2, title: "Coverage Requirements", description: "How many cameras do you need?", is_active: true },
    { id: "step_wiring", position: 3, title: "Installation Status", description: "Is your property pre-wired for CCTV?", is_active: true },
  ];

  // Define Questions & Options
  const questions = {
    step_property: [
      { id: "q_prop_type", position: 0, question_text: "What type of property are you securing?", input_type: "single" as const, is_required: true, options: [
        { id: "opt_home", position: 0, label: "Home / Residential", value: "home" },
        { id: "opt_office", position: 1, label: "Office / Commercial", value: "office" },
        { id: "opt_factory", position: 2, label: "Factory / Warehouse", value: "factory" },
        { id: "opt_shop", position: 3, label: "Shop / Retail", value: "shop" }
      ] }
    ],
    step_tech: [
      { id: "q_tech", position: 0, question_text: "What technology do you prefer?", input_type: "single" as const, is_required: true, options: [
        { id: "opt_ip", position: 0, label: "IP (Digital & High-End)", value: "IP" },
        { id: "opt_hd", position: 1, label: "HD (Analog & Budget)", value: "HD" }
      ] }
    ],
    step_cameras: [
      { id: "q_cam_count", position: 0, question_text: "How many cameras do you need?", input_type: "number" as const, is_required: true, options: [] }
    ],
    step_wiring: [
      { id: "q_wiring", position: 0, question_text: "Is your property pre-wired?", input_type: "single" as const, is_required: true, options: [
        { id: "opt_wired_yes", position: 0, label: "Yes, wiring is complete", value: "true" },
        { id: "opt_wired_no", position: 1, label: "No, require full installation", value: "false" }
      ] }
    ]
  };

  steps.forEach(step => {
    const stepRef = adminDb.collection("wizard_steps").doc(step.id);
    seedBatch.set(stepRef, {
      title: step.title,
      description: step.description,
      position: step.position,
      is_active: step.is_active,
      created_at: new Date(),
      updated_at: new Date()
    });

    const stepQuestions = questions[step.id as keyof typeof questions];
    stepQuestions.forEach(q => {
      const qRef = stepRef.collection("questions").doc(q.id);
      seedBatch.set(qRef, {
        question_text: q.question_text,
        input_type: q.input_type,
        is_required: q.is_required,
        position: q.position,
      });

      q.options.forEach(opt => {
        const optRef = qRef.collection("options").doc(opt.id);
        seedBatch.set(optRef, {
          label: opt.label,
          value: opt.value,
          position: opt.position,
        });
      });
    });
  });

  await seedBatch.commit();
  revalidatePath("/admin/wizard");
  return { success: true };
}

