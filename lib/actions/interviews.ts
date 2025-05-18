"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";

// Interview actions
export async function createInterview(formData: FormData) {
  const supabase = await createClient();

  const candidateId = formData.get("candidate_id") as string;
  const quizId = formData.get("quiz_id") as string;

  // Generate unique token
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  const { data, error } = await supabase
    .from("interviews")
    .insert({
      candidate_id: candidateId,
      quiz_id: quizId,
      status: "pending",
      token,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/quizzes/${quizId}`);

  if (data && data[0]) {
    return {
      success: true,
      interviewId: data[0].id,
      token: data[0].token,
    };
  } else {
    throw new Error("Failed to create interview");
  }
}

export async function startInterview(token: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("interviews")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("token", token);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function submitAnswer(
  token: string,
  questionId: string,
  answer: any
) {
  const supabase = await createClient();

  // Get current interview
  const { data: interview, error: fetchError } = await supabase
    .from("interviews")
    .select("*")
    .eq("token", token)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  // Get current answers
  const currentAnswers = interview?.answers || {};

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
    throw new Error(error.message);
  }

  return { success: true };
}

export async function completeInterview(token: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("interviews")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("token", token);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}
