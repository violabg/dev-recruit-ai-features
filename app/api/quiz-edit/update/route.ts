import { updateQuizAction } from "@/lib/actions/quizzes";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  try {
    await updateQuizAction(formData);
    return NextResponse.json({ success: true });
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 500 });
  }
}
