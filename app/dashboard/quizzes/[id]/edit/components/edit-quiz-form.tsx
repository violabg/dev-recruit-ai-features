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
import { useQuestionManagement } from "../hooks/use-question-management";
import { AIDialogs } from "./ai-dialogs";
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

  // AI Generation logic
  const {
    aiLoading,
    generateNewQuestion,
    setRegeneratingQuestionIndex,
    handleGenerateQuestion,
    handleRegenerateQuestion,
    handleGenerateFullQuiz,
  } = useAIGeneration({
    form,
    fields,
    position,
    prepend,
    append,
    remove,
    update,
    setExpandedQuestions,
  });

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
    </div>
  );
}
