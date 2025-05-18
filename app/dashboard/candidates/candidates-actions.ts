import { createClient } from "@/lib/supabase/server";

type FetchCandidatesParams = {
  search: string;
  status: string;
  positionId: string;
  sort: string;
};

export async function fetchCandidatesData({
  search,
  status,
  positionId,
  sort,
}: FetchCandidatesParams) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      candidates: [],
      positions: [],
      statusCounts: [],
      totalCandidates: 0,
    };
  }

  // Build the query
  let query = supabase
    .from("candidates")
    .select(
      `
      *,
      positions (
        id,
        title,
        experience_level
      ),
      interviews (
        id,
        status,
        score,
        created_at
      )
    `
    )
    .eq("created_by", user.id);

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Apply status filter
  if (status !== "all") {
    query = query.eq("status", status);
  }

  // Apply position filter
  if (positionId !== "all") {
    query = query.eq("position_id", positionId);
  }

  // Apply sorting
  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else if (sort === "status") {
    query = query.order("status", { ascending: true });
  }

  // Execute the query
  const { data: candidates } = await query;

  // Get all positions for the filter dropdown
  const { data: positions } = await supabase
    .from("positions")
    .select("id, title")
    .eq("created_by", user.id)
    .order("title", { ascending: true });

  // Get candidate count by status
  const { data: statusCounts } = await supabase.rpc(
    "count_candidates_by_status",
    {
      user_id: user.id,
    }
  );

  // Calculate total candidates
  const totalCandidates =
    statusCounts?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0;

  return {
    user,
    candidates,
    positions,
    statusCounts,
    totalCandidates,
  };
}
