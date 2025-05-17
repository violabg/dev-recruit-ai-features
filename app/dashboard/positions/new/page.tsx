import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

import { NewPositionForm } from "@/components/new-position-form"

// Server component for new position page
export default async function NewPositionPage() {
  const cookieStore = cookies()
  const supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  // Get the current user to verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuova Posizione</h1>
        <p className="text-muted-foreground">Crea una nuova posizione per iniziare a cercare candidati</p>
      </div>

      <div className="max-w-2xl">
        <NewPositionForm />
      </div>
    </div>
  )
}
