import { generateNewQuizAction } from "@/lib/actions/quizzes";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      positionId,
      quizTitle,
      experienceLevel,
      skills,
      questionCount,
      difficulty,
      previousQuestions,
    } = body;
    // Optionally use previousQuestions to instruct the AI to generate a different quiz
    const aiQuiz = await generateNewQuizAction(
      positionId,
      quizTitle,
      experienceLevel,
      skills,
      questionCount,
      difficulty,
      previousQuestions
    );
    // Optionally, you can add logic to ensure the new quiz is different from previousQuestions
    return NextResponse.json(aiQuiz);
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 500 });
  }
}
