import { QuizCard } from "@/components/quiz/quiz-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Filter, Search } from "lucide-react";
import Link from "next/link";
import { fetchQuizzesData } from "./quizzes-actions";

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const params = await searchParams;

  const search = params?.search || "";
  const sort = params?.sort || "newest";
  const filter = params?.filter || "all";

  const { quizzes, fetchError, uniqueLevels, positionCounts } =
    await fetchQuizzesData({ search, sort, filter });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Quiz</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/positions">Posizioni</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/candidates">Candidati</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_250px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <form>
                <Input
                  type="search"
                  name="search"
                  placeholder="Cerca quiz..."
                  className="pl-8"
                  defaultValue={search}
                />
              </form>
            </div>
            <div className="flex gap-2">
              <div className="w-[150px]">
                <form>
                  <Select name="sort" defaultValue={sort}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        <SelectValue placeholder="Ordina" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Più recenti</SelectItem>
                      <SelectItem value="oldest">Meno recenti</SelectItem>
                      <SelectItem value="a-z">A-Z</SelectItem>
                      <SelectItem value="z-a">Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </form>
              </div>
              <div className="w-[180px]">
                <form>
                  <Select name="filter" defaultValue={filter}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filtra" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i livelli</SelectItem>
                      {uniqueLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </form>
              </div>
            </div>
          </div>

          {fetchError ? (
            <div className="rounded-md bg-destructive/15 p-4 text-destructive">
              <p>
                Si è verificato un errore nel caricamento dei quiz: {fetchError}
              </p>
            </div>
          ) : quizzes && quizzes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {search || filter !== "all"
                    ? "Nessun quiz trovato con i criteri di ricerca specificati."
                    : "Nessun quiz creato. Crea un quiz per una posizione."}
                </p>
                <Button className="mt-4" size="sm" asChild>
                  <Link href="/dashboard/positions">Vai alle posizioni</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistiche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Quiz totali:</span>
                  <span className="font-medium">{quizzes?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quiz inviati:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span>Quiz completati:</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz per posizione</CardTitle>
            </CardHeader>
            <CardContent>
              {positionCounts && positionCounts.length > 0 ? (
                <div className="space-y-2">
                  {positionCounts.map((item: any) => (
                    <div
                      key={item.position_id}
                      className="flex justify-between"
                    >
                      <span className="truncate">{item.position_title}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nessun dato disponibile
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Azioni rapide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/dashboard/positions">Crea nuovo quiz</Link>
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/dashboard/candidates">Gestisci candidati</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
