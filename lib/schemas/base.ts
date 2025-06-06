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

// Type exports
export type QuestionType = z.infer<typeof questionTypeSchema>;

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
