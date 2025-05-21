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
import { deleteQuiz } from "@/lib/actions/quizzes";
import { createClient } from "@/lib/supabase/server";
import { formatDate, prismLanguage } from "@/lib/utils";
import { ArrowLeft, Clock, Edit, Send, Trash } from "lucide-react";
import Link from "next/link";
import { Highlight, themes } from "prism-react-renderer";

type Quiz = {
  id: string;
  title: string;
  position_id: string;
  questions: any[];
  time_limit: number | null;
  created_at: string;
  created_by: string;
};

type Position = {
  id: string;
  title: string;
  experience_level: string;
};

export default async function QuizDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await Promise.resolve(params);
  const supabase = await createClient();

  // Fetch quiz details
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .single<Quiz>();

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

  // Fetch position details
  const { data: position, error: positionError } = await supabase
    .from("positions")
    .select("id, title, experience_level")
    .eq("id", quiz.position_id)
    .single<Position>();

  if (positionError || !position) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-lg font-medium">Posizione non trovata</p>
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
          {/* Delete button uses server action */}
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
                <form action={deleteQuiz}>
                  <input type="hidden" name="quiz_id" value={quiz.id} />
                  <AlertDialogAction
                    type="submit"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Elimina
                  </AlertDialogAction>
                </form>
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
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium">Domanda:</h3>
                    <p className="mt-1">{question.question}</p>
                  </div>

                  {question.type === "multiple_choice" && (
                    <div className="flex flex-col gap-2">
                      <h3 className="font-medium">Opzioni:</h3>
                      <div className="flex flex-col gap-4 mt-2">
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
                        <div className="flex flex-col gap-2 mt-2">
                          <h3 className="font-medium">Spiegazione:</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {question.type === "open_question" && (
                    <div className="flex flex-col gap-2">
                      <h3 className="font-medium">Risposta di esempio:</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {question.explanation}
                      </p>
                      {question.keywords && question.keywords.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
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
                        <div className="flex flex-col gap-2">
                          <h3 className="font-medium">Snippet di codice:</h3>
                          <Highlight
                            theme={themes.vsDark}
                            code={question.codeSnippet}
                            language={prismLanguage(question.language)}
                          >
                            {({
                              className,
                              style,
                              tokens,
                              getLineProps,
                              getTokenProps,
                            }) => (
                              <pre
                                className={
                                  "mt-1 overflow-x-auto rounded-md bg-muted p-4 text-sm" +
                                  className
                                }
                                style={style}
                              >
                                <code>
                                  {tokens.map((line, i) => {
                                    const { key: lineKey, ...lineProps } =
                                      getLineProps({
                                        line,
                                        key: i,
                                      });
                                    return (
                                      <div key={String(lineKey)} {...lineProps}>
                                        {line.map((token, key) => {
                                          const { key: tokenKey, ...rest } =
                                            getTokenProps({
                                              token,
                                              key,
                                            });
                                          return (
                                            <span
                                              key={String(tokenKey)}
                                              {...rest}
                                            />
                                          );
                                        })}
                                      </div>
                                    );
                                  })}
                                </code>
                              </pre>
                            )}
                          </Highlight>
                        </div>
                      )}
                      {question.sampleSolution && (
                        <div className="flex flex-col gap-2">
                          <h3 className="font-medium">Soluzione di esempio:</h3>
                          <Highlight
                            theme={themes.vsDark}
                            code={question.sampleSolution}
                            language={prismLanguage(question.language)}
                          >
                            {({
                              className,
                              style,
                              tokens,
                              getLineProps,
                              getTokenProps,
                            }) => (
                              <pre
                                className={
                                  "mt-1 overflow-x-auto rounded-md bg-muted p-4 text-sm" +
                                  className
                                }
                                style={style}
                              >
                                <code>
                                  {tokens.map((line, i) => {
                                    const { key: lineKey, ...lineProps } =
                                      getLineProps({
                                        line,
                                        key: i,
                                      });
                                    return (
                                      <div key={String(lineKey)} {...lineProps}>
                                        {line.map((token, key) => {
                                          const { key: tokenKey, ...rest } =
                                            getTokenProps({
                                              token,
                                              key,
                                            });
                                          return (
                                            <span
                                              key={String(tokenKey)}
                                              {...rest}
                                            />
                                          );
                                        })}
                                      </div>
                                    );
                                  })}
                                </code>
                              </pre>
                            )}
                          </Highlight>
                        </div>
                      )}
                      {question.testCases && question.testCases.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <h3 className="font-medium">Test case:</h3>
                          <div className="flex flex-col gap-4 mt-1">
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
