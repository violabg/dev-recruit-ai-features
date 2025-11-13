import { DeletePositionButton } from "@/components/positions/delete-position-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Edit } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import Candidates from "./components/candidates";
import Quizes from "./components/quizes";

export default async function PositionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div>Loading...</div>}>
        <PositionDetail params={params} />
      </Suspense>
    </div>
  );
}

async function PositionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Await the params object

  const supabase = await createClient();
  // Fetch position details
  const { data: position, error: positionError } = await supabase
    .from("positions")
    .select("*")
    .eq("id", id)
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
          <Suspense fallback={<div>Loading...</div>}>
            <Quizes id={position.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="candidates" className="space-y-4 pt-4">
          <Suspense fallback={<div>Loading...</div>}>
            <Candidates id={position.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
