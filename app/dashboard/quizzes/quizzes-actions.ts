import { Question } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

type Position = {
  id: string;
  title: string;
  experience_level: string;
};

export type Quiz = {
  id: string;
  title: string;
  created_at: string;
  position_id: string;
  positions: Position | null;
  time_limit: number | null;
  questions: Question[];
};

export async function fetchQuizzesData({
  search,
  sort,
  filter,
}: {
  search: string;
  sort: string;
  filter: string;
}) {
  const supabase = await createClient();

  let quizzes: Quiz[] = [];
  let fetchError: string | null = null;
  let uniqueLevels: string[] = [];
  let positionCounts: any[] = [];

  try {
    // Build the quiz query
    let quizQueryBuilder = supabase.from("quizzes").select(`
      *,
      positions:position_id (
        id,
        title,
        experience_level
      )
    `);

    // Apply search if provided
    if (search) {
      quizQueryBuilder = quizQueryBuilder.ilike("title", `%${search}%`);
    }

    // Apply filter if provided
    if (filter !== "all") {
      const { data: positionIdsData, error: positionError } = await supabase
        .from("positions")
        .select("id")
        .eq("experience_level", filter);

      if (positionError)
        throw new Error(
          `Failed to fetch positions for filter: ${positionError.message}`
        );

      if (positionIdsData && positionIdsData.length > 0) {
        const ids = positionIdsData.map((p) => p.id);
        quizQueryBuilder = quizQueryBuilder.in("position_id", ids);
      } else {
        quizQueryBuilder = quizQueryBuilder.in("position_id", []);
      }
    }

    // Apply sorting
    if (sort === "newest") {
      quizQueryBuilder = quizQueryBuilder.order("created_at", {
        ascending: false,
      });
    } else if (sort === "oldest") {
      quizQueryBuilder = quizQueryBuilder.order("created_at", {
        ascending: true,
      });
    } else if (sort === "a-z") {
      quizQueryBuilder = quizQueryBuilder.order("title", {
        ascending: true,
      });
    } else if (sort === "z-a") {
      quizQueryBuilder = quizQueryBuilder.order("title", {
        ascending: false,
      });
    }

    // Execute the quiz query
    const { data: fetchedQuizzes, error: quizzesError } =
      await quizQueryBuilder;
    if (quizzesError)
      throw new Error(`Failed to fetch quizzes: ${quizzesError.message}`);
    quizzes = fetchedQuizzes as Quiz[];

    // Get all unique experience levels for the filter
    const { data: experienceLevelsData, error: levelsError } = await supabase
      .from("positions")
      .select("experience_level")
      .not("experience_level", "is", null);

    if (levelsError)
      throw new Error(
        `Failed to fetch experience levels: ${levelsError.message}`
      );
    uniqueLevels = experienceLevelsData
      ? [
          ...new Set(
            experienceLevelsData.map((p) => p.experience_level as string)
          ),
        ]
      : [];

    // Count quizzes by position
    const { data: countsData, error: countsError } = await supabase.rpc(
      "count_quizzes_by_position"
    );
    if (countsError)
      throw new Error(
        `Failed to count quizzes by position: ${countsError.message}`
      );
    positionCounts = countsData;
  } catch (e: any) {
    fetchError = e.message || "An unexpected error occurred.";
    quizzes = [];
    uniqueLevels = [];
    positionCounts = [];
  }

  return {
    quizzes,
    fetchError,
    uniqueLevels,
    positionCounts,
  };
}
