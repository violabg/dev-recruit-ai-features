"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "../supabase/server";
import { Json } from "../supabase/types";

export type InterviewsFilters = {
  search?: string;
  status?: string;
  positionId?: string;
  programmingLanguage?: string;
  page?: number;
  limit?: number;
};

export async function fetchInterviewsData(filters: InterviewsFilters = {}) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const {
    search = "",
    status = "all",
    positionId = "all",
    programmingLanguage = "all",
    page = 1,
    limit = 10,
  } = filters;

  // Call the RPC (cast result for type safety)
  const { data: interviews, error } = await supabase.rpc("search_interviews", {
    p_user_id: user.id,
    p_search: search || null,
    p_status: status !== "all" ? status : null,
    p_position_id: positionId !== "all" ? positionId : null,
    p_programming_language:
      programmingLanguage !== "all" ? programmingLanguage : null,
    p_page: page,
    p_limit: limit,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Get positions for filter dropdown
  const { data: positions, error: positionsError } = await supabase
    .from("positions")
    .select("id, title, skills")
    .eq("created_by", user.id)
    .order("title");

  if (positionsError) {
    throw new Error(positionsError.message);
  }

  // Get unique programming languages from all positions
  const allSkills = positions?.flatMap((p) => p.skills || []) || [];
  const programmingLanguages = [...new Set(allSkills)].sort();

  // Status counts for filter badges (from returned data only)
  const statusCounts = interviews.reduce<Record<string, number>>(
    (acc, interview) => {
      acc[interview.status] = (acc[interview.status] || 0) + 1;
      return acc;
    },
    {}
  );

  return {
    interviews,
    positions: positions || [],
    programmingLanguages,
    statusCounts,
    totalCount: interviews.length,
    currentPage: page,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: page > 1,
  };
}

// Interview actions
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
  answer: string | number | boolean | object | Json[] // Use Json[] for array type
) {
  const supabase = await createClient();

  // Get current interview
  const { data: interview, error: fetchError } = await supabase
    .from("interviews")
    .select("id, answers") // Select id along with answers
    .eq("token", token)
    .single();

  if (fetchError || !interview) {
    throw new Error(fetchError?.message || "Interview not found");
  }

  // Get current answers
  const currentAnswers =
    (interview.answers as Record<string, Json | Json[]>) || {}; // Type assertion for answers

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
    .eq("id", interview.id); // Use interview.id here

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

export async function getInterviewsByQuiz(quizId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("interviews")
    .select(
      `
      id, 
      token, 
      status, 
      created_at,
      started_at,
      completed_at,
      candidate:candidates(id, name, email),
      quiz:quizzes(id, title)
    `
    )
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export type InterviewsByQuiz = Awaited<ReturnType<typeof getInterviewsByQuiz>>;

export async function deleteInterview(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("interviews")
    .delete()
    .eq("id", id)
    .select("quiz_id");

  if (error) {
    throw new Error(error.message);
  }

  if (data && data[0]) {
    revalidatePath(`/dashboard/quizzes/${data[0].quiz_id}`);
  }

  return { success: true };
}

const candidateSelectionSchema = z.object({
  candidateIds: z.array(z.string()).min(1, {
    message: "Please select at least one candidate.",
  }),
  quizId: z.string(),
});

export type AssignCandidatesToQuizState = {
  message: string;
  errors?: {
    candidateIds?: string[];
    quizId?: string[];
    general?: string[];
  };
  createdInterviews?: {
    candidateId: string;
    token: string;
    candidateName: string;
    candidateEmail: string;
  }[];
  success?: boolean;
};

export async function assignCandidatesToQuiz(
  prevState: AssignCandidatesToQuizState,
  formData: FormData
): Promise<AssignCandidatesToQuizState> {
  const supabase = await createClient();
  const candidateIds = formData.getAll("candidateIds").map(String);
  const quizId = formData.get("quizId") as string;

  const validatedFields = candidateSelectionSchema.safeParse({
    candidateIds: candidateIds,
    quizId: quizId,
  });

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { candidateIds: validatedCandidateIds, quizId: validatedQuizId } =
    validatedFields.data;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { message: "User not authenticated." };
  }

  // Verify quiz ownership
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id, created_by")
    .eq("id", validatedQuizId)
    .single();

  if (quizError || !quiz) {
    return { message: "Quiz not found." };
  }

  if (quiz.created_by !== user.id) {
    return { message: "You do not have permission to assign this quiz." };
  }

  // Get candidate information first
  const { data: candidates, error: candidatesError } = await supabase
    .from("candidates")
    .select("id, name, email")
    .in("id", validatedCandidateIds);

  if (candidatesError) {
    return { message: "Error fetching candidate information." };
  }

  const candidateMap = new Map(candidates?.map((c) => [c.id, c]) || []);

  const createdInterviews: {
    candidateId: string;
    token: string;
    candidateName: string;
    candidateEmail: string;
  }[] = [];
  const errors: { candidateId: string; message: string }[] = [];

  for (const candidateId of validatedCandidateIds) {
    const candidate = candidateMap.get(candidateId);
    if (!candidate) {
      errors.push({ candidateId, message: "Candidate not found" });
      continue;
    }

    // Generate unique token
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const { data, error } = await supabase
      .from("interviews")
      .insert({
        candidate_id: candidateId,
        quiz_id: validatedQuizId,
        status: "pending",
        token,
      })
      .select("id, token");

    if (error) {
      errors.push({ candidateId, message: error.message });
    } else if (data && data[0]) {
      createdInterviews.push({
        candidateId,
        token: data[0].token,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
      });
    }
  }

  if (errors.length > 0) {
    return {
      message: `Some interviews could not be created. (${errors.length} failures)`,
      createdInterviews,
      errors: { general: errors.map((e) => e.message) }, // Populate general errors
    };
  }

  revalidatePath(`/dashboard/quizzes/${validatedQuizId}/invite`);
  return {
    message: "Interviews created successfully.",
    createdInterviews,
    success: true,
  };
}
