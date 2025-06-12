"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { QuestionType, QuizForm } from "@/lib/schemas";
import { useCallback, useState } from "react";
import { useAIGeneration } from "../hooks/use-ai-generation";
import { useEditQuizForm } from "../hooks/use-edit-quiz-form";
import { useEnhancedAIGeneration } from "../hooks/use-enhanced-ai-generation";
import { useQuestionManagement } from "../hooks/use-question-management";
import { AIDialogs } from "./ai-dialogs";
import { EnhancedAIDialogs } from "./enhanced-ai-dialogs";
import { PresetGenerationButtons } from "./preset-generation-buttons";
import { QuestionsHeader } from "./questions-header";
import { QuestionsList } from "./questions-list";
import { QuizSettings } from "./quiz-settings";

type EditQuizFormProps = {
  quiz: QuizForm;
  position: {
    id: string;
    title: string;
    experience_level: string;
    skills: string[];
  };
};

export function EditQuizForm({ quiz, position }: EditQuizFormProps) {
  // Feature flag for enhanced AI generation
  const useEnhancedAI = true;

  // Form management
  const {
    form,
    fields,
    append,
    prepend,
    remove,
    update,
    handleSave,
    saveStatus,
    handleSaveQuestion,
    hasQuestionChanges,
    sectionSaveStatus,
  } = useEditQuizForm({ quiz, position });

  // Question management
  const {
    questionTypeFilter,
    setQuestionTypeFilter,
    expandedQuestions,
    setExpandedQuestions,
    filteredQuestions,
    toggleQuestionExpansion,
    expandAllQuestions,
    collapseAllQuestions,
  } = useQuestionManagement({ fields });

  // AI Generation states
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [fullQuizDialogOpen, setFullQuizDialogOpen] = useState(false);

  // Choose AI generation system based on feature flag
  const basicAIGeneration = useAIGeneration({
    form,
    fields,
    position,
    prepend,
    append,
    remove,
    update,
    setExpandedQuestions,
  });

  const enhancedAIGeneration = useEnhancedAIGeneration({
    form,
    fields,
    position,
    prepend,
    append,
    remove,
    update,
    setExpandedQuestions,
  });

  // Use enhanced or basic system based on feature flag
  const aiGenerationResult = useEnhancedAI
    ? enhancedAIGeneration
    : basicAIGeneration;

  const {
    aiLoading,
    generateNewQuestion,
    setRegeneratingQuestionIndex,
    generatingQuestionType,
  } = aiGenerationResult;

  // Get methods that might not exist in enhanced version
  const handleGenerateQuestion =
    "handleGenerateQuestion" in aiGenerationResult
      ? aiGenerationResult.handleGenerateQuestion
      : async () => {};

  const handleRegenerateQuestion =
    "handleRegenerateQuestion" in aiGenerationResult
      ? aiGenerationResult.handleRegenerateQuestion
      : async () => {};

  const handleGenerateFullQuiz =
    "handleGenerateFullQuiz" in aiGenerationResult
      ? aiGenerationResult.handleGenerateFullQuiz
      : async () => {};

  // Enhanced method (only available in enhanced version)
  const handleGenerateEnhancedQuestion =
    useEnhancedAI && "handleGenerateEnhancedQuestion" in enhancedAIGeneration
      ? enhancedAIGeneration.handleGenerateEnhancedQuestion
      : undefined;

  // Enhanced regeneration method (only available in enhanced version)
  const handleRegenerateEnhancedQuestion =
    useEnhancedAI && "handleRegenerateEnhancedQuestion" in enhancedAIGeneration
      ? enhancedAIGeneration.handleRegenerateEnhancedQuestion
      : undefined;

  // Get regenerating question type (only available in enhanced version)
  const getRegeneratingQuestionType =
    useEnhancedAI && "getRegeneratingQuestionType" in enhancedAIGeneration
      ? enhancedAIGeneration.getRegeneratingQuestionType
      : () => null;

  // Handle preset generation
  const handleGeneratePreset = async (
    type: QuestionType,
    presetId: string,
    options: Record<string, unknown>
  ) => {
    if (handleGenerateEnhancedQuestion) {
      // Use enhanced generation if available
      const enhancedOptions = {
        llmModel: "llama-3.3-70b-versatile",
        difficulty: 3,
        ...options,
      };
      await handleGenerateEnhancedQuestion(
        type,
        enhancedOptions as {
          llmModel: string;
          difficulty?: number;
          instructions?: string;
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
      );
    } else {
      // Fallback to basic generation
      generateNewQuestion(type);
      setAiDialogOpen(true);
    }
  };

  const handleGenerateNewQuestion = useCallback(
    (type: QuestionType) => {
      generateNewQuestion(type);
      setAiDialogOpen(true);
    },
    [generateNewQuestion]
  );

  const handleRegenerate = useCallback(
    (index: number) => {
      setRegeneratingQuestionIndex(index);
      setRegenerateDialogOpen(true);
    },
    [setRegeneratingQuestionIndex]
  );

  // Create a wrapper function for question saving with validation
  const handleQuestionSaveWithValidation = useCallback(
    (index: number) => {
      return form.handleSubmit((data) => handleSaveQuestion(index, data))();
    },
    [form, handleSaveQuestion]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Modifica Quiz</CardTitle>
          <CardDescription>
            Aggiorna le domande e le impostazioni del quiz per la posizione{" "}
            <strong>{position.title}</strong>
          </CardDescription>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
          {/* Quiz Settings */}
          <QuizSettings
            form={form}
            saveStatus={saveStatus}
            onGenerateFullQuiz={() => setFullQuizDialogOpen(true)}
            aiLoading={aiLoading}
          />

          {/* Smart Question Presets */}
          <PresetGenerationButtons
            onGeneratePreset={handleGeneratePreset}
            loading={aiLoading}
            position={position}
          />

          {/* Questions Management */}
          <QuestionsHeader
            fieldsLength={fields.length}
            questionTypeFilter={questionTypeFilter}
            setQuestionTypeFilter={setQuestionTypeFilter}
            expandAllQuestions={expandAllQuestions}
            collapseAllQuestions={collapseAllQuestions}
            onGenerateQuestion={handleGenerateNewQuestion}
          />

          {/* Questions List */}
          <Card>
            <CardContent className="space-y-4">
              <QuestionsList
                filteredQuestions={filteredQuestions}
                fields={fields}
                expandedQuestions={expandedQuestions}
                questionTypeFilter={questionTypeFilter}
                form={form}
                onToggleExpansion={toggleQuestionExpansion}
                onRegenerate={handleRegenerate}
                onRemove={remove}
                aiLoading={aiLoading}
                hasQuestionChanges={hasQuestionChanges}
                onSaveQuestion={handleQuestionSaveWithValidation}
                sectionSaveStatus={sectionSaveStatus}
              />
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* AI Generation Dialogs */}
      {useEnhancedAI && handleGenerateEnhancedQuestion ? (
        <EnhancedAIDialogs
          aiDialogOpen={aiDialogOpen}
          setAiDialogOpen={setAiDialogOpen}
          generatingQuestionType={generatingQuestionType}
          onGenerateEnhancedQuestion={handleGenerateEnhancedQuestion}
          regenerateDialogOpen={regenerateDialogOpen}
          setRegenerateDialogOpen={setRegenerateDialogOpen}
          regeneratingQuestionType={getRegeneratingQuestionType()}
          onRegenerateQuestion={handleRegenerateQuestion}
          onRegenerateEnhancedQuestion={handleRegenerateEnhancedQuestion}
          fullQuizDialogOpen={fullQuizDialogOpen}
          setFullQuizDialogOpen={setFullQuizDialogOpen}
          onGenerateFullQuiz={handleGenerateFullQuiz}
          aiLoading={aiLoading}
          defaultDifficulty={quiz.difficulty || 3}
          useEnhancedDialogs={true}
        />
      ) : (
        <AIDialogs
          aiDialogOpen={aiDialogOpen}
          setAiDialogOpen={setAiDialogOpen}
          onGenerateQuestion={handleGenerateQuestion}
          regenerateDialogOpen={regenerateDialogOpen}
          setRegenerateDialogOpen={setRegenerateDialogOpen}
          onRegenerateQuestion={handleRegenerateQuestion}
          fullQuizDialogOpen={fullQuizDialogOpen}
          setFullQuizDialogOpen={setFullQuizDialogOpen}
          onGenerateFullQuiz={handleGenerateFullQuiz}
          aiLoading={aiLoading}
          defaultDifficulty={quiz.difficulty || 3}
        />
      )}
    </div>
  );
}
