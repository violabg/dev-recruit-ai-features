"use client"

import { BrainCircuit } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function SupabaseFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <span>DevRecruit AI</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold">Configuration Required</h1>

        <div className="rounded-md bg-amber-50 p-4 text-left text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          <h3 className="text-lg font-medium">Missing Supabase Credentials</h3>
          <p className="mt-2 text-sm">
            This application requires Supabase credentials to function properly. Please make sure the following
            environment variables are set:
          </p>
          <ul className="mt-2 space-y-1 text-sm font-mono">
            <li>• NEXT_PUBLIC_SUPABASE_URL</li>
            <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            If you're running this application locally, make sure to create a{" "}
            <code className="rounded bg-muted px-1 py-0.5">.env.local</code> file with these variables.
          </p>
          <p className="text-sm text-muted-foreground">
            If you're deploying to Vercel, add these environment variables in your project settings.
          </p>
        </div>

        <div className="pt-4">
          <Button asChild>
            <Link
              href="https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supabase Setup Guide
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
