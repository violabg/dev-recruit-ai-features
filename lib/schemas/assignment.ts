import { z } from "zod";
import { uuidSchema } from "./base";

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
// TYPE EXPORTS
// ====================

export type CandidateSelection = z.infer<typeof candidateSelectionSchema>;
export type QuizSelection = z.infer<typeof quizSelectionSchema>;
