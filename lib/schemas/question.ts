import { z } from "zod";
import { questionTypeSchema } from "./base";

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
// TYPE EXPORTS
// ====================

export type Question = z.infer<typeof questionSchema>;
export type FlexibleQuestion = z.infer<typeof flexibleQuestionSchema>;
export type MultipleChoiceQuestion = z.infer<
  typeof multipleChoiceQuestionSchema
>;
export type OpenQuestion = z.infer<typeof openQuestionSchema>;
export type CodeSnippetQuestion = z.infer<typeof codeSnippetQuestionSchema>;

// ====================
// HELPER FUNCTIONS
// ====================

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
