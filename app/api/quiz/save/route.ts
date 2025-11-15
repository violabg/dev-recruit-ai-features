import { requireUser } from "@/lib/auth-server";
import { withValidation } from "@/lib/middleware/validation";
import { convertToStrictQuestions, saveQuizRequestSchema } from "@/lib/schemas";
import { QuizErrorCode } from "@/lib/services/error-handler";
import { createClient } from "@/lib/supabase/server";
import { getErrorResponse } from "@/lib/utils/error-response";
import { NextRequest, NextResponse } from "next/server";

const saveQuizHandler = withValidation(
  { body: saveQuizRequestSchema },
  {}, // Remove auth requirement from middleware since we handle it manually
  async (req, validated) => {
    try {
      const supabase = await createClient();
      const validatedData = validated.body!;

      // Check user authentication
      const user = await requireUser();

      if (!user) {
        return NextResponse.json(
          {
            error: "Authentication required",
            code: QuizErrorCode.UNAUTHORIZED,
          },
          { status: 401 }
        );
      }

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
          questions: convertToStrictQuestions(validatedData.questions),
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
);

export async function POST(req: NextRequest) {
  return saveQuizHandler(req);
}
