"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BrainCircuit, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { generateAndSaveQuiz } from "@/lib/actions/quizzes";
import { useSupabase } from "@/lib/supabase/supabase-provider";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Il titolo deve contenere almeno 2 caratteri.",
  }),
  instructions: z.string().optional(),
  questionCount: z.number().min(3).max(20),
  includeMultipleChoice: z.boolean(),
  includeOpenQuestions: z.boolean(),
  includeCodeSnippets: z.boolean(),
  difficulty: z.number().min(1).max(5),
  timeLimit: z.number().min(0).max(120),
  enableTimeLimit: z.boolean(),
});

interface Position {
  id: string;
  title: string;
  description: string | null;
  experience_level: string;
  skills: string[];
  soft_skills: string[] | null;
}

export default function GenerateQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      instructions: "",
      questionCount: 10,
      includeMultipleChoice: true,
      includeOpenQuestions: true,
      includeCodeSnippets: true,
      difficulty: 3,
      timeLimit: 30,
      enableTimeLimit: true,
    },
  });

  useEffect(() => {
    async function fetchPosition() {
      if (!supabase) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("positions")
          .select("*")
          .eq("id", unwrappedParams.id)
          .single();

        if (error) throw error;
        setPosition(data);

        // Set default title based on position
        if (data) {
          form.setValue(
            "title",
            `Quiz per ${data.title} (${data.experience_level})`
          );
        }
      } catch (error: any) {
        toast.error("Errore", {
          description: "Impossibile caricare i dati della posizione",
        });
        router.push("/dashboard/positions");
      } finally {
        setLoading(false);
      }
    }

    fetchPosition();
  }, [supabase, unwrappedParams.id, router, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !position) {
      toast.error("Errore", {
        description: "Dati mancanti per generare il quiz",
      });
      return;
    }

    setGenerating(true);

    try {
      const formData = new FormData();
      formData.append("position_id", position.id);
      formData.append("title", values.title);
      formData.append("instructions", values.instructions || "");
      formData.append("question_count", values.questionCount.toString());
      formData.append("difficulty", values.difficulty.toString());
      formData.append(
        "include_multiple_choice",
        values.includeMultipleChoice.toString()
      );
      formData.append(
        "include_open_questions",
        values.includeOpenQuestions.toString()
      );
      formData.append(
        "include_code_snippets",
        values.includeCodeSnippets.toString()
      );
      formData.append("enable_time_limit", values.enableTimeLimit.toString());
      formData.append("time_limit", values.timeLimit.toString());

      await generateAndSaveQuiz(formData);
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      toast.error("Errore", {
        description:
          error.message ||
          "Si è verificato un errore durante la generazione del quiz",
      });
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!position) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-lg font-medium">Posizione non trovata</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/positions">Torna alle posizioni</Link>
        </Button>
      </div>
    );
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titolo del quiz</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Un titolo descrittivo per il quiz
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Istruzioni aggiuntive (opzionale)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Inserisci istruzioni specifiche per la generazione del quiz..."
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Istruzioni specifiche per l&apos;AI che genera il quiz
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="questionCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero di domande: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={3}
                          max={20}
                          step={1}
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Seleziona il numero di domande (3-20)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Difficoltà:{" "}
                        {
                          [
                            "Molto facile",
                            "Facile",
                            "Media",
                            "Difficile",
                            "Molto difficile",
                          ][field.value - 1]
                        }
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={5}
                          step={1}
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Seleziona il livello di difficoltà (1-5)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tipi di domande</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="includeMultipleChoice"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Domande a risposta multipla</FormLabel>
                          <FormDescription>
                            Domande con opzioni predefinite
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="includeOpenQuestions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Domande aperte</FormLabel>
                          <FormDescription>
                            Domande che richiedono risposte testuali
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="includeCodeSnippets"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Snippet di codice</FormLabel>
                          <FormDescription>
                            Sfide di programmazione e analisi di codice
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="enableTimeLimit"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Limite di tempo</FormLabel>
                      <FormDescription>
                        Imposta un limite di tempo per il completamento del quiz
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("enableTimeLimit") && (
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Limite di tempo: {field.value} minuti
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={5}
                          max={120}
                          step={5}
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Seleziona il limite di tempo in minuti
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Annulla
                </Button>
                <Button type="submit" disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generazione in corso...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="mr-2 h-4 w-4" />
                      Genera Quiz
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
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
                    {position.skills.map((skill, index) => (
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
