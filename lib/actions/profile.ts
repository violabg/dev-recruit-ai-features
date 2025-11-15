"use server";

import { requireUser } from "@/lib/auth-server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Profile = {
  id: string;
  name?: string | null;
  full_name: string | null;
  user_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string;
};

export async function getProfile(): Promise<{
  profile: Profile | null;
  user: any | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const user = await requireUser();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      return { profile: null, user, error: profileError.message };
    }

    return { profile, user };
  } catch (error) {
    return {
      profile: null,
      user: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClient();
    const user = await requireUser();

    const full_name = formData.get("full_name") as string;
    const user_name = formData.get("user_name") as string;

    // Update profile in database
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name,
        user_name,
        name: full_name, // Keep name in sync with full_name
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      throw new Error(profileError.message);
    }

    // Update auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name,
        user_name,
        name: full_name,
      },
    });

    if (authError) {
      console.warn("Failed to update auth metadata:", authError.message);
    }

    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to update profile"
    );
  }
}

export async function updatePassword(formData: FormData) {
  try {
    const supabase = await createClient();
    const user = await requireUser();

    const currentPassword = formData.get("current_password") as string;
    const newPassword = formData.get("new_password") as string;

    // First verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (verifyError) {
      throw new Error("Current password is incorrect");
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { success: true };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to update password"
    );
  }
}
