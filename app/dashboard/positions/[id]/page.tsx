import { DeletePositionButton } from "@/components/positions/delete-position-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { BrainCircuit, Edit, Plus, Users } from "lucide-react";
import Link from "next/link";

export default async function PositionDetailPage({
  params: incomingParams, // Renamed to avoid confusion
}: {
  params: { id: string };
}) {
  const params = await incomingParams; // Await the params object

  const supabase = await createClient();
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

  // Fetch quizzes for this position
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .eq("position_id", params.id)
    .order("created_at", { ascending: false });

  // Fetch candidates for this position
  const { data: candidates } = await supabase
    .from("candidates")
    .select("*")
    .eq("position_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-3xl">{position.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{position.experience_level}</Badge>
            {position.contract_type && (
              <Badge variant="outline">{position.contract_type}</Badge>
            )}
            <span className="text-muted-foreground text-sm">
              Creata il {formatDate(position.created_at)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/positions/${position.id}/edit`}>
              <Edit className="mr-2 w-4 h-4" />
              Modifica
            </Link>
          </Button>
          <DeletePositionButton id={position.id} />
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Dettagli</TabsTrigger>
          <TabsTrigger value="quizzes">Quiz</TabsTrigger>
          <TabsTrigger value="candidates">Candidati</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4 pt-4">
          <div className="gap-4 grid md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Descrizione</CardTitle>
              </CardHeader>
              <CardContent>
                {position.description ? (
                  <p className="whitespace-pre-line">{position.description}</p>
                ) : (
                  <p className="text-muted-foreground">
                    Nessuna descrizione disponibile
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Competenze tecniche</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {position.skills.map((skill, index) => (
                      <Badge key={index}>{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {position.soft_skills && position.soft_skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Soft skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {position.soft_skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4 pt-4">
          <div className="flex justify-between">
            <h2 className="font-semibold text-xl">Quiz</h2>
            <Button asChild>
              <Link href={`/dashboard/positions/${position.id}/quiz/new`}>
                <BrainCircuit className="mr-2 w-4 h-4" />
                Genera Quiz AI
              </Link>
            </Button>
          </div>

          {quizzes && quizzes.length > 0 ? (
            <div className="gap-4 grid md:grid-cols-2">
              {quizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {Object.keys(quiz.questions).length} domande
                        </span>
                        <span className="text-muted-foreground">
                          {quiz.time_limit
                            ? `${quiz.time_limit} minuti`
                            : "Nessun limite di tempo"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/quizzes/${quiz.id}`}>
                            Visualizza
                          </Link>
                        </Button>
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/dashboard/quizzes/${quiz.id}/invite`}>
                            Associa candidati
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center border border-dashed rounded-lg h-[200px]">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Nessun quiz creato per questa posizione
                </p>
                <Button className="mt-2" size="sm" asChild>
                  <Link href={`/dashboard/positions/${position.id}/quiz/new`}>
                    <BrainCircuit className="mr-2 w-4 h-4" />
                    Genera Quiz AI
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="candidates" className="space-y-4 pt-4">
          <div className="flex justify-between">
            <h2 className="font-semibold text-xl">Candidati</h2>
            <Button asChild>
              <Link
                href={`/dashboard/candidates/new?positionId=${position.id}`}
              >
                <Plus className="mr-2 w-4 h-4" />
                Aggiungi Candidato
              </Link>
            </Button>
          </div>

          {candidates && candidates.length > 0 ? (
            <div className="gap-4 grid md:grid-cols-2">
              {candidates.map((candidate) => (
                <Card key={candidate.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{candidate.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {candidate.email}
                        </span>
                        <Badge
                          variant={
                            candidate.status === "pending"
                              ? "outline"
                              : candidate.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {candidate.status === "pending"
                            ? "In attesa"
                            : candidate.status === "completed"
                            ? "Completato"
                            : candidate.status === "invited"
                            ? "Invitato"
                            : candidate.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/candidates/${candidate.id}`}>
                            Dettagli
                          </Link>
                        </Button>
                        <Button variant="secondary" size="sm" asChild>
                          <Link
                            href={`/dashboard/candidates/${candidate.id}/quiz`}
                          >
                            Associa quiz
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center border border-dashed rounded-lg h-[200px]">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Nessun candidato aggiunto per questa posizione
                </p>
                <Button className="mt-2" size="sm" asChild>
                  <Link
                    href={`/dashboard/candidates/new?positionId=${position.id}`}
                  >
                    <Users className="mr-2 w-4 h-4" />
                    Aggiungi candidato
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
