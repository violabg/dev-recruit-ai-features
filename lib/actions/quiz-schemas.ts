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
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
      })
    )
    .optional(),
});

export const quizDataSchema = z.object({
  questions: z.array(questionSchema),
});
