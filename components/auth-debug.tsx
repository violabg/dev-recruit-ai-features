"use client"

import { useState } from "react"
import { useSupabase } from "./supabase-provider"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

export function AuthDebug() {
  const { user, supabase, refreshSession } = useSupabase()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkSession = async () => {
    if (!supabase) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Error checking session:", error)
        setSessionInfo({ error: error.message })
      } else {
        setSessionInfo(data)
      }
    } catch (error) {
      console.error("Error in checkSession:", error)
      setSessionInfo({ error: "Failed to check session" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    await refreshSession()
    setIsLoading(false)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
        <CardDescription>Check your authentication status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">User Status:</h3>
          <pre className="mt-2 rounded bg-muted p-4 text-sm">
            {user ? JSON.stringify({ email: user.email, id: user.id }, null, 2) : "Not logged in"}
          </pre>
        </div>

        <div className="flex gap-2">
          <Button onClick={checkSession} disabled={isLoading}>
            {isLoading ? "Checking..." : "Check Session"}
          </Button>
          <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
            {isLoading ? "Refreshing..." : "Refresh Session"}
          </Button>
        </div>

        {sessionInfo && (
          <div>
            <h3 className="font-medium">Session Info:</h3>
            <pre className="mt-2 rounded bg-muted p-4 text-sm">{JSON.stringify(sessionInfo, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
