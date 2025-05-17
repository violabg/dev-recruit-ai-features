import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardHeader } from "@/components/dashboard-header"
import type { Database } from "@/lib/database.types"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side authentication check
  const cookieStore = cookies()

  // Check for auth cookies directly
  const accessToken = cookieStore.get("sb-access-token")?.value
  const refreshToken = cookieStore.get("sb-refresh-token")?.value

  // If no auth cookies, redirect to login
  if (!accessToken && !refreshToken) {
    redirect("/login?error=unauthenticated")
  }

  // Initialize Supabase with the tokens if available
  const supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  // If we have tokens, try to get the session
  if (accessToken) {
    try {
      // Set the auth cookie in the client
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "",
      })

      // Get the user to verify the session is valid
      const { data, error } = await supabase.auth.getUser(accessToken)

      if (error || !data.user) {
        console.error("Auth error in dashboard layout:", error)
        redirect("/login?error=session_expired")
      }
    } catch (error) {
      console.error("Error verifying session:", error)
      redirect("/login?error=auth_error")
    }
  } else {
    redirect("/login?error=no_session")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
