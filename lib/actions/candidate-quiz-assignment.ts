"use server";

import { candidateQuizAssignmentSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { requireUser } from "../auth-server";
import { createClient } from "../supabase/server";

export type AssignQuizzesToCandidateState = {
  message: string;
  errors?: {
    quizIds?: string[];
    candidateId?: string[];
    general?: string[];
  };
  createdInterviews?: {
    quizId: string;
    token: string;
    quizTitle: string;
  }[];
  success?: boolean;
};

export async function assignQuizzesToCandidate(
  prevState: AssignQuizzesToCandidateState,
  formData: FormData
): Promise<AssignQuizzesToCandidateState> {
  const supabase = await createClient();
  const quizIds = formData.getAll("quizIds").map(String);
  const candidateId = formData.get("candidateId") as string;

  const validatedFields = candidateQuizAssignmentSchema.safeParse({
    quizIds: quizIds,
    candidateId: candidateId,
  });

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { quizIds: validatedQuizIds, candidateId: validatedCandidateId } =
    validatedFields.data;

  const user = await requireUser();

  // Verify candidate ownership
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, name, email, position_id, created_by")
    .eq("id", validatedCandidateId)
    .single();

  if (candidateError || !candidate) {
    return { message: "Candidate not found." };
  }

  if (candidate.created_by !== user.id) {
    return {
      message:
        "You do not have permission to assign quizzes to this candidate.",
    };
  }

  // Get quiz information and verify they belong to the same position
  const { data: quizzes, error: quizzesError } = await supabase
    .from("quizzes")
    .select("id, title, position_id, created_by")
    .in("id", validatedQuizIds);

  if (quizzesError) {
    return { message: "Error fetching quiz information." };
  }

  // Verify all quizzes belong to the user and the candidate's position
  const invalidQuizzes =
    quizzes?.filter(
      (quiz) =>
        quiz.created_by !== user.id ||
        quiz.position_id !== candidate.position_id
    ) || [];

  if (invalidQuizzes.length > 0) {
    return {
      message:
        "Some quizzes are not valid for this candidate's position or you don't have permission.",
    };
  }

  const quizMap = new Map(quizzes?.map((q) => [q.id, q]) || []);

  const createdInterviews: {
    quizId: string;
    token: string;
    quizTitle: string;
  }[] = [];
  const errors: { quizId: string; message: string }[] = [];

  for (const quizId of validatedQuizIds) {
    const quiz = quizMap.get(quizId);
    if (!quiz) {
      errors.push({ quizId, message: "Quiz not found" });
      continue;
    }

    // Check if interview already exists
    const { data: existingInterview } = await supabase
      .from("interviews")
      .select("id")
      .eq("candidate_id", validatedCandidateId)
      .eq("quiz_id", quizId)
      .single();

    if (existingInterview) {
      errors.push({
        quizId,
        message: "Interview already exists for this quiz",
      });
      continue;
    }

    // Generate unique token
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const { data, error } = await supabase
      .from("interviews")
      .insert({
        candidate_id: validatedCandidateId,
        quiz_id: quizId,
        status: "pending",
        token,
      })
      .select("id, token");

    if (error) {
      errors.push({ quizId, message: error.message });
    } else if (data && data[0]) {
      createdInterviews.push({
        quizId,
        token: data[0].token,
        quizTitle: quiz.title,
      });
    }
  }

  if (errors.length > 0) {
    return {
      message: `Some interviews could not be created. (${errors.length} failures)`,
      createdInterviews,
      errors: { general: errors.map((e) => e.message) },
    };
  }

  revalidatePath(`/dashboard/candidates/${validatedCandidateId}/quiz`);
  revalidatePath(`/dashboard/candidates/${validatedCandidateId}`);
  return {
    message: "Interviews created successfully.",
    createdInterviews,
    success: true,
  };
}
