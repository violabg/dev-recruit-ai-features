import { InterviewMonitor } from "@/components/interview/interview-monitor";
import { InterviewResults } from "@/components/interview/interview-results";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Calculate duration helper
function calculateDuration(startDate: string | null, endDate: string | null) {
  if (!startDate) return "N/A";
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const durationMs = end.getTime() - start.getTime();
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = await params;
  const supabase = await createClient();

  // Fetch interview details
  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("*")
    .eq("id", unwrappedParams.id)
    .single();

  if (interviewError || !interview) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-lg font-medium">Intervista non trovata</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/quizzes">Torna ai quiz</Link>
        </Button>
      </div>
    );
  }

  // Fetch quiz details
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select(
      `
      id, 
      title, 
      questions,
      time_limit,
      position:positions(title)
      `
    )
    .eq("id", interview.quiz_id)
    .single();

  if (quizError || !quiz) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-lg font-medium">Quiz non trovato</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/quizzes">Torna ai quiz</Link>
        </Button>
      </div>
    );
  }

  // Fetch candidate details
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, name, email")
    .eq("id", interview.candidate_id)
    .single();

  if (candidateError || !candidate) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-lg font-medium">Candidato non trovato</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/quizzes">Torna ai quiz</Link>
        </Button>
      </div>
    );
  }

  // Set active tab based on interview status
  const activeTab = interview.status === "completed" ? "results" : "monitor";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/quizzes/${quiz.id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Torna al quiz
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Intervista: {quiz.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{quiz.position.title}</Badge>
            <Badge
              variant={
                interview.status === "pending"
                  ? "outline"
                  : interview.status === "completed"
                  ? "default"
                  : interview.status === "in_progress"
                  ? "secondary"
                  : "outline"
              }
            >
              {interview.status === "pending"
                ? "In attesa"
                : interview.status === "completed"
                ? "Completato"
                : interview.status === "in_progress"
                ? "In corso"
                : interview.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Candidato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div>
                <div className="font-medium">{candidate.name}</div>
                <div className="text-sm text-muted-foreground">
                  {candidate.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Inizio:</span>
                <span>{formatDate(interview.started_at, true)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fine:</span>
                <span>{formatDate(interview.completed_at, true)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Durata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span>
                {calculateDuration(
                  interview.started_at,
                  interview.completed_at
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="monitor">Monitoraggio</TabsTrigger>
          <TabsTrigger
            value="results"
            disabled={interview.status !== "completed"}
          >
            Risultati
          </TabsTrigger>
        </TabsList>
        <TabsContent value="monitor" className="space-y-4 pt-4">
          <InterviewMonitor
            interviewId={interview.id}
            quizQuestions={quiz.questions}
            answers={interview.answers || {}}
            status={interview.status}
          />
        </TabsContent>
        <TabsContent value="results" className="space-y-4 pt-4">
          {interview.status === "completed" ? (
            <InterviewResults
              interviewId={interview.id}
              quizQuestions={quiz.questions}
              answers={interview.answers || {}}
              candidateName={candidate.name}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Risultati non disponibili</CardTitle>
                <CardDescription>
                  L&apos;intervista non è ancora stata completata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  I risultati saranno disponibili una volta che il candidato
                  avrà completato il quiz.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
