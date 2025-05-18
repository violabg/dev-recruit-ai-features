"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabase } from "@/lib/supabase/supabase-provider";
import { ArrowUpDown, Clock, Eye, Filter, Search, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react"; // Added useEffect and useState

// Format date helper
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

// Define types for better readability and type safety
type Position = {
  id: string;
  title: string;
  experience_level: string;
};

type Quiz = {
  id: string;
  title: string;
  created_at: string;
  position_id: string;
  positions: Position | null;
  time_limit: number | null;
  questions: any[]; // Define more specific type if questions structure is known
};

export default function QuizzesPage({
  searchParams,
}: {
  searchParams: { search?: string; sort?: string; filter?: string };
}) {
  const { supabase } = useSupabase();

  // State for data, error, and loading status
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [uniqueLevels, setUniqueLevels] = useState<string[]>([]);
  const [positionCounts, setPositionCounts] = useState<any[] | null>(null); // Define specific type if known
  const [isLoading, setIsLoading] = useState(true);

  // Get search, sort, and filter parameters
  const search = searchParams.search || "";
  const sort = searchParams.sort || "newest";
  const filter = searchParams.filter || "all";

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;

      setIsLoading(true);
      setFetchError(null);

      try {
        // Build the quiz query
        let quizQueryBuilder = supabase.from("quizzes").select(`
          *,
          positions:position_id (
            id,
            title,
            experience_level
          )
        `);

        // Apply search if provided
        if (search) {
          quizQueryBuilder = quizQueryBuilder.ilike("title", `%${search}%`);
        }

        // Apply filter if provided
        if (filter !== "all") {
          const { data: positionIdsData, error: positionError } = await supabase
            .from("positions")
            .select("id")
            .eq("experience_level", filter);

          if (positionError)
            throw new Error(
              `Failed to fetch positions for filter: ${positionError.message}`
            );

          if (positionIdsData && positionIdsData.length > 0) {
            const ids = positionIdsData.map((p) => p.id);
            quizQueryBuilder = quizQueryBuilder.in("position_id", ids);
          } else {
            // No positions match the filter, so no quizzes will match.
            // Force the query to return no results for quizzes.
            quizQueryBuilder = quizQueryBuilder.in("position_id", []);
          }
        }

        // Apply sorting
        if (sort === "newest") {
          quizQueryBuilder = quizQueryBuilder.order("created_at", {
            ascending: false,
          });
        } else if (sort === "oldest") {
          quizQueryBuilder = quizQueryBuilder.order("created_at", {
            ascending: true,
          });
        } else if (sort === "a-z") {
          quizQueryBuilder = quizQueryBuilder.order("title", {
            ascending: true,
          });
        } else if (sort === "z-a") {
          quizQueryBuilder = quizQueryBuilder.order("title", {
            ascending: false,
          });
        }

        // Execute the quiz query
        const { data: fetchedQuizzes, error: quizzesError } =
          await quizQueryBuilder;
        if (quizzesError)
          throw new Error(`Failed to fetch quizzes: ${quizzesError.message}`);
        setQuizzes(fetchedQuizzes as Quiz[]);

        // Get all unique experience levels for the filter
        const { data: experienceLevelsData, error: levelsError } =
          await supabase
            .from("positions")
            .select("experience_level")
            .not("experience_level", "is", null);

        if (levelsError)
          throw new Error(
            `Failed to fetch experience levels: ${levelsError.message}`
          );
        setUniqueLevels(
          experienceLevelsData
            ? [
                ...new Set(
                  experienceLevelsData.map(
                    (p: any) => p.experience_level as string
                  )
                ),
              ]
            : []
        );

        // Count quizzes by position
        const { data: countsData, error: countsError } = await supabase.rpc(
          "count_quizzes_by_position"
        );
        if (countsError)
          throw new Error(
            `Failed to count quizzes by position: ${countsError.message}`
          );
        setPositionCounts(countsData);
      } catch (e: any) {
        setFetchError(e.message || "An unexpected error occurred.");
        // Clear data states on error
        setQuizzes([]);
        setUniqueLevels([]);
        setPositionCounts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, search, sort, filter]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <p className="text-lg text-muted-foreground">Caricamento quiz...</p>
      </div>
    );
  }

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
              <Input
                type="search"
                placeholder="Cerca quiz..."
                className="pl-8"
                defaultValue={search}
                onChange={(e) => {
                  const params = new URLSearchParams(window.location.search);
                  if (e.target.value) {
                    params.set("search", e.target.value);
                  } else {
                    params.delete("search");
                  }
                  window.location.search = params.toString();
                }}
              />
            </div>
            <div className="flex gap-2">
              <div className="w-[150px]">
                <Select
                  defaultValue={sort}
                  onValueChange={(value) => {
                    const params = new URLSearchParams(window.location.search);
                    if (value !== "newest") {
                      params.set("sort", value);
                    } else {
                      params.delete("sort");
                    }
                    window.location.search = params.toString();
                  }}
                >
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
              </div>
              <div className="w-[180px]">
                <Select
                  defaultValue={filter}
                  onValueChange={(value) => {
                    const params = new URLSearchParams(window.location.search);
                    if (value !== "all") {
                      params.set("filter", value);
                    } else {
                      params.delete("filter");
                    }
                    window.location.search = params.toString();
                  }}
                >
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 text-lg">
                      {quiz.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {quiz.positions && (
                          <Badge variant="outline">
                            {quiz.positions.title}
                          </Badge>
                        )}
                        {quiz.positions && (
                          <Badge variant="outline">
                            {quiz.positions.experience_level}
                          </Badge>
                        )}
                        {quiz.time_limit && (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            {quiz.time_limit} minuti
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {quiz.questions.length} domande
                        </span>
                        <span className="text-muted-foreground">
                          {formatDate(quiz.created_at)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="mt-auto pt-2">
                    <div className="flex w-full justify-between gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/quizzes/${quiz.id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          Visualizza
                        </Link>
                      </Button>
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/dashboard/quizzes/${quiz.id}/invite`}>
                          <Send className="mr-1 h-4 w-4" />
                          Invia
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
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
