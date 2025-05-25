"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "../supabase/server";
import { Json } from "../supabase/types";

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
      answers: updatedAnswers as Json,
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

// New types for interviews page
export type InterviewWithDetails = {
  id: string;
  token: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  score: number | null;
  candidate: {
    id: string;
    name: string;
    email: string;
  } | null;
  quiz: {
    id: string;
    title: string;
    position: {
      id: string;
      title: string;
      skills: string[];
    } | null;
  } | null;
};

export type InterviewsFilters = {
  search?: string;
  status?: string;
  positionId?: string;
  programmingLanguage?: string;
  page?: number;
  limit?: number;
};

// Fetch all interviews with pagination and filters
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

  // Base query
  let query = supabase.from("interviews").select(
    `
      id,
      token,
      status,
      started_at,
      completed_at,
      created_at,
      score,
      candidate:candidates(id, name, email),
      quiz:quizzes(
        id,
        title,
        position:positions(id, title, skills)
      )
    `,
    { count: "exact" }
  );

  // Filter by user's candidates only
  query = query.eq("candidates.created_by", user.id);

  // Apply search filter
  if (search) {
    query = query.or(
      `candidates.name.ilike.%${search}%,candidates.email.ilike.%${search}%,quizzes.title.ilike.%${search}%`
    );
  }

  // Apply status filter
  if (status !== "all") {
    query = query.eq("status", status);
  }

  // Apply position filter
  if (positionId !== "all") {
    query = query.eq("quizzes.position_id", positionId);
  }

  // For programming language filter, we need to fetch all data first
  // Apply ordering but no pagination yet
  query = query.order("created_at", { ascending: false });

  const { data: allInterviews, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Filter by programming language after fetching (since we can't filter on embedded resources)
  let filteredInterviews = allInterviews || [];
  if (programmingLanguage !== "all") {
    filteredInterviews = filteredInterviews.filter(
      (interview) =>
        interview.quiz?.position?.skills?.includes(programmingLanguage) || false
    );
  }

  // Apply pagination to filtered results
  const totalFilteredCount = filteredInterviews.length;
  const offset = (page - 1) * limit;
  const paginatedInterviews = filteredInterviews.slice(offset, offset + limit);

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

  // Get status counts for filter badges
  const { data: statusCounts, error: statusError } = await supabase
    .from("interviews")
    .select("status, candidates!inner(created_by)", { count: "exact" })
    .eq("candidates.created_by", user.id);

  if (statusError) {
    throw new Error(statusError.message);
  }

  // Count interviews by status
  const statusCountMap =
    statusCounts?.reduce((acc, interview) => {
      acc[interview.status] = (acc[interview.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  return {
    interviews: paginatedInterviews,
    positions: positions || [],
    programmingLanguages,
    statusCounts: statusCountMap,
    totalCount: totalFilteredCount,
    currentPage: page,
    totalPages: Math.ceil(totalFilteredCount / limit),
    hasNextPage: totalFilteredCount > offset + limit,
    hasPrevPage: page > 1,
  };
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
