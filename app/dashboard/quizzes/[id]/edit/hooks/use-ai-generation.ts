"use client";

import { GenerateQuizResponse } from "@/app/api/quiz-edit/generate-quiz/route";
import { FlexibleQuestion, QuestionType } from "@/lib/schemas";
import { generateId } from "ai";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { EditQuizFormData } from "./use-edit-quiz-form";

type Question = FlexibleQuestion;

type UseAIGenerationProps = {
  form: UseFormReturn<EditQuizFormData>; // Form instance from react-hook-form
  fields: Question[]; // Array of form fields
  position: {
    id: string;
    title: string;
    experience_level: string;
    skills: string[];
  };
  prepend: (value: Question) => void;
  append: (value: Question) => void;
  remove: (index: number) => void;
  update: (index: number, value: Question) => void;
  setExpandedQuestions: (
    value: Set<string> | ((prev: Set<string>) => Set<string>)
  ) => void;
};

export const useAIGeneration = ({
  form,
  fields,
  position,
  prepend,
  append,
  remove,
  update,
  setExpandedQuestions,
}: UseAIGenerationProps) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [generatingQuestionType, setGeneratingQuestionType] =
    useState<QuestionType | null>(null);
  const [regeneratingQuestionIndex, setRegeneratingQuestionIndex] = useState<
    number | null
  >(null);

  const handleGenerateQuestion = async (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => {
    if (!generatingQuestionType) return;

    setAiLoading(true);

    try {
      const response = await fetch("/api/quiz-edit/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizTitle: form.getValues("title"),
          positionTitle: position.title,
          experienceLevel: position.experience_level,
          skills: position.skills,
          type: generatingQuestionType,
          difficulty: data.difficulty,
          previousQuestions: fields.map((field) => ({
            question: field.question,
            type: field.type,
          })),
          specificModel: data.llmModel,
          instructions: data.instructions || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const newQuestion = await response.json();
      const newQuestionWithId = {
        ...newQuestion,
        id: generateId(),
      };

      prepend(newQuestionWithId);

      // Expand the new question by default
      setExpandedQuestions((prev) => new Set([...prev, newQuestionWithId.id]));

      toast.success("Domanda generata con successo!");

      setGeneratingQuestionType(null);
    } catch (error) {
      console.error("Errore generazione domanda:", error);

      let errorMessage = "Errore durante la generazione della domanda";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Errore generazione", {
        description: errorMessage,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleRegenerateQuestion = async (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => {
    if (regeneratingQuestionIndex === null) return;

    setAiLoading(true);

    try {
      const currentQuestion = fields[regeneratingQuestionIndex];

      const response = await fetch("/api/quiz-edit/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizTitle: form.getValues("title"),
          positionTitle: position.title,
          experienceLevel: position.experience_level,
          skills: position.skills,
          type: currentQuestion.type,
          difficulty: data.difficulty,
          previousQuestions: fields
            .filter((_, index) => index !== regeneratingQuestionIndex)
            .map((field) => ({
              question: field.question,
              type: field.type,
            })),
          specificModel: data.llmModel,
          instructions: data.instructions || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const newQuestion = await response.json();

      // Update the question at the specific index
      update(regeneratingQuestionIndex, {
        ...newQuestion,
        id: currentQuestion.id, // Keep the same ID
      });

      toast.success("Domanda rigenerata con successo!");

      setRegeneratingQuestionIndex(null);
    } catch (error) {
      console.error("Errore rigenerazione domanda:", error);

      let errorMessage = "Errore durante la rigenerazione della domanda";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Errore rigenerazione", {
        description: errorMessage,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateFullQuiz = async (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => {
    setAiLoading(true);

    try {
      const response = await fetch("/api/quiz-edit/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          positionId: position.id,
          quizTitle: form.getValues("title"),
          questionCount: fields.length || 5, // Use current question count or default to 5
          difficulty: data.difficulty || 3,
          includeMultipleChoice: true,
          includeOpenQuestions: true,
          includeCodeSnippets: true,
          specificModel: data.llmModel,
          instructions: data.instructions || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const newQuiz = (await response.json()) as GenerateQuizResponse;

      // Replace all questions with new ones
      const newQuestions = newQuiz.questions.map((q) => ({
        ...q,
        id: generateId(),
      }));

      // Clear current questions and add new ones
      fields.forEach(() => remove(0));
      newQuestions.forEach((question) => append(question));

      // Set all new questions as expanded
      const newQuestionIds = new Set<string>(
        newQuestions.map((q) => q.id as string)
      );
      setExpandedQuestions(newQuestionIds);

      toast.success("Quiz rigenerato completamente con successo!");
    } catch (error) {
      console.error("Errore rigenerazione quiz:", error);

      let errorMessage = "Errore durante la rigenerazione del quiz";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Errore rigenerazione quiz", {
        description: errorMessage,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const generateNewQuestion = (type: QuestionType) => {
    setGeneratingQuestionType(type);
  };

  const setRegeneratingIndex = (index: number | null) => {
    setRegeneratingQuestionIndex(index);
  };

  return {
    aiLoading,
    generatingQuestionType,
    setGeneratingQuestionType,
    regeneratingQuestionIndex,
    setRegeneratingQuestionIndex: setRegeneratingIndex,
    generateNewQuestion,
    handleGenerateQuestion,
    handleRegenerateQuestion,
    handleGenerateFullQuiz,
  };
};
