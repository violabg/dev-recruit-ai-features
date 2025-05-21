import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
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
          <div className="space-y-8">
            <Skeleton className="h-10 w-80 mb-2" />
            <div className="space-y-8">
              {/* Titolo della posizione */}
              <div>
                <Skeleton className="h-5 w-64 mb-2" />
                <Skeleton className="h-12 w-full" />
              </div>
              {/* Descrizione */}
              <div>
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-24 w-full" />
              </div>
              {/* Livello di esperienza */}
              <div>
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-10 w-56" />
              </div>
              {/* Competenze tecniche */}
              <div>
                <Skeleton className="h-5 w-56 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              {/* Soft skills */}
              <div>
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              {/* Tipo di contratto */}
              <div>
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-10 w-56" />
              </div>
              {/* Bottoni */}
              <div className="flex gap-4 mt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-36" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
