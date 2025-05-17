"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSupabaseServer } from "../supabase-server"

// Authentication actions
export async function signIn(formData: FormData) {
  const supabase = getSupabaseServer()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Set cookies directly to ensure they're available immediately
  const cookieStore = cookies()
  if (data.session) {
    // Set auth cookie with the session token
    cookieStore.set("sb-access-token", data.session.access_token, {
      path: "/",
      maxAge: data.session.expires_in,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })

    cookieStore.set("sb-refresh-token", data.session.refresh_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })
  }

  // Return success without redirect to handle it client-side
  return { success: true }
}

export async function signUp(formData: FormData) {
  const supabase = getSupabaseServer()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const company = formData.get("company") as string

  // Register the user
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company,
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (data.user) {
    // Create profile record
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: data.user.id,
      full_name: fullName,
      company,
      role: "recruiter", // Default role for new users
    })

    if (profileError) {
      return { error: profileError.message }
    }
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function signOut() {
  const supabase = getSupabaseServer()

  await supabase.auth.signOut()

  revalidatePath("/")
  redirect("/")
}
