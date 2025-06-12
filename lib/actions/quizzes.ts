"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { convertToStrictQuestions, questionSchemas } from "../schemas";
import { AIGenerationError, aiQuizService } from "../services/ai-service";
import {
  errorHandler,
  getUserFriendlyErrorMessage,
  QuizErrorCode,
  QuizSystemError,
} from "../services/error-handler";
import { createClient } from "../supabase/server";
import { revalidateQuizCache } from "../utils/cache";

// Performance monitoring
class PerformanceMonitor {
  private startTime: number;

  constructor(private operationName: string) {
    this.startTime = performance.now();
  }

  end(): void {
    const duration = performance.now() - this.startTime;
    console.log(`${this.operationName} completed in ${duration.toFixed(2)}ms`);

    if (process.env.NODE_ENV === "production" && duration > 10000) {
      console.warn(
        `Slow operation detected: ${this.operationName} took ${duration.toFixed(
          2
        )}ms`
      );
    }
  }
}

type GenerateNewQuizActionParams = {
  positionId: string;
  quizTitle: string;
  questionCount: number;
  difficulty: number;
  includeMultipleChoice: boolean;
  includeOpenQuestions: boolean;
  includeCodeSnippets: boolean;
  instructions?: string;
  previousQuestions?: { question: string }[];
  specificModel?: string;
};

export async function generateNewQuizAction({
  positionId,
  quizTitle,
  questionCount,
  difficulty,
  includeMultipleChoice,
  includeOpenQuestions,
  includeCodeSnippets,
  instructions,
  previousQuestions,
  specificModel,
}: GenerateNewQuizActionParams) {
  const monitor = new PerformanceMonitor("generateNewQuizAction");

  try {
    const supabase = await createClient();

    // Validate user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new QuizSystemError(
        "User not authenticated",
        QuizErrorCode.UNAUTHORIZED
      );
    }

    // Get position details with ownership check
    const { data: position, error: positionError } = await supabase
      .from("positions")
      .select("id, title, experience_level, skills, description")
      .eq("id", positionId)
      .eq("created_by", user.id)
      .single();

    if (positionError || !position) {
      throw new QuizSystemError(
        "Position not found or access denied",
        QuizErrorCode.POSITION_NOT_FOUND,
        { positionId }
      );
    }

    // Generate quiz using AI service
    const quizData = await aiQuizService.generateQuiz({
      positionTitle: position.title,
      experienceLevel: position.experience_level,
      skills: position.skills,
      description: position.description || undefined,
      quizTitle,
      questionCount,
      difficulty,
      includeMultipleChoice,
      includeOpenQuestions,
      includeCodeSnippets,
      instructions,
      previousQuestions,
      specificModel,
    });

    monitor.end();
    return quizData;
  } catch (error) {
    monitor.end();

    // Enhanced error handling
    if (
      error instanceof QuizSystemError ||
      error instanceof AIGenerationError
    ) {
      throw error;
    }

    try {
      await errorHandler.handleError(error, {
        operation: "generateNewQuizAction",
        positionId,
      });
    } catch {
      throw new Error("AI generation failed. Please try again.");
    }
  }
}

import { GenerateQuestionParams } from "../services/ai-service";

export async function generateNewQuestionAction(
  params: GenerateQuestionParams
) {
  const monitor = new PerformanceMonitor("generateNewQuestionAction");

  try {
    // Generate question using AI service with the new parameter structure
    const question = await aiQuizService.generateQuestion(params);

    // Validate generated question
    const validatedQuestion = questionSchemas.strict.parse(question);

    monitor.end();
    return validatedQuestion;
  } catch (error) {
    monitor.end();

    // Enhanced error handling
    if (
      error instanceof QuizSystemError ||
      error instanceof AIGenerationError
    ) {
      throw error;
    }

    try {
      await errorHandler.handleError(error, {
        operation: "generateNewQuestionAction",
        questionType: params.type,
      });
    } catch {
      // If error handling fails, continue with original error
    }

    if (error instanceof z.ZodError) {
      console.error("Question validation failed:", error.errors);
      throw new QuizSystemError(
        "Generated question failed validation",
        QuizErrorCode.INVALID_INPUT,
        { zodErrors: error.errors }
      );
    } else {
      console.error("Unknown error in generateNewQuestionAction:", error);
      throw new Error("Question generation failed. Please try again.");
    }
  }
}

