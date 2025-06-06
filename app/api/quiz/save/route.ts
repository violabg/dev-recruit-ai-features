import { QuizErrorCode } from "@/lib/services/error-handler";
import { createClient } from "@/lib/supabase/server";
import { getErrorResponse } from "@/lib/utils/error-response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const saveQuizRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  position_id: z.string().uuid("Invalid position ID"),
  questions: z.array(z.any()).min(1, "At least one question required"),
  time_limit: z.number().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required",
          code: QuizErrorCode.UNAUTHORIZED,
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          code: QuizErrorCode.INVALID_INPUT,
        },
        { status: 400 }
      );
    }

    const validationResult = saveQuizRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          code: QuizErrorCode.INVALID_INPUT,
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verify user owns the position
    const { data: position, error: positionError } = await supabase
      .from("positions")
      .select("id")
      .eq("id", validatedData.position_id)
      .eq("created_by", user.id)
      .single();

    if (positionError || !position) {
      return NextResponse.json(
        {
          error: "Position not found or access denied",
          code: QuizErrorCode.POSITION_NOT_FOUND,
        },
        { status: 404 }
      );
    }

    // Save quiz to database
    const { data: quiz, error: insertError } = await supabase
      .from("quizzes")
      .insert({
        title: validatedData.title,
        position_id: validatedData.position_id,
        questions: validatedData.questions,
        time_limit: validatedData.time_limit,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError || !quiz) {
      return NextResponse.json(
        {
          error: "Failed to save quiz to database",
          code: QuizErrorCode.DATABASE_ERROR,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: quiz.id,
      message: "Quiz saved successfully",
    });
  } catch (error) {
    console.error("Quiz save error:", error);
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
