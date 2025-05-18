import { NewPositionForm } from "@/components/positions/new-position-form";
import { createClient } from "@/lib/supabase/server";

// Server component for new position page
export default async function NewPositionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("🚀 ~ NewPositionPage ~ user:", user);

  if (!user) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-lg font-medium">Accesso richiesto</p>
        <p className="text-sm text-muted-foreground mt-2">
          Effettua l&apos;accesso per creare una nuova posizione
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
