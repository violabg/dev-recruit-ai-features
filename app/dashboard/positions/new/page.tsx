import { NewPositionForm } from "@/components/positions/new-position-form";
import type { Database } from "@/lib/database.types";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Server component for new position page
export default async function NewPositionPage() {
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

  if (!user) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-lg font-medium">Accesso richiesto</p>
        <p className="text-sm text-muted-foreground mt-2">
          Effettua l'accesso per creare una nuova posizione
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuova Posizione</h1>
        <p className="text-muted-foreground">
          Crea una nuova posizione per iniziare a cercare candidati
        </p>
      </div>

      <div className="max-w-2xl">
        {/* Try to render the original form with error handling */}
        <div className="border rounded-md p-6">
          <h2 className="text-xl font-semibold mb-4">Crea posizione</h2>
          <NewPositionForm />
        </div>
      </div>
    </div>
  );
}
