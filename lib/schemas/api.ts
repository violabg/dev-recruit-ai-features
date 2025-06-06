import { z } from "zod";
import {
  difficultySchema,
  instructionsSchema,
  questionCountSchema,
  questionTypeSchema,
  titleSchema,
  uuidSchema,
} from "./base";
import { flexibleQuestionSchema } from "./question";

// ====================
// API REQUEST SCHEMAS
// ====================

export const generateQuizRequestSchema = z.object({
  positionId: uuidSchema,
  quizTitle: titleSchema,
  questionCount: questionCountSchema,
  difficulty: difficultySchema,
  previousQuestions: z
    .array(
      z.object({
        question: z.string().min(1, "Question text required"),
        type: z.string().optional(),
      })
    )
    .optional(),
  includeMultipleChoice: z.boolean(),
  includeOpenQuestions: z.boolean(),
  includeCodeSnippets: z.boolean(),
  specificModel: z.string().optional(),
  instructions: instructionsSchema,
});

export const generateQuestionRequestSchema = z.object({
  quizTitle: titleSchema,
  positionTitle: titleSchema,
  experienceLevel: z.string().min(1, "Experience level is required"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  type: questionTypeSchema,
  difficulty: difficultySchema.optional(),
  previousQuestions: z
    .array(
      z.object({
        question: z.string().min(1, "Question text required"),
        type: z.string().optional(),
      })
    )
    .optional(),
  specificModel: z.string().optional(),
  instructions: instructionsSchema,
});

export const saveQuizRequestSchema = z.object({
  title: titleSchema,
  position_id: uuidSchema,
  questions: z
    .array(flexibleQuestionSchema)
    .min(1, "At least one question required"),
  time_limit: z.number().nullable(),
});

// Server action form data schema (for FormData handling)
export const generateQuizFormDataSchema = z.object({
  position_id: uuidSchema,
  title: titleSchema,
  question_count: z.coerce.number().int().min(1).max(50),
  difficulty: z.coerce.number().int().min(1).max(5),
  include_multiple_choice: z.string().transform((val) => val === "true"),
  include_open_questions: z.string().transform((val) => val === "true"),
  include_code_snippets: z.string().transform((val) => val === "true"),
  instructions: z.string().max(2000).optional(),
  enable_time_limit: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  time_limit: z.coerce.number().int().positive().optional(),
  llm_model: z.string().optional(),
});

// ====================
// TYPE EXPORTS
// ====================

export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;
export type GenerateQuestionRequest = z.infer<
  typeof generateQuestionRequestSchema
>;
export type SaveQuizRequest = z.infer<typeof saveQuizRequestSchema>;
export type GenerateQuizFormData = z.infer<typeof generateQuizFormDataSchema>;