export async function deleteQuiz(formData: FormData) {
  const monitor = new PerformanceMonitor("deleteQuiz");

  try {
    const quizId = formData.get("quiz_id") as string;

    if (!quizId) {
      throw new QuizSystemError(
        "Quiz ID is required",
        QuizErrorCode.INVALID_INPUT
      );
    }

    const supabase = await createClient();

    // Delete quiz
    const { error: deleteError } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId);

    if (deleteError) {
      throw new QuizSystemError(
        "Failed to delete quiz",
        QuizErrorCode.DATABASE_ERROR,
        { deleteError: deleteError.message }
      );
    }

    // Revalidate cache tags after deletion
    revalidateQuizCache(quizId);

    monitor.end();
    redirect("/dashboard/quizzes");
  } catch (error) {
    monitor.end();

    // Check if this is a redirect (Next.js throws special errors for redirects)
    if (error && typeof error === "object" && "digest" in error) {
      throw error; // Re-throw redirect responses
    }

    if (error instanceof QuizSystemError) {
      throw new Error(getUserFriendlyErrorMessage(error));
    }

    try {
      await errorHandler.handleError(error, {
        operation: "deleteQuiz",
      });
    } catch {
      throw new Error("Quiz deletion failed. Please try again.");
    }
  }
}

export async function updateQuizAction(formData: FormData) {
  const monitor = new PerformanceMonitor("updateQuizAction");

  try {
    const supabase = await createClient();

    // Parse form data
    const quizId = formData.get("quiz_id") as string;
    const title = formData.get("title") as string;
    const timeLimit = formData.get("time_limit")
      ? Number(formData.get("time_limit"))
      : null;
    const questionsRaw = formData.get("questions") as string;

    // Validate inputs
    if (!quizId || !title) {
      throw new QuizSystemError(
        "Quiz ID and title are required",
        QuizErrorCode.INVALID_INPUT
      );
    }

    // Parse and validate questions
    let questions;
    try {
      questions = JSON.parse(questionsRaw);
      // Ensure question IDs are in the format 'q1', 'q2', etc.
      const formattedQuestions = questions.map(
        (q: Record<string, unknown>, index: number) => ({
          ...q,
          id: `q${index + 1}`,
        })
      );
      questions = z.array(questionSchemas.flexible).parse(formattedQuestions);
    } catch (parseError) {
      throw new QuizSystemError(
        "Invalid questions format",
        QuizErrorCode.INVALID_INPUT,
        { parseError }
      );
    }

    // Convert questions to strict format
    let strictQuestions;
    try {
      strictQuestions = convertToStrictQuestions(questions);
    } catch (conversionError) {
      throw new QuizSystemError(
        "Failed to validate question format",
        QuizErrorCode.INVALID_INPUT,
        { conversionError }
      );
    }

    // Update quiz
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({
        title,
        time_limit: timeLimit,
        questions: strictQuestions,
      })
      .eq("id", quizId);

    if (updateError) {
      throw new QuizSystemError(
        "Failed to update quiz",
        QuizErrorCode.DATABASE_ERROR,
        { updateError: updateError.message }
      );
    }

    // Revalidate cache tags to get fresh data
    revalidateQuizCache(quizId);

    monitor.end();
  } catch (error) {
    monitor.end();

    if (error instanceof QuizSystemError) {
      throw new Error(getUserFriendlyErrorMessage(error));
    }

    try {
      await errorHandler.handleError(error, {
        operation: "updateQuizAction",
      });
    } catch {
      throw new Error("Quiz update failed. Please try again.");
    }
  }
}
