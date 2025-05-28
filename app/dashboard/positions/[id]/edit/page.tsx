import { EditPositionForm } from "@/components/positions/edit-position-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditPositionPage({
  params: incomingParams,
}: {
  params: { id: string };
}) {
  const params = await incomingParams;

  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center h-[400px]">
        <p className="font-medium text-lg">Accesso richiesto</p>
        <p className="mt-2 text-muted-foreground text-sm">
          Effettua l&apos;accesso per modificare questa posizione
        </p>
      </div>
    );
  }

  // Fetch position details
  const { data: position, error: positionError } = await supabase
    .from("positions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (positionError || !position) {
    return (
      <div className="flex flex-col justify-center items-center h-[400px]">
        <p className="font-medium text-lg">Posizione non trovata</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/positions">Torna alle posizioni</Link>
        </Button>
      </div>
    );
  }

  // Check if user owns this position
  if (position.created_by !== user.id) {
    return (
      <div className="flex flex-col justify-center items-center h-[400px]">
        <p className="font-medium text-lg">Non autorizzato</p>
        <p className="mt-2 text-muted-foreground text-sm">
          Non hai i permessi per modificare questa posizione
        </p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/positions">Torna alle posizioni</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/positions/${params.id}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-bold text-3xl">Modifica Posizione</h1>
          <p className="text-muted-foreground">
            Modifica i dettagli della posizione &ldquo;{position.title}&rdquo;
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="p-6 border rounded-md">
          <h2 className="mb-4 font-semibold text-xl">Dettagli posizione</h2>
          <EditPositionForm position={position} />
        </div>
      </div>
    </div>
  );
}
