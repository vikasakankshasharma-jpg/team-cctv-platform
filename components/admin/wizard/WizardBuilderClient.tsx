"use client";

import { useState, useEffect } from "react";
import { Workflow, Plus, Settings2, Trash2, GripVertical, Loader2 } from "lucide-react";
import type { WizardStep, WizardQuestion, WizardOption } from "@/types";
import { WizardStepModal } from "./WizardStepModal";
import { WizardQuestionModal } from "./WizardQuestionModal";
import { WizardOptionModal } from "./WizardOptionModal";
import { 
  upsertStep, deleteStep, 
  upsertQuestion, deleteQuestion, 
  upsertOption, deleteOption,
  updateStepOrder, updateQuestionOrder, seedWizardTemplate
} from "@/app/actions/wizard";
import { PageHeader } from "@/components/admin/PageHeader";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableStep } from "./SortableStep";

interface WizardBuilderClientProps {
  initialSteps: WizardStep[];
}

export function WizardBuilderClient({ initialSteps }: WizardBuilderClientProps) {
  const [steps, setSteps] = useState<WizardStep[]>(initialSteps);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with props if they change (e.g. after server action revalidation)
  useEffect(() => {
    setSteps(initialSteps);
  }, [initialSteps]);

  // Modal states
  const [activeStep, setActiveStep] = useState<Partial<WizardStep> | null>(null);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);

  const [activeQuestion, setActiveQuestion] = useState<{ stepId: string; question?: Partial<WizardQuestion> } | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

  const [activeOption, setActiveOption] = useState<{ stepId: string; questionId: string; option?: Partial<WizardOption> } | null>(null);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);

  // DND Configuration
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleStepDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex(s => s.id === active.id);
    const newIndex = steps.findIndex(s => s.id === over.id);
    
    const newSteps = arrayMove(steps, oldIndex, newIndex);
    setSteps(newSteps);

    setIsSaving(true);
    const updates = newSteps.map((s, idx) => ({ id: s.id!, position: idx }));
    await updateStepOrder(updates);
    setIsSaving(false);
  };

  // Step Handlers
  const handleEditStep = (step: WizardStep) => {
    setActiveStep(step);
    setIsStepModalOpen(true);
  };

  const handleSeedTemplate = async () => {
    setIsSaving(true);
    await seedWizardTemplate();
    setIsSaving(false);
  };

  const handleCreateStep = () => {
    setActiveStep({ position: steps.length });
    setIsStepModalOpen(true);
  };

  const onSaveStep = async (id: string | null, data: Partial<WizardStep>) => {
    await upsertStep(id, data);
  };

  const handleDeleteStep = async (id: string, title: string) => {
    if (!window.confirm(`Delete step "${title}" and all its questions?`)) return;
    await deleteStep(id);
  };

  // Question Handlers
  const handleEditQuestion = (stepId: string, question: WizardQuestion) => {
    setActiveQuestion({ stepId, question });
    setIsQuestionModalOpen(true);
  };

  const handleCreateQuestion = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    setActiveQuestion({ stepId, question: { position: step?.questions?.length || 0 } });
    setIsQuestionModalOpen(true);
  };

  const onSaveQuestion = async (stepId: string, questionId: string | null, data: Partial<WizardQuestion>) => {
    await upsertQuestion(stepId, questionId, data);
  };

  const handleDeleteQuestion = async (stepId: string, questionId: string, text: string) => {
    if (!window.confirm(`Delete question "${text}"?`)) return;
    await deleteQuestion(stepId, questionId);
  };

  // Option Handlers
  const handleEditOption = (stepId: string, questionId: string, option: WizardOption) => {
    setActiveOption({ stepId, questionId, option });
    setIsOptionModalOpen(true);
  };

  const handleCreateOption = (stepId: string, questionId: string) => {
    setActiveOption({ stepId, questionId });
    setIsOptionModalOpen(true);
  };

  const onSaveOption = async (stepId: string, questionId: string, optionId: string | null, data: Partial<WizardOption>) => {
    await upsertOption(stepId, questionId, optionId, data);
  };

  const handleDeleteOption = async (stepId: string, questionId: string, optionId: string, label: string) => {
    if (!window.confirm(`Delete option "${label}"?`)) return;
    await deleteOption(stepId, questionId, optionId);
  };

  return (
    <>
      <PageHeader
        icon={Workflow}
        title="Wizard Builder"
        description="Design the customer quotation wizard steps and reorder them instantly via drag-and-drop."
        action={
          <div className="flex items-center gap-4">
            {isSaving && (
              <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing Order...
              </div>
            )}
            <button
              onClick={handleCreateStep}
              className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-[20px] font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              New Step
            </button>
          </div>
        }
      />

      <div className="space-y-12 max-w-5xl pb-32">
        {steps.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-[40px] p-20 text-center backdrop-blur-sm shadow-xl dark:shadow-2xl">
            <div className="w-20 h-20 rounded-[32px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Workflow className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">No Steps Built Yet</h2>
            <p className="text-zinc-400 dark:text-zinc-500 mb-10 max-w-sm mx-auto font-bold text-sm">
              The customer wizard is currently empty. Create your first step or load the default template to begin building the flow.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button 
                onClick={handleCreateStep}
                className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-[20px] font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
              >
                Create First Step
              </button>
              <button 
                onClick={handleSeedTemplate}
                disabled={isSaving}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-10 py-4 rounded-[20px] font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Load Default Template
              </button>
            </div>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleStepDragEnd}
          >
            <SortableContext 
              items={steps.map(s => s.id!)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-10">
                {steps.map((step, idx) => (
                  <SortableStep 
                    key={step.id}
                    step={step}
                    index={idx}
                    onEdit={handleEditStep}
                    onDelete={handleDeleteStep}
                    onCreateQuestion={handleCreateQuestion}
                    onEditQuestion={handleEditQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Modals */}
      <WizardStepModal 
        isOpen={isStepModalOpen}
        onClose={() => setIsStepModalOpen(false)}
        step={activeStep}
        onSave={onSaveStep}
      />

      {activeQuestion && (
        <WizardQuestionModal 
          isOpen={isQuestionModalOpen}
          onClose={() => setIsQuestionModalOpen(false)}
          stepId={activeQuestion.stepId}
          question={activeQuestion.question}
          onSave={onSaveQuestion}
        />
      )}

      {activeOption && (
        <WizardOptionModal 
          isOpen={isOptionModalOpen}
          onClose={() => setIsOptionModalOpen(false)}
          stepId={activeOption.stepId}
          questionId={activeOption.questionId}
          option={activeOption.option}
          onSave={onSaveOption}
        />
      )}
    </>
  );
}
