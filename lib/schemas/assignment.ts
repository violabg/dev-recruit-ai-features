import { z } from "zod";
import { baseSchemas } from "./base";

// ====================
// ASSIGNMENT SCHEMAS
// ====================

export const candidateSelectionSchema = z.object({
  candidateIds: z.array(baseSchemas.uuid).min(1, {
    message: "Please select at least one candidate.",
  }),
  quizId: baseSchemas.uuid.optional(), // Optional for forms that don't have quizId in form data
});

// Specific schema for candidate-quiz assignment action
export const candidateQuizSelectionSchema = z.object({
  candidateIds: z.array(baseSchemas.uuid).min(1, {
    message: "Please select at least one candidate.",
  }),
  quizId: baseSchemas.uuid, // Required for backend action
});

export const quizSelectionSchema = z.object({
  quizIds: z.array(baseSchemas.uuid).min(1, {
    message: "Please select at least one quiz.",
  }),
  candidateId: baseSchemas.uuid.optional(), // Optional for forms that don't have candidateId in form data
});

// Specific schema for candidate-quiz assignment action
export const candidateQuizAssignmentSchema = z.object({
  quizIds: z.array(baseSchemas.uuid).min(1, {
    message: "Please select at least one quiz.",
  }),
  candidateId: baseSchemas.uuid, // Required for backend action
});

// ====================
// TYPE EXPORTS
// ====================

export type CandidateSelection = z.infer<typeof candidateSelectionSchema>;
export type QuizSelection = z.infer<typeof quizSelectionSchema>;
