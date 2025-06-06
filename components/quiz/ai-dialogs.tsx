"use client";

import { AIGenerationDialog } from "@/components/ui/ai-generation-dialog";

type AIDialogsProps = {
  // New Question Generation Dialog
  aiDialogOpen: boolean;
  setAiDialogOpen: (open: boolean) => void;
  onGenerateQuestion: (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => Promise<void>;

  // Question Regeneration Dialog
  regenerateDialogOpen: boolean;
  setRegenerateDialogOpen: (open: boolean) => void;
  onRegenerateQuestion: (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => Promise<void>;

  // Full Quiz Regeneration Dialog
  fullQuizDialogOpen: boolean;
  setFullQuizDialogOpen: (open: boolean) => void;
  onGenerateFullQuiz: (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => Promise<void>;

  aiLoading: boolean;
  defaultDifficulty?: number;
};

export const AIDialogs = ({
  aiDialogOpen,
  setAiDialogOpen,
  onGenerateQuestion,
  regenerateDialogOpen,
  setRegenerateDialogOpen,
  onRegenerateQuestion,
  fullQuizDialogOpen,
  setFullQuizDialogOpen,
  onGenerateFullQuiz,
  aiLoading,
  defaultDifficulty = 3,
}: AIDialogsProps) => {
  return (
    <>
      {/* New Question Generation Dialog */}
      <AIGenerationDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        title="Genera Domanda con AI"
        description="Specifica le istruzioni per generare una nuova domanda"
        onGenerate={onGenerateQuestion}
        loading={aiLoading}
        showDifficulty={true}
        defaultDifficulty={defaultDifficulty}
      />

      {/* Question Regeneration Dialog */}
      <AIGenerationDialog
        open={regenerateDialogOpen}
        onOpenChange={setRegenerateDialogOpen}
        title="Rigenera Domanda con AI"
        description="Sostituisci la domanda esistente con una nuova generata dall'AI"
        onGenerate={onRegenerateQuestion}
        loading={aiLoading}
        showDifficulty={true}
        defaultDifficulty={3}
      />

      {/* Full Quiz Regeneration Dialog */}
      <AIGenerationDialog
        open={fullQuizDialogOpen}
        onOpenChange={setFullQuizDialogOpen}
        title="Genera Nuovo Quiz con AI"
        description="Sostituisci completamente tutte le domande del quiz con nuove generate dall'AI"
        onGenerate={onGenerateFullQuiz}
        loading={aiLoading}
        showDifficulty={true}
        defaultDifficulty={3}
      />
    </>
  );
};
