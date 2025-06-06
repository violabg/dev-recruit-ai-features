import { z } from "zod";

export const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple_choice", "open_question", "code_snippet"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.number().optional(),
  explanation: z.string().optional(),
  sampleAnswer: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  language: z.string().optional(),
  codeSnippet: z.string().optional(),
  sampleSolution: z.string().optional(),
});

export type Question = z.infer<typeof questionSchema>;

export const quizDataSchema = z.object({
  questions: z.array(questionSchema),
});

export const quizSchema = z.object({
  id: z.string(),
  title: z.string(),
  position_id: z.string(),
  questions: z.array(questionSchema),
  time_limit: z.number().nullable(),
  difficulty: z.number().min(1).max(5).optional(),
  created_at: z.string(),
  created_by: z.string(),
});

export type QuizForm = z.infer<typeof quizSchema>;

// Base schemas for reuse
export const difficultySchema = z.number().int().min(1).max(5);
export const questionCountSchema = z.number().int().min(1).max(50);
export const instructionsSchema = z.string().max(2000).optional();
export const questionTypeSchema = z.enum([
  "multiple_choice",
  "open_question",
  "code_snippet",
]);

// Core quiz generation schema
export const quizGenerationBaseSchema = z.object({
  quizTitle: z
    .string()
    .min(1, "Quiz title is required")
    .max(200, "Quiz title too long"),
  difficulty: difficultySchema,
  instructions: instructionsSchema,
  includeMultipleChoice: z.boolean(),
  includeOpenQuestions: z.boolean(),
  includeCodeSnippets: z.boolean(),
});

// Frontend form schema (for client-side validation)
export const quizFormSchema = z.object({
  title: z.string().min(2, "Il titolo deve contenere almeno 2 caratteri."),
  instructions: z.string().optional(),
  questionCount: questionCountSchema,
  includeMultipleChoice: z.boolean(),
  includeOpenQuestions: z.boolean(),
  includeCodeSnippets: z.boolean(),
  difficulty: difficultySchema,
  timeLimit: z.number().min(0).max(120),
  enableTimeLimit: z.boolean(),
  llmModel: z.string(),
});

// API request schema for quiz generation
export const generateQuizRequestSchema = z.object({
  positionId: z.string().uuid("Invalid position ID format"),
  quizTitle: z
    .string()
    .min(1, "Quiz title is required")
    .max(200, "Quiz title too long"),
  questionCount: questionCountSchema,
  difficulty: difficultySchema,
  previousQuestions: z
    .array(
      z.object({
        question: z.string().min(1, "Question text required"),
      })
    )
    .optional(),
  includeMultipleChoice: z.boolean(),
  includeOpenQuestions: z.boolean(),
  includeCodeSnippets: z.boolean(),
  specificModel: z.string().optional(),
  instructions: instructionsSchema,
});

// API request schema for individual question generation
export const generateQuestionRequestSchema = z.object({
  quizTitle: z
    .string()
    .min(1, "Quiz title is required")
    .max(200, "Quiz title too long"),
  positionTitle: z
    .string()
    .min(1, "Position title is required")
    .max(200, "Position title too long"),
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

// Server action form data schema (for backward compatibility)
export const generateQuizFormDataSchema = z.object({
  position_id: z.string().uuid("Invalid position ID format"),
  title: z
    .string()
    .min(1, "Quiz title is required")
    .max(200, "Quiz title too long"),
  question_count: z.coerce
    .number()
    .int()
    .min(1, "At least 1 question required")
    .max(50, "Maximum 50 questions allowed"),
  difficulty: z.coerce
    .number()
    .int()
    .min(1, "Difficulty minimum is 1")
    .max(5, "Difficulty maximum is 5"),
  include_multiple_choice: z.string().transform((val) => val === "true"),
  include_open_questions: z.string().transform((val) => val === "true"),
  include_code_snippets: z.string().transform((val) => val === "true"),
  instructions: z.string().max(2000, "Instructions too long").optional(),
  enable_time_limit: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  time_limit: z.coerce.number().int().positive().optional(),
  llm_model: z.string().optional(),
});

// Type exports
export type QuizFormData = z.infer<typeof quizFormSchema>;
export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;
export type GenerateQuestionRequest = z.infer<
  typeof generateQuestionRequestSchema
>;
export type GenerateQuizFormData = z.infer<typeof generateQuizFormDataSchema>;
