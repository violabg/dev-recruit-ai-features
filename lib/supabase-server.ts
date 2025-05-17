import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Create a Supabase client for server actions
export const getSupabaseServer = () => {
  const cookieStore = cookies()
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_ANON_KEY!

  return createClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}
