"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";

// Candidate actions
export async function createCandidate(formData: FormData) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const positionId = formData.get("position_id") as string;

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      name,
      email,
      position_id: positionId,
      status: "pending",
      created_by: user.id,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/positions/${positionId}`);
  revalidatePath("/dashboard/candidates");

  if (data && data[0]) {
    return { success: true, candidateId: data[0].id };
  } else {
    throw new Error("Failed to create candidate");
  }
}

// Delete candidate
export async function deleteCandidate(id: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  // First, check if the candidate belongs to the user
  const { data: candidate, error: fetchError } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .eq("created_by", user.id)
    .single();

  if (fetchError || !candidate) {
    throw new Error("Candidate not found or you don't have permission");
  }

  // Delete the candidate
  const { error } = await supabase.from("candidates").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/candidates");
  if (candidate.position_id) {
    revalidatePath(`/dashboard/positions/${candidate.position_id}`);
  }

  return { success: true };
}
