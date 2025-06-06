"use client";

import { AIDialogs } from "@/components/quiz/ai-dialogs";
import { QuestionsHeader } from "@/components/quiz/questions-header";
import { QuestionsList } from "@/components/quiz/questions-list";
import { QuizSettings } from "@/components/quiz/quiz-settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useEditQuizForm } from "@/hooks/use-edit-quiz-form";
import { useQuestionManagement } from "@/hooks/use-question-management";
import { QuizForm } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import {
  getSaveButtonContent,
  getSaveButtonVariant,
} from "@/lib/utils/quiz-form-utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const router = useRouter();

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

  const handleGenerateNewQuestion = (
    type: "multiple_choice" | "open_question" | "code_snippet"
  ) => {
    generateNewQuestion(type);
    setAiDialogOpen(true);
  };

  const handleRegenerate = (index: number) => {
    setRegeneratingQuestionIndex(index);
    setRegenerateDialogOpen(true);
  };

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
              />
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saveStatus === "saving"}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={saveStatus === "saving"}
              variant={getSaveButtonVariant(saveStatus)}
              className={cn(
                saveStatus === "success" && "bg-green-600 hover:bg-green-700",
                saveStatus === "error" && "bg-red-600 hover:bg-red-700"
              )}
            >
              {getSaveButtonContent(saveStatus)}
            </Button>
          </div>
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
