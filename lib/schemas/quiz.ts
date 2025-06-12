import { z } from "zod";
import { baseSchemas, formTransformers } from "./base";
import { questionSchemas } from "./question";

// ====================
// UNIFIED QUIZ SCHEMAS
// ====================
// Consolidated quiz schemas eliminating duplication and providing single source of truth

// AI Generation schema - only includes fields that the AI should generate
// This schema excludes backend-managed fields like UUIDs, timestamps, etc.
export const aiQuizGenerationSchema = z.object({
  title: baseSchemas.title,
  questions: z.array(questionSchemas.flexible),
  time_limit: z.number().nullable().optional(),
  difficulty: baseSchemas.difficulty.optional(),
  instructions: baseSchemas.instructions.optional(),
});

// Core quiz data schema - the single source of truth
export const quizDataSchema = z.object({
  id: baseSchemas.uuid.optional(), // Optional for creation
  title: baseSchemas.title,
  position_id: baseSchemas.uuid,
  questions: z.array(questionSchemas.flexible),
  time_limit: baseSchemas.timeLimit,
  difficulty: baseSchemas.difficulty.optional(),
  instructions: baseSchemas.instructions,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  created_by: baseSchemas.uuid,
  updated_by: baseSchemas.uuid.optional(),
});

// Generation configuration - shared across all generation contexts
export const quizGenerationConfigSchema = z.object({
  quizTitle: baseSchemas.title,
  difficulty: baseSchemas.difficulty,
  questionCount: baseSchemas.questionCount,
  instructions: baseSchemas.instructions,

  // Question type inclusion flags
  includeMultipleChoice: z.boolean(),
  includeOpenQuestions: z.boolean(),
  includeCodeSnippets: z.boolean(),

  // Optional generation parameters
  specificModel: z.string().optional(),
  previousQuestions: z
    .array(
      z.object({
        question: z.string().min(1, "Question text required"),
        type: z.string().optional(),
      })
    )
    .optional(),
});

// API request schemas - extend base configuration
export const quizApiSchemas = {
  generateQuiz: quizGenerationConfigSchema.extend({
    positionId: baseSchemas.uuid,
  }),

  // Quiz update request (unified schema)
  update: z.object({
    quiz_id: baseSchemas.uuid,
    title: baseSchemas.title,
    time_limit: baseSchemas.timeLimit,
    questions: z.array(questionSchemas.flexible),
    instructions: baseSchemas.instructions.optional(),
    updated_by: baseSchemas.uuid.optional(),
  }),

  // Quiz save request
  save: z.object({
    title: baseSchemas.title,
    position_id: baseSchemas.uuid,
    questions: z
      .array(questionSchemas.flexible)
      .min(1, "At least one question required"),
    time_limit: z.number().nullable(),
    instructions: baseSchemas.instructions.optional(),
  }),

  generateQuestion: z.object({
    quizTitle: baseSchemas.title,
    positionTitle: baseSchemas.title,
    experienceLevel: z.string().min(1, "Experience level is required"),
    skills: baseSchemas.skills,
    type: baseSchemas.questionType,
    difficulty: baseSchemas.difficulty.optional(),
    previousQuestions: z
      .array(
        z.object({
          question: z.string().min(1, "Question text required"),
          type: z.string().optional(),
        })
      )
      .optional(),
    specificModel: z.string().optional(),
    instructions: baseSchemas.instructions,
    questionIndex: z
      .number()
      .int()
      .min(0, "Question index must be a non-negative integer"),

    // Type-specific parameters for different question types
    // Multiple choice specific
    focusAreas: z.array(z.string()).optional(),
    distractorComplexity: z.enum(["simple", "moderate", "complex"]).optional(),

    // Open question specific
    requireCodeExample: z.boolean().optional(),
    expectedResponseLength: z.enum(["short", "medium", "long"]).optional(),
    evaluationCriteria: z.array(z.string()).optional(),

    // Code snippet specific
    language: z.string().optional(), // 🎯 THIS IS THE KEY FIELD!
    bugType: z.enum(["syntax", "logic", "performance", "security"]).optional(),
    codeComplexity: z.enum(["basic", "intermediate", "advanced"]).optional(),
    includeComments: z.boolean().optional(),
  }),
} as const;

