import type { Database } from "@/lib/database.types";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Debug component for new position page
export default async function NewPositionPageDebug() {
  const cookieStore = cookies();
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Get the current user to verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Debug Page</h1>
        <p className="text-muted-foreground">
          This is a debug page to help identify issues
        </p>
      </div>

      <div className="max-w-2xl border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Authentication Status:</h2>
        <pre className="bg-muted p-2 rounded overflow-auto">
          {JSON.stringify(
            { isAuthenticated: !!user, userId: user?.id },
            null,
            2
          )}
        </pre>
      </div>

      <div className="max-w-2xl">
        <p>
          If you see this page, the server component is rendering correctly.
        </p>
        <p className="mt-2">
          The issue might be with the <code>NewPositionForm</code> component or
          its dependencies.
        </p>
      </div>
    </div>
  );
}
