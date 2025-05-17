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
  const supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // If no session, redirect to login
    redirect("/login?error=unauthenticated")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <DashboardNav />
        </aside>
        <main className="flex w-full flex-col overflow-hidden p-4 md:py-8">{children}</main>
      </div>
    </div>
  )
}
