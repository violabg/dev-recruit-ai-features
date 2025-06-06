import { quizSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

/**
 * Cached function to fetch quiz data
 * Uses React's cache() for request-level deduplication
 */
export const getQuizData = cache(async (quizId: string) => {
  const supabase = await createClient();

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();

  if (error || !quiz) return null;

  const { data: position } = await supabase
    .from("positions")
    .select("id, title, experience_level, skills")
    .eq("id", quiz.position_id)
    .single();

  if (!position) return null;

  // Validate quiz data
  const parsedQuiz = quizSchema.safeParse(quiz);
  if (!parsedQuiz.success) return null;

  return { quiz: parsedQuiz.data, position };
});

/**
 * Cached function to fetch position data
 */
export const getPositionData = cache(async (positionId: string) => {
  const supabase = await createClient();

  const { data: position, error } = await supabase
    .from("positions")
    .select("id, title, experience_level, skills, description")
    .eq("id", positionId)
    .single();

  if (error || !position) return null;

  return position;
});

/**
 * Cached function to fetch all quizzes for a position
 */
export const getQuizzesForPosition = cache(async (positionId: string) => {
  const supabase = await createClient();

  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select("id, title, created_at, time_limit")
    .eq("position_id", positionId)
    .order("created_at", { ascending: false });

  if (error) return [];

  return quizzes || [];
});
