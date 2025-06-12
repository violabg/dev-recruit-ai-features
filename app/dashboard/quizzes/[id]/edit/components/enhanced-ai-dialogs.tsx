"use client";

import { AIGenerationDialog } from "@/components/ui/ai-generation-dialog";
import { QuestionType } from "@/lib/schemas";
import { EnhancedAIGenerationDialog } from "./enhanced-ai-generation-dialog";

type EnhancedAIDialogsProps = {
  // New Question Generation Dialog
  aiDialogOpen: boolean;
  setAiDialogOpen: (open: boolean) => void;
  generatingQuestionType: QuestionType | null;
  onGenerateEnhancedQuestion: (
    type: QuestionType,
    data: {
      instructions?: string;
      llmModel: string;
      difficulty?: number;
      // Type-specific options
      focusAreas?: string[];
      distractorComplexity?: "simple" | "moderate" | "complex";
      requireCodeExample?: boolean;
      expectedResponseLength?: "short" | "medium" | "long";
      evaluationCriteria?: string[];
      language?: string;
      bugType?: "syntax" | "logic" | "performance" | "security";
      codeComplexity?: "basic" | "intermediate" | "advanced";
      includeComments?: boolean;
    }
  ) => Promise<void>;

  // Enhanced Question Regeneration Dialog
  regenerateDialogOpen: boolean;
  setRegenerateDialogOpen: (open: boolean) => void;
  regeneratingQuestionType: QuestionType | null; // Add this new prop
  onRegenerateEnhancedQuestion?: (
    type: QuestionType,
    data: {
      instructions?: string;
      llmModel: string;
      difficulty?: number;
      // Type-specific options
      focusAreas?: string[];
      distractorComplexity?: "simple" | "moderate" | "complex";
      requireCodeExample?: boolean;
      expectedResponseLength?: "short" | "medium" | "long";
      evaluationCriteria?: string[];
      language?: string;
      bugType?: "syntax" | "logic" | "performance" | "security";
      codeComplexity?: "basic" | "intermediate" | "advanced";
      includeComments?: boolean;
    }
  ) => Promise<void>;
  onRegenerateQuestion: (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => Promise<void>;

  // Full Quiz Regeneration Dialog (legacy)
  fullQuizDialogOpen: boolean;
  setFullQuizDialogOpen: (open: boolean) => void;
  onGenerateFullQuiz: (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => Promise<void>;

  aiLoading: boolean;
  defaultDifficulty?: number;
  useEnhancedDialogs?: boolean; // Flag to enable enhanced dialogs
};

export const EnhancedAIDialogs = ({
  aiDialogOpen,
  setAiDialogOpen,
  generatingQuestionType,
  onGenerateEnhancedQuestion,
  regenerateDialogOpen,
  setRegenerateDialogOpen,
  regeneratingQuestionType,
  onRegenerateEnhancedQuestion,
  onRegenerateQuestion,
  fullQuizDialogOpen,
  setFullQuizDialogOpen,
  onGenerateFullQuiz,
  aiLoading,
  defaultDifficulty = 3,
  useEnhancedDialogs = true,
}: EnhancedAIDialogsProps) => {
  return (
    <>
      {/* Enhanced New Question Generation Dialog */}
      {useEnhancedDialogs ? (
        <EnhancedAIGenerationDialog
          open={aiDialogOpen}
          onOpenChange={setAiDialogOpen}
          title="Generate Enhanced Question with AI"
          description="Create a specialized question with type-specific options for better targeting"
          questionType={generatingQuestionType}
          onGenerate={onGenerateEnhancedQuestion}
          loading={aiLoading}
          defaultDifficulty={defaultDifficulty}
        />
      ) : (
        <AIGenerationDialog
          open={aiDialogOpen}
          onOpenChange={setAiDialogOpen}
          title="Genera Domanda con AI"
          description="Specifica le istruzioni per generare una nuova domanda"
          onGenerate={async (data) => {
            if (generatingQuestionType) {
              await onGenerateEnhancedQuestion(generatingQuestionType, data);
            }
          }}
          loading={aiLoading}
          showDifficulty={true}
          defaultDifficulty={defaultDifficulty}
        />
      )}

      {/* Enhanced Question Regeneration Dialog */}
      {useEnhancedDialogs && onRegenerateEnhancedQuestion ? (
        <EnhancedAIGenerationDialog
          open={regenerateDialogOpen}
          onOpenChange={setRegenerateDialogOpen}
          title="Rigenera Domanda con AI Avanzata"
          description="Sostituisci la domanda esistente con una nuova utilizzando opzioni avanzate"
          questionType={regeneratingQuestionType}
          onGenerate={onRegenerateEnhancedQuestion}
          loading={aiLoading}
          defaultDifficulty={defaultDifficulty}
        />
      ) : (
        <AIGenerationDialog
          open={regenerateDialogOpen}
          onOpenChange={setRegenerateDialogOpen}
          title="Rigenera Domanda con AI"
          description="Sostituisci la domanda esistente con una nuova generata dall'AI"
          onGenerate={onRegenerateQuestion}
          loading={aiLoading}
          showDifficulty={true}
          defaultDifficulty={defaultDifficulty}
        />
      )}

      {/* Full Quiz Regeneration Dialog - Keep legacy for now */}
      <AIGenerationDialog
        open={fullQuizDialogOpen}
        onOpenChange={setFullQuizDialogOpen}
        title="Genera Nuovo Quiz con AI"
        description="Sostituisci completamente tutte le domande del quiz con nuove generate dall'AI"
        onGenerate={onGenerateFullQuiz}
        loading={aiLoading}
        showDifficulty={true}
        defaultDifficulty={defaultDifficulty}
      />
    </>
  );
};
