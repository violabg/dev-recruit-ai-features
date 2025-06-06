import { z } from "zod";

// ====================
// BASE VALIDATION SCHEMAS
// ====================

// Common field validations
export const emailSchema = z.string().email({ message: "Email non valida" });
export const passwordSchema = z
  .string()
  .min(6, { message: "Minimo 6 caratteri" });
export const titleSchema = z
  .string()
  .min(1, "Title is required")
  .max(200, "Title too long");
export const nameSchema = z
  .string()
  .min(2, "Nome deve contenere almeno 2 caratteri");
export const uuidSchema = z.string().uuid("Invalid UUID format");

// Numeric validations
export const difficultySchema = z.number().int().min(1).max(5);
export const questionCountSchema = z.number().int().min(1).max(50);
export const timeLimitSchema = z.number().min(0).max(120);
export const scoreSchema = z.number().min(0).max(10);

// Text validations
export const instructionsSchema = z.string().max(2000).optional();
export const descriptionSchema = z.string().optional();

// Enums
export const questionTypeSchema = z.enum([
  "multiple_choice",
  "open_question",
  "code_snippet",
]);

export const experienceLevelSchema = z.enum([
  "junior",
  "mid",
  "senior",
  "lead",
]);

export const contractTypeSchema = z.enum([
  "full-time",
  "part-time",
  "contract",
  "internship",
]);

export const interviewStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

// ====================
// AUTHENTICATION SCHEMAS
// ====================

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z
  .object({
    first_name: z
      .string()
      .min(2, { message: "Nome deve essere almeno 2 caratteri" })
      .max(30, { message: "Nome deve essere massimo 30 caratteri" }),
    last_name: z
      .string()
      .min(2, { message: "Cognome deve essere almeno 2 caratteri" })
      .max(30, { message: "Cognome deve essere massimo 30 caratteri" }),
    email: emailSchema,
    password: passwordSchema,
    repeatPassword: passwordSchema,
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Passwords do not match",
    path: ["repeatPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    current_password: passwordSchema,
    new_password: z
      .string()
      .min(6, { message: "Password deve essere almeno 6 caratteri" })
      .max(100, { message: "Password deve essere massimo 100 caratteri" }),
    confirm_password: passwordSchema,
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Le password non corrispondono",
    path: ["confirm_password"],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "La nuova password deve essere diversa da quella attuale",
    path: ["new_password"],
  });

// ====================
// PROFILE SCHEMAS
// ====================

export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: "Nome completo deve essere almeno 2 caratteri" })
    .max(50, { message: "Nome completo deve essere massimo 50 caratteri" }),
  user_name: z
    .string()
    .min(2, { message: "Nome utente deve essere almeno 2 caratteri" })
    .max(30, { message: "Nome utente deve essere massimo 30 caratteri" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        "Nome utente può contenere solo lettere, numeri, trattini e underscore",
    }),
});

// ====================
// POSITION SCHEMAS
// ====================

export const positionFormSchema = z.object({
  title: z.string().min(2, {
    message: "Il titolo deve contenere almeno 2 caratteri.",
  }),
  description: descriptionSchema,
  experience_level: z.string({
    required_error: "Seleziona un livello di esperienza.",
  }),
  skills: z.array(z.string()).min(1, {
    message: "Seleziona almeno una competenza.",
  }),
  soft_skills: z.array(z.string()).optional(),
  contract_type: z.string().optional(),
});

// ====================
// CANDIDATE SCHEMAS
// ====================

export const candidateFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  position_id: z.string().min(1, { message: "Seleziona una posizione." }),
});

// ====================
// QUESTION SCHEMAS
// ====================

export const baseQuestionSchema = z.object({
  id: z.string(),
  type: questionTypeSchema,
  question: z.string().min(1, "Question text required"),
});

export const multipleChoiceQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("multiple_choice"),
  options: z.array(z.string()).min(2, "At least 2 options required"),
  correctAnswer: z.number().min(0),
  explanation: z.string().optional(),
});

export const openQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("open_question"),
  sampleAnswer: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export const codeSnippetQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("code_snippet"),
  language: z.string().min(1, "Programming language required"),
  codeSnippet: z.string().optional(),
  sampleSolution: z.string().optional(),
});

// Discriminated union for type-safe question handling
export const questionSchema = z.discriminatedUnion("type", [
  multipleChoiceQuestionSchema,
  openQuestionSchema,
  codeSnippetQuestionSchema,
]);

