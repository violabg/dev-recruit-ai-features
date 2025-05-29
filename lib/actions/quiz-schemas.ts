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
