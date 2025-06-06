"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  convertToStrictQuestions,
  flexibleQuestionSchema,
  generateQuizFormDataSchema,
  questionSchema,
  quizDataSchema,
} from "../schemas";
import { QuestionType } from "../schemas/base";
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

// Keep for backward compatibility but deprecate
export async function generateAndSaveQuiz(formData: FormData) {
  const monitor = new PerformanceMonitor("generateAndSaveQuiz");

  try {
    const supabase = await createClient();

    // Enhanced user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new QuizSystemError(
        "User authentication failed",
        QuizErrorCode.UNAUTHORIZED,
        { authError: authError?.message }
      );
    }

    // Parse and validate form data using consolidated schema
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = generateQuizFormDataSchema.parse(rawData);

    // Validate that at least one question type is selected
    if (
      !validatedData.include_multiple_choice &&
      !validatedData.include_open_questions &&
      !validatedData.include_code_snippets
    ) {
      throw new QuizSystemError(
        "At least one question type must be selected",
        QuizErrorCode.INVALID_INPUT
      );
    }

    // Fetch position with enhanced error handling
    const { data: position, error: positionError } = await supabase
      .from("positions")
      .select("id, title, experience_level, skills, description")
      .eq("id", validatedData.position_id)
      .eq("created_by", user.id) // Ensure user owns the position
      .single();

    if (positionError || !position) {
      throw new QuizSystemError(
        "Position not found or access denied",
        QuizErrorCode.POSITION_NOT_FOUND,
        { positionId: validatedData.position_id, error: positionError?.message }
      );
    }

    // Generate quiz using enhanced AI service
    const quizData = await aiQuizService.generateQuiz({
      positionTitle: position.title,
      experienceLevel: position.experience_level,
      skills: position.skills,
      description: position.description || undefined,
      quizTitle: validatedData.title,
      questionCount: validatedData.question_count,
      difficulty: validatedData.difficulty,
      includeMultipleChoice: validatedData.include_multiple_choice,
      includeOpenQuestions: validatedData.include_open_questions,
      includeCodeSnippets: validatedData.include_code_snippets,
      instructions: validatedData.instructions,
      specificModel: validatedData.llm_model,
    });

    // Validate generated quiz
    const validatedQuiz = quizDataSchema.parse(quizData);

    // Save quiz to database
    const { data: quiz, error: insertError } = await supabase
      .from("quizzes")
      .insert({
        title: validatedData.title,
        position_id: validatedData.position_id,
        questions: convertToStrictQuestions(validatedQuiz.questions),
        time_limit: validatedData.enable_time_limit
          ? validatedData.time_limit
          : null,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError || !quiz) {
      throw new QuizSystemError(
        "Failed to save quiz to database",
        QuizErrorCode.DATABASE_ERROR,
        { error: insertError?.message }
      );
    }

    // Revalidate cache tags for new quiz
    revalidateQuizCache(quiz.id);

    monitor.end();
    return quiz.id;
  } catch (error) {
    monitor.end();

    // Use enhanced error handler
    if (
      error instanceof QuizSystemError ||
      error instanceof AIGenerationError
    ) {
      const message =
        error instanceof QuizSystemError
          ? getUserFriendlyErrorMessage(error)
          : "AI generation failed. Please try again.";
      throw new Error(message);
    }

    // For other errors, use the error handler but still throw a user-friendly message
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await errorHandler.handleError(error, {
        operation: "generateAndSaveQuiz",
        userId: user?.id,
      });
    } catch {
      // If error handler fails, still throw the original error
      throw new Error("Si è verificato un errore interno. Riprova più tardi.");
    }
  }
}

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

type GenerateNewQuestionActionParams = {
  quizTitle: string;
  positionTitle: string;
  experienceLevel: string;
  skills: string[];
  type: QuestionType;
  previousQuestions?: { question: string; type?: string }[];
  specificModel?: string;
  instructions?: string;
  difficulty?: number;
};

export async function generateNewQuestionAction({
  quizTitle,
  positionTitle,
  experienceLevel,
  skills,
  type,
  previousQuestions,
  specificModel,
  instructions,
  difficulty,
}: GenerateNewQuestionActionParams) {
  const monitor = new PerformanceMonitor("generateNewQuestionAction");

  try {
    // Generate question using AI service
    const question = await aiQuizService.generateQuestion({
      quizTitle,
      positionTitle,
      experienceLevel,
      skills,
      type,
      difficulty,
      previousQuestions,
      specificModel,
      instructions,
    });

    // Validate generated question
    const validatedQuestion = questionSchema.parse(question);

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
        questionType: type,
      });
    } catch {
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
      questions = z.array(flexibleQuestionSchema).parse(questions);
    } catch (parseError) {
      throw new QuizSystemError(
        "Invalid questions format",
        QuizErrorCode.INVALID_INPUT,
        { parseError }
      );
    }

    // Update quiz
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({
        title,
        time_limit: timeLimit,
        questions: convertToStrictQuestions(questions),
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