// Form schemas with proper transformation
export const quizFormSchemas = {
  // Frontend form schema (React Hook Form)
  frontend: quizGenerationConfigSchema.extend({
    enableTimeLimit: z.boolean(),
    timeLimit: baseSchemas.timeLimit,
    llmModel: z.string(),
  }),

  // FormData schema (server actions) with transformations
  formData: z.object({
    position_id: baseSchemas.uuid,
    title: baseSchemas.title,
    question_count: formTransformers.coerceInt.pipe(baseSchemas.questionCount),
    difficulty: formTransformers.coerceInt.pipe(baseSchemas.difficulty),
    include_multiple_choice: formTransformers.stringToBoolean,
    include_open_questions: formTransformers.stringToBoolean,
    include_code_snippets: formTransformers.stringToBoolean,
    instructions: z.string().max(2000).optional(),
    enable_time_limit: formTransformers.stringToBoolean.optional(),
    time_limit: formTransformers.coerceInt
      .pipe(baseSchemas.timeLimit)
      .optional(),
    llm_model: z.string().optional(),
  }),

  // Simplified quiz form for basic editing
  basic: z.object({
    title: z.string().min(2, "Il titolo deve contenere almeno 2 caratteri."),
    instructions: baseSchemas.instructions,
    questionCount: baseSchemas.questionCount,
    includeMultipleChoice: z.boolean(),
    includeOpenQuestions: z.boolean(),
    includeCodeSnippets: z.boolean(),
    difficulty: baseSchemas.difficulty,
    timeLimit: baseSchemas.timeLimit,
    enableTimeLimit: z.boolean(),
    llmModel: z.string(),
  }),
} as const;

// Database entity schemas
export const quizEntitySchemas = {
  // Complete quiz entity from database
  complete: z.object({
    id: baseSchemas.uuid,
    title: baseSchemas.title,
    position_id: baseSchemas.uuid,
    questions: z.array(questionSchemas.flexible),
    time_limit: z.number().nullable(),
    difficulty: baseSchemas.difficulty.optional(),
    created_at: z.string(),
    created_by: baseSchemas.uuid,
    updated_at: z.string().optional(),
    updated_by: baseSchemas.uuid.optional(),
  }),

  // Minimal quiz for listing
  summary: z.object({
    id: baseSchemas.uuid,
    title: baseSchemas.title,
    position_id: baseSchemas.uuid,
    difficulty: baseSchemas.difficulty.optional(),
    created_at: z.string(),
    question_count: z.number().int().min(0),
  }),
} as const;

// Type exports with consistent naming
export type QuizData = z.infer<typeof quizDataSchema>;
export type QuizGenerationConfig = z.infer<typeof quizGenerationConfigSchema>;
export type QuizApiRequest = z.infer<typeof quizApiSchemas.generateQuiz>;
export type QuizFormData = z.infer<typeof quizFormSchemas.frontend>;
export type QuizFormDataRaw = z.infer<typeof quizFormSchemas.formData>;
export type QuizBasicForm = z.infer<typeof quizFormSchemas.basic>;
export type Quiz = z.infer<typeof quizEntitySchemas.complete>;
export type QuizSummary = z.infer<typeof quizEntitySchemas.summary>;
export type AIQuizGeneration = z.infer<typeof aiQuizGenerationSchema>;

// API request types
export type GenerateQuizRequest = z.infer<typeof quizApiSchemas.generateQuiz>;
export type GenerateQuestionRequest = z.infer<
  typeof quizApiSchemas.generateQuestion
>;
export type SaveQuizRequest = z.infer<typeof quizApiSchemas.save>;
export type UpdateQuizRequest = z.infer<typeof quizApiSchemas.update>;

// Legacy aliases for backward compatibility
export type QuizForm = Quiz;
export type GenerateQuizFormData = QuizFormDataRaw;

// Schema exports for direct usage
export const quizSchema = quizEntitySchemas.complete;
export const generateQuizRequestSchema = quizApiSchemas.generateQuiz;
export const generateQuestionRequestSchema = quizApiSchemas.generateQuestion;
export const saveQuizRequestSchema = quizApiSchemas.save;
export const updateQuizRequestSchema = quizApiSchemas.update;
export const generateQuizFormDataSchema = quizFormSchemas.formData;
export const quizFormSchema = quizFormSchemas.basic;
