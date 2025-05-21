import { quizDataSchema } from "@/lib/actions/quiz-schemas";
import { generateNewQuizAction } from "@/lib/actions/quizzes";
import { NextResponse } from "next/server";
import { z } from "zod";

const generateQuizRequestSchema = z.object({
  positionId: z.string(),
  quizTitle: z.string(),
  questionCount: z.number(),
  difficulty: z.number(),
  previousQuestions: z.array(z.object({ question: z.string() })).optional(),
  includeMultipleChoice: z.boolean(),
  includeOpenQuestions: z.boolean(),
  includeCodeSnippets: z.boolean(),
});

export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;
export type GenerateQuizResponse = z.infer<typeof quizDataSchema>;

export async function POST(
  req: Request
): Promise<NextResponse<GenerateQuizResponse | { error: string }>> {
  try {
    const body = (await req.json()) as GenerateQuizRequest;
    const validationResult = generateQuizRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      positionId,
      quizTitle,
      questionCount,
      difficulty,
      previousQuestions,
      includeMultipleChoice,
      includeOpenQuestions,
      includeCodeSnippets,
    } = validationResult.data;

    const aiQuiz = await generateNewQuizAction({
      positionId,
      quizTitle,
      questionCount,
      difficulty,
      includeMultipleChoice,
      includeOpenQuestions,
      includeCodeSnippets,
      previousQuestions,
    });

    return NextResponse.json(aiQuiz);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
