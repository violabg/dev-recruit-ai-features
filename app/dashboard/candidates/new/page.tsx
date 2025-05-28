import { CandidateNewForm } from "@/components/candidates/candidate-new-form";
import { createClient } from "@/lib/supabase/server";

type NewCandidatePageProps = {
  searchParams: Promise<{ positionId?: string }>;
};

export default async function NewCandidatePage({
  searchParams,
}: NewCandidatePageProps) {
  const params = await searchParams;
  const positionId = params.positionId;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center h-[400px]">
        <p className="font-medium text-lg">Accesso richiesto</p>
        <p className="mt-2 text-muted-foreground text-sm">
          Effettua l&apos;accesso per aggiungere un candidato
        </p>
      </div>
    );
  }

  // Fetch positions for the select
  const { data: positions } = await supabase
    .from("positions")
    .select("id, title")
    .eq("created_by", user.id)
    .order("title", { ascending: true });

  // Validate that the positionId exists if provided
  const validPositionId =
    positionId && positions?.some((p) => p.id === positionId)
      ? positionId
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl">Nuovo Candidato</h1>
        <p className="text-muted-foreground">
          Inserisci i dati del candidato da aggiungere
        </p>
      </div>
      <div className="max-w-xl">
        <div className="p-6 border rounded-md">
          <h2 className="mb-4 font-semibold text-xl">Crea candidato</h2>
          <CandidateNewForm
            positions={positions || []}
            defaultPositionId={validPositionId}
          />
        </div>
      </div>
    </div>
  );
}
