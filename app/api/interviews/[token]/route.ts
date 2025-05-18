import type { Database } from "@/lib/database.types";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Fetch interview details
    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("*")
      .eq("token", token)
      .single();

    if (interviewError) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    // Fetch quiz details
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select(
        `
        id, 
        title, 
        questions,
        time_limit,
        position:positions(title)
      `
      )
      .eq("id", interview.quiz_id)
      .single();

    if (quizError) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Fetch candidate details
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, name, email")
      .eq("id", interview.candidate_id)
      .single();

    if (candidateError) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      interview,
      quiz,
      candidate,
    });
  } catch (error: any) {
    console.error("Error fetching interview:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const { action, answer, questionId } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Fetch interview details
    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("*")
      .eq("token", token)
      .single();

    if (interviewError) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    if (action === "start") {
      // Update interview status to in_progress
      const { error } = await supabase
        .from("interviews")
        .update({
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .eq("id", interview.id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to start interview" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "Interview started" });
    } else if (action === "submit_answer") {
      if (!questionId || !answer) {
        return NextResponse.json(
          { error: "Question ID and answer are required" },
          { status: 400 }
        );
      }

      // Get current answers
      const currentAnswers = interview.answers || {};

      // Update answers
      const updatedAnswers = {
        ...currentAnswers,
        [questionId]: answer,
      };

      // Update interview with new answer
      const { error } = await supabase
        .from("interviews")
        .update({
          answers: updatedAnswers,
        })
        .eq("id", interview.id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to save answer" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "Answer saved" });
    } else if (action === "complete") {
      // Update interview status to completed
      const { error } = await supabase
        .from("interviews")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", interview.id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to complete interview" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Interview completed",
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error processing interview action:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
