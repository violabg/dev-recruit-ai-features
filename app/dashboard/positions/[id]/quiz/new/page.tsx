import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { BrainCircuit } from "lucide-react";
import { redirect } from "next/navigation";
import { QuizForm } from "./QuizForm";

export default async function GenerateQuizPage({
  params: incomingParams,
}: {
  params: { id: string };
}) {
  // await new Promise((resolve) => setTimeout(resolve, 10000));
  const { id } = await incomingParams;
  const supabase = await createClient();

  const { data: position, error } = await supabase
    .from("positions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !position) {
    redirect("/dashboard/positions");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Genera Quiz AI</h1>
        <p className="text-muted-foreground">
          Crea un quiz personalizzato per la posizione {position.title}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <QuizForm position={position} />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <span>Informazioni sulla posizione</span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="font-medium">Titolo:</span> {position.title}
                </div>
                <div>
                  <span className="font-medium">Livello:</span>{" "}
                  {position.experience_level}
                </div>
                <div>
                  <span className="font-medium">Competenze:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {position.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {position.description && (
                  <div>
                    <span className="font-medium">Descrizione:</span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {position.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-md bg-muted p-4">
                <h3 className="font-medium">Come funziona la generazione AI</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center">
                      1
                    </span>
                    <span>
                      L&apos;AI analizza le competenze e il livello richiesti
                      per la posizione
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center">
                      2
                    </span>
                    <span>
                      Genera domande pertinenti in base ai parametri selezionati
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center">
                      3
                    </span>
                    <span>
                      Crea un mix bilanciato di domande teoriche, pratiche e
                      sfide di codice
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center">
                      4
                    </span>
                    <span>
                      Puoi modificare il quiz generato prima di inviarlo ai
                      candidati
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
