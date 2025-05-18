"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabase } from "@/lib/supabase/supabase-provider";
import { ArrowLeft, Clock, Edit, Loader2, Send, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  position_id: string;
  questions: any[];
  time_limit: number | null;
  created_at: string;
  created_by: string;
}

interface Position {
  id: string;
  title: string;
  experience_level: string;
}

export default function QuizDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchQuizData() {
      if (!supabase || !user) return;

      try {
        setLoading(true);

        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", params.id)
          .single();

        if (quizError) throw quizError;
        if (!quizData) throw new Error("Quiz non trovato");

        setQuiz(quizData);

        // Fetch position details
        const { data: positionData, error: positionError } = await supabase
          .from("positions")
          .select("id, title, experience_level")
          .eq("id", quizData.position_id)
          .single();

        if (positionError) throw positionError;
        setPosition(positionData);
      } catch (error: any) {
        toast.error("Errore", {
          description: error.message || "Impossibile caricare i dati del quiz",
        });
        router.push("/dashboard/quizzes");
      } finally {
        setLoading(false);
      }
    }

    fetchQuizData();
  }, [supabase, user, params.id, router]);

  const handleDelete = async () => {
    if (!supabase || !quiz) return;

    try {
      setDeleting(true);

      // Delete the quiz
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quiz.id);

      if (error) throw error;

      toast.success("Quiz eliminato", {
        description: "Il quiz è stato eliminato con successo",
      });

      router.push("/dashboard/quizzes");
    } catch (error: any) {
      toast.error("Errore", {
        description:
          error.message || "Si è verificato un errore durante l'eliminazione",
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!quiz || !position) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-lg font-medium">Quiz non trovato</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/quizzes">Torna ai quiz</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/positions/${position.id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Torna alla posizione
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{position.title}</Badge>
            <Badge variant="outline">{position.experience_level}</Badge>
            {quiz.time_limit && (
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                {quiz.time_limit} minuti
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Creato il {formatDate(quiz.created_at)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/quizzes/${quiz.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifica
            </Link>
          </Button>
          <Button variant="default" asChild>
            <Link href={`/dashboard/quizzes/${quiz.id}/invite`}>
              <Send className="mr-2 h-4 w-4" />
              Invia a candidati
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Elimina
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione non può essere annullata. Il quiz verrà
                  eliminato permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminazione...
                    </>
                  ) : (
                    "Elimina"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Domande</TabsTrigger>
          <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          <TabsTrigger value="results">Risultati</TabsTrigger>
        </TabsList>
        <TabsContent value="questions" className="space-y-4 pt-4">
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Badge
                      variant="outline"
                      className="h-6 w-6 rounded-full p-0 flex items-center justify-center"
                    >
                      {index + 1}
                    </Badge>
                    <span>
                      {question.type === "multiple_choice"
                        ? "Risposta multipla"
                        : question.type === "open_question"
                        ? "Domanda aperta"
                        : "Snippet di codice"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Domanda:</h3>
                    <p className="mt-1">{question.question}</p>
                  </div>

                  {question.type === "multiple_choice" && (
                    <div>
                      <h3 className="font-medium">Opzioni:</h3>
                      <div className="mt-2 space-y-2">
                        {question.options.map(
                          (option: string, optIndex: number) => (
                            <div
                              key={optIndex}
                              className={`flex items-center gap-2 rounded-md border p-2 ${
                                Number.parseInt(question.correctAnswer) ===
                                optIndex
                                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                  : ""
                              }`}
                            >
                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                  Number.parseInt(question.correctAnswer) ===
                                  optIndex
                                    ? "border-green-500 bg-green-500 text-white"
                                    : ""
                                }`}
                              >
                                {Number.parseInt(question.correctAnswer) ===
                                  optIndex && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-3 w-3"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                              <span>{option}</span>
                            </div>
                          )
                        )}
                      </div>
                      {question.explanation && (
                        <div className="mt-2">
                          <h3 className="font-medium">Spiegazione:</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {question.type === "open_question" && (
                    <div>
                      <h3 className="font-medium">Risposta di esempio:</h3>
                      <p className="mt-1 text-sm">{question.sampleAnswer}</p>
                      {question.keywords && question.keywords.length > 0 && (
                        <div className="mt-2">
                          <h3 className="font-medium">Parole chiave:</h3>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {question.keywords.map(
                              (keyword: string, kwIndex: number) => (
                                <Badge key={kwIndex} variant="secondary">
                                  {keyword}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {question.type === "code_snippet" && (
                    <div className="space-y-3">
                      {question.codeSnippet && (
                        <div>
                          <h3 className="font-medium">Snippet di codice:</h3>
                          <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 text-sm">
                            <code>{question.codeSnippet}</code>
                          </pre>
                        </div>
                      )}
                      {question.sampleSolution && (
                        <div>
                          <h3 className="font-medium">Soluzione di esempio:</h3>
                          <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 text-sm">
                            <code>{question.sampleSolution}</code>
                          </pre>
                        </div>
                      )}
                      {question.testCases && question.testCases.length > 0 && (
                        <div>
                          <h3 className="font-medium">Test case:</h3>
                          <div className="mt-1 space-y-2">
                            {question.testCases.map(
                              (testCase: any, tcIndex: number) => (
                                <div
                                  key={tcIndex}
                                  className="rounded-md border p-2 text-sm"
                                >
                                  <div>
                                    <span className="font-medium">Input:</span>{" "}
                                    {testCase.input}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Output atteso:
                                    </span>{" "}
                                    {testCase.expectedOutput}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="settings" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni del quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium">Titolo</h3>
                  <p className="text-sm text-muted-foreground">{quiz.title}</p>
                </div>
                <div>
                  <h3 className="font-medium">Limite di tempo</h3>
                  <p className="text-sm text-muted-foreground">
                    {quiz.time_limit
                      ? `${quiz.time_limit} minuti`
                      : "Nessun limite"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Numero di domande</h3>
                  <p className="text-sm text-muted-foreground">
                    {quiz.questions.length}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Posizione</h3>
                  <p className="text-sm text-muted-foreground">
                    {position.title} ({position.experience_level})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="results" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Risultati</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Nessun candidato ha ancora completato questo quiz
                  </p>
                  <Button className="mt-2" size="sm" asChild>
                    <Link href={`/dashboard/quizzes/${quiz.id}/invite`}>
                      <Send className="mr-2 h-4 w-4" />
                      Invia a candidati
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