// Flexible question schema for existing data (backward compatibility)
export const flexibleQuestionSchema = z.object({
  id: z.string(),
  type: questionTypeSchema,
  question: z.string().min(1, "Question text required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.number().optional(),
  explanation: z.string().optional(),
  sampleAnswer: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  language: z.string().optional(),
  codeSnippet: z.string().optional(),
  sampleSolution: z.string().optional(),
});

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
// ASSIGNMENT SCHEMAS
// ====================

export const candidateSelectionSchema = z.object({
  candidateIds: z.array(uuidSchema).min(1, {
    message: "Please select at least one candidate.",
  }),
  quizId: uuidSchema.optional(), // Optional for forms that don't have quizId in form data
});

// Specific schema for candidate-quiz assignment action
export const candidateQuizSelectionSchema = z.object({
  candidateIds: z.array(uuidSchema).min(1, {
    message: "Please select at least one candidate.",
  }),
  quizId: uuidSchema, // Required for backend action
});

export const quizSelectionSchema = z.object({
  quizIds: z.array(uuidSchema).min(1, {
    message: "Please select at least one quiz.",
  }),
  candidateId: uuidSchema.optional(), // Optional for forms that don't have candidateId in form data
});

// Specific schema for candidate-quiz assignment action
export const candidateQuizAssignmentSchema = z.object({
  quizIds: z.array(uuidSchema).min(1, {
    message: "Please select at least one quiz.",
  }),
  candidateId: uuidSchema, // Required for backend action
});

// ====================
// EVALUATION SCHEMAS
// ====================

export const evaluationResultSchema = z.object({
  evaluation: z
    .string()
    .describe("Una valutazione dettagliata della risposta del candidato"),
  score: scoreSchema.describe(
    "Un punteggio da 0 a 10, dove 10 è una risposta perfetta"
  ),
  strengths: z
    .array(z.string())
    .describe("I punti di forza della risposta del candidato"),
  weaknesses: z
    .array(z.string())
    .describe("Le aree di miglioramento nella risposta del candidato"),
});

export const overallEvaluationSchema = z.object({
  evaluation: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendation: z.string(),
  fitScore: z.number().min(0).max(100),
});

// ====================
// AI GENERATION SCHEMAS
// ====================

export const aiGenerationSchema = z.object({
  instructions: instructionsSchema,
  llmModel: z.string(),
  difficulty: difficultySchema.optional(),
});

// ====================
// TYPE EXPORTS
// ====================

// Authentication types
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Profile types
export type ProfileFormData = z.infer<typeof profileSchema>;

// Position types
export type PositionFormData = z.infer<typeof positionFormSchema>;

// Candidate types
export type CandidateFormData = z.infer<typeof candidateFormSchema>;

// Question types
export type Question = z.infer<typeof questionSchema>;
export type FlexibleQuestion = z.infer<typeof flexibleQuestionSchema>;
export type MultipleChoiceQuestion = z.infer<
  typeof multipleChoiceQuestionSchema
>;
export type OpenQuestion = z.infer<typeof openQuestionSchema>;
export type CodeSnippetQuestion = z.infer<typeof codeSnippetQuestionSchema>;

// Quiz types
export type QuizFormData = z.infer<typeof quizFormSchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type QuizForm = Quiz; // Alias for backward compatibility
export type QuizData = z.infer<typeof quizDataSchema>;

// API types
export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;
export type GenerateQuestionRequest = z.infer<
  typeof generateQuestionRequestSchema
>;
export type SaveQuizRequest = z.infer<typeof saveQuizRequestSchema>;
export type GenerateQuizFormData = z.infer<typeof generateQuizFormDataSchema>;

// Assignment types
export type CandidateSelection = z.infer<typeof candidateSelectionSchema>;
export type QuizSelection = z.infer<typeof quizSelectionSchema>;

// Evaluation types
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type OverallEvaluation = z.infer<typeof overallEvaluationSchema>;

// AI types
export type AIGenerationFormData = z.infer<typeof aiGenerationSchema>;

// Helper function to convert flexible questions to strict discriminated union questions
export const convertToStrictQuestions = (
  questions: FlexibleQuestion[]
): Question[] => {
  return questions.map((q): Question => {
    if (q.type === "multiple_choice") {
      return {
        id: q.id,
        type: "multiple_choice",
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer || 0,
        explanation: q.explanation,
      };
    } else if (q.type === "open_question") {
      return {
        id: q.id,
        type: "open_question",
        question: q.question,
        sampleAnswer: q.sampleAnswer,
        keywords: q.keywords,
      };
    } else {
      // code_snippet
      return {
        id: q.id,
        type: "code_snippet",
        question: q.question,
        language: q.language || "javascript",
        codeSnippet: q.codeSnippet,
        sampleSolution: q.sampleSolution,
      };
    }
  });
};
