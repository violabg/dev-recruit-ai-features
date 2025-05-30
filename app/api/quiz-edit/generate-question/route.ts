import { generateNewQuestionAction } from "@/lib/actions/quizzes";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      quizTitle,
      positionTitle,
      experienceLevel,
      skills,
      type,
      previousQuestions,
      // currentIndex, // No longer used by generateNewQuestionAction
    } = body;
    // Optionally use previousQuestions/currentIndex to instruct the AI to avoid duplicates
    const aiQuestion = await generateNewQuestionAction({
      quizTitle,
      positionTitle,
      experienceLevel,
      skills,
      type,
      previousQuestions,
    });
    // Optionally, you can add logic to ensure the new question is different from previousQuestions
    return NextResponse.json(aiQuestion);
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 500 });
  }
}
