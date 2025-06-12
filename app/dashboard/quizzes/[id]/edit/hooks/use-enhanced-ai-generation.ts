/**
 * Enhanced AI Generation Hook (Example)
 *
 * This is an example of how to use the new modular question prompt system
 * with type-specific parameters for better question generation.
 */

"use client";

import { GenerateQuizResponse } from "@/app/api/quiz-edit/generate-quiz/route";
import { FlexibleQuestion, QuestionType } from "@/lib/schemas";
import { GenerateQuestionParams } from "@/lib/services/ai-service";
import {
  createBackendQuestionParams,
  createCodeSnippetParams,
  createFrontendQuestionParams,
  createMultipleChoiceParams,
  createOpenQuestionParams,
} from "@/lib/utils/question-prompt-helpers";
import { generateId } from "ai";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { EditQuizFormData } from "./use-edit-quiz-form";

type Question = FlexibleQuestion;

type UseEnhancedAIGenerationProps = {
  form: UseFormReturn<EditQuizFormData>;
  fields: Question[];
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

type EnhancedGenerationOptions = {
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
};

export const useEnhancedAIGeneration = ({
  form,
  fields,
  position,
  prepend,
  append,
  remove,
  update,
  setExpandedQuestions,
}: UseEnhancedAIGenerationProps) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [generatingQuestionType, setGeneratingQuestionType] =
    useState<QuestionType | null>(null);
  const [regeneratingQuestionIndex, setRegeneratingQuestionIndex] = useState<
    number | null
  >(null);

  // Create base configuration from position and form data
  const createBaseConfig = () => ({
    quizTitle: form.getValues("title"),
    positionTitle: position.title,
    experienceLevel: position.experience_level,
    skills: position.skills,
    previousQuestions: fields.map((field) => ({
      question: field.question,
      type: field.type,
    })),
  });

  /**
   * Enhanced question generation with type-specific parameters
   */
  const handleGenerateEnhancedQuestion = async (
    type: QuestionType,
    options: EnhancedGenerationOptions
  ) => {
    setAiLoading(true);
    setGeneratingQuestionType(type);

    try {
      const baseConfig = createBaseConfig();
      let params;

      // Create type-specific parameters based on question type
      switch (type) {
        case "multiple_choice":
          params = createMultipleChoiceParams(baseConfig, fields.length + 1, {
            focusAreas: options.focusAreas,
            distractorComplexity: options.distractorComplexity || "moderate",
          });
          break;
        case "open_question":
          params = createOpenQuestionParams(baseConfig, fields.length + 1, {
            requireCodeExample: options.requireCodeExample,
            expectedResponseLength: options.expectedResponseLength || "medium",
            evaluationCriteria: options.evaluationCriteria,
          });
          break;
        case "code_snippet":
          params = createCodeSnippetParams(baseConfig, fields.length + 1, {
            language: options.language || inferLanguageFromSkills(),
            bugType: options.bugType,
            codeComplexity: options.codeComplexity || "intermediate",
            includeComments: options.includeComments ?? true,
          });
          break;
      }

      // Add common options
      if (options.difficulty) {
        params.difficulty = options.difficulty;
      }
      if (options.instructions) {
        params.instructions = options.instructions;
      }
      if (options.llmModel) {
        params.specificModel = options.llmModel;
      }

      const response = await fetch("/api/quiz-edit/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
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

      toast.success("Enhanced question generated successfully!");
      setGeneratingQuestionType(null);
    } catch (error) {
      console.error("Enhanced question generation error:", error);

      let errorMessage = "Error during enhanced question generation";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Generation Error", {
        description: errorMessage,
      });
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Generate frontend-optimized questions with smart defaults
   */
  const generateFrontendQuestion = async (
    type: QuestionType,
    options: Omit<
      EnhancedGenerationOptions,
      "language" | "bugType" | "codeComplexity"
    >
  ) => {
    const baseConfig = createBaseConfig();
    const params = createFrontendQuestionParams(
      type,
      baseConfig,
      fields.length + 1
    );

    // Override with user options
    if (options.difficulty) params.difficulty = options.difficulty;
    if (options.instructions) params.instructions = options.instructions;
    if (options.llmModel) params.specificModel = options.llmModel;

    await generateQuestionWithParams(params);
  };

  /**
   * Generate backend-optimized questions with smart defaults
   */
  const generateBackendQuestion = async (
    type: QuestionType,
    options: Omit<
      EnhancedGenerationOptions,
      "focusAreas" | "distractorComplexity"
    >
  ) => {
    const baseConfig = createBaseConfig();
    const params = createBackendQuestionParams(
      type,
      baseConfig,
      fields.length + 1
    );

    // Override with user options
    if (options.difficulty) params.difficulty = options.difficulty;
    if (options.instructions) params.instructions = options.instructions;
    if (options.llmModel) params.specificModel = options.llmModel;

    await generateQuestionWithParams(params);
  };

  /**
   * Low-level function to generate question with specific parameters
   */
  const generateQuestionWithParams = async (params: GenerateQuestionParams) => {
    setAiLoading(true);

    try {
      const response = await fetch("/api/quiz-edit/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
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
      setExpandedQuestions((prev) => new Set([...prev, newQuestionWithId.id]));

      toast.success("Question generated successfully!");
    } catch (error) {
      console.error("Question generation error:", error);

      let errorMessage = "Error during question generation";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Generation Error", {
        description: errorMessage,
      });
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Regenerate existing question (backward compatibility)
   */
  const handleRegenerateQuestion = async (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => {
    if (regeneratingQuestionIndex === null) return;

    setAiLoading(true);

    try {
      const currentQuestion = fields[regeneratingQuestionIndex];
      const baseConfig = createBaseConfig();

      // Create type-specific parameters for regeneration
      let params;
      switch (currentQuestion.type) {
        case "multiple_choice":
          params = createMultipleChoiceParams(
            baseConfig,
            regeneratingQuestionIndex + 1,
            {
              distractorComplexity: "moderate",
            }
          );
          break;
        case "open_question":
          params = createOpenQuestionParams(
            baseConfig,
            regeneratingQuestionIndex + 1,
            {
              expectedResponseLength: "medium",
            }
          );
          break;
        case "code_snippet":
          params = createCodeSnippetParams(
            baseConfig,
            regeneratingQuestionIndex + 1,
            {
              language: inferLanguageFromSkills(),
              codeComplexity: "intermediate",
              includeComments: true,
            }
          );
          break;
      }

      // Override with user options
      if (data.difficulty) params.difficulty = data.difficulty;
      if (data.instructions) params.instructions = data.instructions;
      if (data.llmModel) params.specificModel = data.llmModel;

      const response = await fetch("/api/quiz-edit/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
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

      toast.success("Question regenerated successfully!");
      setRegeneratingQuestionIndex(null);
    } catch (error) {
      console.error("Question regeneration error:", error);

      let errorMessage = "Error during question regeneration";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Regeneration Error", {
        description: errorMessage,
      });
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Enhanced regenerate existing question with type-specific parameters
   */
  const handleRegenerateEnhancedQuestion = async (
    type: QuestionType,
    options: EnhancedGenerationOptions
  ) => {
    if (regeneratingQuestionIndex === null) return;

    setAiLoading(true);

    try {
      const currentQuestion = fields[regeneratingQuestionIndex];
      const baseConfig = createBaseConfig();

      let params;

      // Create type-specific parameters based on question type
      switch (type) {
        case "multiple_choice":
          params = createMultipleChoiceParams(
            baseConfig,
            regeneratingQuestionIndex + 1,
            {
              focusAreas: options.focusAreas,
              distractorComplexity: options.distractorComplexity || "moderate",
            }
          );
          break;
        case "open_question":
          params = createOpenQuestionParams(
            baseConfig,
            regeneratingQuestionIndex + 1,
            {
              requireCodeExample: options.requireCodeExample,
              expectedResponseLength:
                options.expectedResponseLength || "medium",
              evaluationCriteria: options.evaluationCriteria,
            }
          );
          break;
        case "code_snippet":
          params = createCodeSnippetParams(
            baseConfig,
            regeneratingQuestionIndex + 1,
            {
              language: options.language || inferLanguageFromSkills(),
              bugType: options.bugType,
              codeComplexity: options.codeComplexity || "intermediate",
              includeComments: options.includeComments ?? true,
            }
          );
          break;
      }

      // Add common options
      if (options.difficulty) {
        params.difficulty = options.difficulty;
      }
      if (options.instructions) {
        params.instructions = options.instructions;
      }
      if (options.llmModel) {
        params.specificModel = options.llmModel;
      }

      const response = await fetch("/api/quiz-edit/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
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
      console.error("Enhanced question regeneration error:", error);

      let errorMessage = "Errore durante la rigenerazione della domanda";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Errore di Rigenerazione", {
        description: errorMessage,
      });
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Get the question type being regenerated
   */
  const getRegeneratingQuestionType = (): QuestionType | null => {
    if (regeneratingQuestionIndex === null) return null;
    return fields[regeneratingQuestionIndex]?.type || null;
  };

  /**
   * Generate full quiz replacement (backward compatibility)
   */
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
          questionCount: fields.length || 5,
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

      toast.success("Full quiz regenerated successfully!");
    } catch (error) {
      console.error("Full quiz regeneration error:", error);

      let errorMessage = "Error during full quiz regeneration";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Regeneration Error", {
        description: errorMessage,
      });
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Infer programming language from position skills
   */
  const inferLanguageFromSkills = (): string => {
    const skills = position.skills.map((skill) => skill.toLowerCase());

    if (
      skills.some(
        (skill) =>
          skill.includes("javascript") ||
          skill.includes("react") ||
          skill.includes("node")
      )
    ) {
      return "javascript";
    }
    if (skills.some((skill) => skill.includes("typescript"))) {
      return "typescript";
    }
    if (skills.some((skill) => skill.includes("python"))) {
      return "python";
    }
    if (skills.some((skill) => skill.includes("java"))) {
      return "java";
    }
    if (
      skills.some((skill) => skill.includes("c#") || skill.includes("csharp"))
    ) {
      return "csharp";
    }
    if (skills.some((skill) => skill.includes("php"))) {
      return "php";
    }

    return "javascript"; // Default fallback
  };

  /**
   * Legacy method for backward compatibility
   */
  const handleGenerateQuestion = async (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => {
    if (!generatingQuestionType) return;

    // Convert legacy call to enhanced version with defaults
    await handleGenerateEnhancedQuestion(generatingQuestionType, {
      instructions: data.instructions,
      llmModel: data.llmModel,
      difficulty: data.difficulty,
      // Use smart defaults based on question type
      distractorComplexity: "moderate",
      expectedResponseLength: "medium",
      codeComplexity: "intermediate",
      includeComments: true,
    });
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

    // Enhanced methods
    handleGenerateEnhancedQuestion,
    handleRegenerateEnhancedQuestion,
    getRegeneratingQuestionType,
    generateFrontendQuestion,
    generateBackendQuestion,
    generateQuestionWithParams,

    // Legacy compatibility
    handleGenerateQuestion,
    handleRegenerateQuestion,
    handleGenerateFullQuiz,
  };
};

/**
 * Usage Examples:
 *
 * ```tsx
 * const {
 *   handleGenerateEnhancedQuestion,
 *   generateFrontendQuestion,
 *   generateBackendQuestion
 * } = useEnhancedAIGeneration({ ... });
 *
 * // Generate a complex multiple choice question
 * await handleGenerateEnhancedQuestion("multiple_choice", {
 *   llmModel: "llama-3.3-70b-versatile",
 *   difficulty: 4,
 *   focusAreas: ["React Hooks", "State Management"],
 *   distractorComplexity: "complex",
 *   instructions: "Focus on advanced React patterns"
 * });
 *
 * // Generate a frontend-optimized open question
 * await generateFrontendQuestion("open_question", {
 *   llmModel: "llama-3.3-70b-versatile",
 *   difficulty: 3,
 *   requireCodeExample: true,
 *   evaluationCriteria: ["code quality", "best practices"]
 * });
 *
 * // Generate a backend code snippet question
 * await generateBackendQuestion("code_snippet", {
 *   llmModel: "llama-3.3-70b-versatile",
 *   difficulty: 4,
 *   language: "javascript",
 *   bugType: "security",
 *   includeComments: true
 * });
 * ```
 */
