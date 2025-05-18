"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";

// Position actions
export async function createPosition(formData: FormData) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const experienceLevel = formData.get("experience_level") as string;
  const skills = JSON.parse(formData.get("skills") as string);
  const softSkills = JSON.parse(
    (formData.get("soft_skills") as string) || "[]"
  );
  const contractType = formData.get("contract_type") as string;

  const { data, error } = await supabase
    .from("positions")
    .insert({
      title,
      description,
      experience_level: experienceLevel,
      skills,
      soft_skills: softSkills,
      contract_type: contractType,
      created_by: user.id,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/positions");

  if (data && data[0]) {
    redirect(`/dashboard/positions/${data[0].id}`);
  } else {
    redirect("/dashboard/positions");
  }
}

export async function deletePosition(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("positions").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/positions");
  redirect("/dashboard/positions");
}
