import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function middleware(request: NextRequest) {
  // Check if the request is for a protected route
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // Get the auth cookies
    const accessToken = request.cookies.get("sb-access-token")?.value
    const refreshToken = request.cookies.get("sb-refresh-token")?.value

    // If no auth cookies, redirect to login
    if (!accessToken && !refreshToken) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("error", "unauthenticated")
      return NextResponse.redirect(loginUrl)
    }

    // If we have an access token, verify it
    if (accessToken) {
      try {
        // Initialize Supabase
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })

        // Verify the token
        const { data, error } = await supabase.auth.getUser(accessToken)

        if (error || !data.user) {
          // Token is invalid, redirect to login
          const loginUrl = new URL("/login", request.url)
          loginUrl.searchParams.set("error", "session_expired")
          return NextResponse.redirect(loginUrl)
        }

        // Token is valid, continue
        return NextResponse.next()
      } catch (error) {
        console.error("Error in middleware:", error)
        // Error verifying token, redirect to login
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("error", "auth_error")
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  // Continue for non-protected routes or valid auth
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
