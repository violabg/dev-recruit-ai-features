"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { useToast } from "@/components/ui/use-toast"
import type { Database } from "@/lib/database.types"
import { SupabaseFallback } from "@/components/supabase-fallback"

type SupabaseContext = {
  supabase: SupabaseClient<Database> | null
  user: any
  loading: boolean
}

const SupabaseContext = createContext<SupabaseContext>({
  supabase: null,
  user: null,
  loading: true,
})

export const useSupabase = () => useContext(SupabaseContext)

export const SupabaseProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  // Add a state to track if credentials are missing
  const [credentialsMissing, setCredentialsMissing] = useState(false)

  // Update the useEffect block to set this state
  useEffect(() => {
    // Get environment variables with fallbacks for development
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Supabase credentials missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
      )
      setCredentialsMissing(true)
      setLoading(false)
      return
    }

    const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey)
    setSupabase(supabaseClient)

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [toast])

  // Update the return statement to show the fallback when credentials are missing
  return (
    <SupabaseContext.Provider value={{ supabase, user, loading }}>
      {credentialsMissing ? <SupabaseFallback /> : children}
    </SupabaseContext.Provider>
  )
}
