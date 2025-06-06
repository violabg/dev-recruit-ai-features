import { z } from "zod";
import {
  difficultySchema,
  instructionsSchema,
  questionCountSchema,
  timeLimitSchema,
  titleSchema,
  uuidSchema,
} from "./base";
import { flexibleQuestionSchema } from "./question";

// ====================
// QUIZ SCHEMAS
// ====================

export const quizGenerationConfigSchema = z.object({
  quizTitle: titleSchema,
  difficulty: difficultySchema,
  instructions: instructionsSchema,
  includeMultipleChoice: z.boolean(),
  includeOpenQuestions: z.boolean(),
  includeCodeSnippets: z.boolean(),
});

export const quizFormSchema = z.object({
  title: z.string().min(2, "Il titolo deve contenere almeno 2 caratteri."),
  instructions: instructionsSchema,
  questionCount: questionCountSchema,
  includeMultipleChoice: z.boolean(),
  includeOpenQuestions: z.boolean(),
  includeCodeSnippets: z.boolean(),
  difficulty: difficultySchema,
  timeLimit: timeLimitSchema,
  enableTimeLimit: z.boolean(),
  llmModel: z.string(),
});

export const quizSchema = z.object({
  id: uuidSchema,
  title: titleSchema,
  position_id: uuidSchema,
  questions: z.array(flexibleQuestionSchema),
  time_limit: z.number().nullable(),
  difficulty: difficultySchema.optional(),
  created_at: z.string(),
  created_by: uuidSchema,
});

export const quizDataSchema = z.object({
  questions: z.array(flexibleQuestionSchema),
});

// ====================
// TYPE EXPORTS
// ====================

export type QuizFormData = z.infer<typeof quizFormSchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type QuizForm = Quiz; // Alias for backward compatibility
export type QuizData = z.infer<typeof quizDataSchema>;
