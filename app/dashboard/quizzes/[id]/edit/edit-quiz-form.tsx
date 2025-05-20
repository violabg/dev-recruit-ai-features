"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { questionSchema } from "@/lib/actions/quiz-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const quizSchema = z.object({
  id: z.string(),
  title: z.string(),
  position_id: z.string(),
  questions: z.array(questionSchema),
  time_limit: z.number().nullable(),
  created_at: z.string(),
  created_by: z.string(),
});

type QuizForm = z.infer<typeof quizSchema>;

type Position = {
  id: string;
  title: string;
  experience_level: string;
  skills: string[];
};

type EditQuizFormProps = {
  quiz: QuizForm;
  position: Position;
};

const EditQuizForm = ({ quiz, position }: EditQuizFormProps) => {
  // const router = useRouter();
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiQuizLoading, setAiQuizLoading] = useState(false);

  const form = useForm<QuizForm>({
    resolver: zodResolver(quizSchema),
    defaultValues: quiz,
    mode: "onChange",
  });

  const { fields, remove, update } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  // --- Server actions must be called via fetch to API routes or server actions ---
  // Placeholder for onSubmit, handleRegenerateQuestion, handleRegenerateQuiz
  // You need to implement API calls or use form actions for these features
  const onSubmit = async (data: QuizForm) => {
    try {
      const formData = new FormData();
      formData.append("quiz_id", data.id);
      formData.append("title", data.title);
      formData.append("time_limit", data.time_limit?.toString() || "");
      formData.append("questions", JSON.stringify(data.questions));
      const res = await fetch("/api/quiz-edit/update", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Quiz aggiornato");
      // Optionally reload or redirect
    } catch (e) {
      const error = e as Error;
      toast.error("Errore salvataggio", { description: error.message });
    }
  };

  const handleRegenerateQuestion = async (index: number) => {
    setAiLoading(`q${index}`);
    try {
      const current = form.getValues(`questions.${index}`);
      const res = await fetch("/api/quiz-edit/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizTitle: quiz.title,
          positionTitle: position.title,
          experienceLevel: position.experience_level,
          skills: position.skills,
          type: current.type,
          previousQuestions: form.getValues("questions"),
          currentIndex: index,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const aiQuestion = await res.json();
      update(index, aiQuestion);
      toast.success("Domanda rigenerata dall'AI");
    } catch (e) {
      const error = e as Error;
      toast.error("Errore AI", { description: error.message });
    } finally {
      setAiLoading(null);
    }
  };

  const handleRegenerateQuiz = async () => {
    setAiQuizLoading(true);
    try {
      const res = await fetch("/api/quiz-edit/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionId: position.id,
          quizTitle: quiz.title,
          experienceLevel: position.experience_level,
          skills: position.skills,
          questionCount: fields.length,
          difficulty: 3,
          previousQuestions: form.getValues("questions"),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const aiQuiz = await res.json();
      form.setValue("questions", aiQuiz.questions);
      toast.success("Quiz rigenerato dall'AI");
    } catch (e) {
      const error = e as Error;
      toast.error("Errore AI", { description: error.message });
    } finally {
      setAiQuizLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Modifica quiz: {quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Titolo</label>
              <Input {...form.register("title")} className="mt-1" />
            </div>
            <div>
              <label className="font-medium">Limite di tempo (minuti)</label>
              <Input
                type="number"
                {...form.register("time_limit", { valueAsNumber: true })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{position.title}</Badge>
            <Badge variant="outline">{position.experience_level}</Badge>
            {position.skills.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="secondary"
          onClick={handleRegenerateQuiz}
          disabled={aiQuizLoading}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {aiQuizLoading ? "Generazione..." : "Genera nuovo quiz con AI"}
        </Button>
        <Button
          type="submit"
          variant="default"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Salva modifiche
        </Button>
      </div>
      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Domande</TabsTrigger>
        </TabsList>
        <TabsContent value="questions" className="space-y-4 pt-4">
          {fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Badge
                    variant="outline"
                    className="h-6 w-6 rounded-full p-0 flex items-center justify-center"
                  >
                    {index + 1}
                  </Badge>
                  <span>
                    {field.type === "multiple_choice"
                      ? "Risposta multipla"
                      : field.type === "open_question"
                      ? "Domanda aperta"
                      : "Snippet di codice"}
                  </span>
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleRegenerateQuestion(index)}
                    disabled={aiLoading === `q${index}` || aiQuizLoading}
                  >
                    {aiLoading === `q${index}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Rigenera con AI
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    &times;
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="font-medium">Domanda</label>
                  <Textarea
                    {...form.register(`questions.${index}.question`)}
                    className="mt-1"
                  />
                </div>
                {field.type === "multiple_choice" && (
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Opzioni</label>
                    <div className="flex flex-col gap-4 items-start">
                      {field.options?.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className="flex items-center gap-2 w-full"
                        >
                          <Input
                            {...form.register(
                              `questions.${index}.options.${optIdx}`
                            )}
                            className="w-full"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const opts =
                                form.getValues(`questions.${index}.options`) ||
                                [];
                              opts.splice(optIdx, 1);
                              form.setValue(`questions.${index}.options`, opts);
                            }}
                          >
                            &times;
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const opts =
                            form.getValues(`questions.${index}.options`) || [];
                          form.setValue(`questions.${index}.options`, [
                            ...opts,
                            "",
                          ]);
                        }}
                      >
                        + Aggiungi opzione
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <label className="font-medium">
                        Risposta corretta (indice)
                      </label>
                      <Input
                        type="number"
                        {...form.register(`questions.${index}.correctAnswer`)}
                        className="w-24"
                      />
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <label className="font-medium">Spiegazione</label>
                      <Textarea
                        {...form.register(`questions.${index}.explanation`)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
                {field.type === "open_question" && (
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Risposta di esempio</label>
                    <Textarea
                      {...form.register(`questions.${index}.sampleAnswer`)}
                      className="mt-1"
                    />
                    <div className="flex flex-col gap-2 mt-2">
                      <label className="font-medium">
                        Parole chiave (separate da virgola)
                      </label>
                      <Input
                        defaultValue={field.keywords?.join(", ") || ""}
                        onBlur={(e) => {
                          const val = e.target.value
                            .split(",")
                            .map((s: string) => s.trim())
                            .filter(Boolean);
                          form.setValue(`questions.${index}.keywords`, val);
                        }}
                      />
                    </div>
                  </div>
                )}
                {field.type === "code_snippet" && (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                      <label className="font-medium">Snippet di codice</label>
                      <Textarea
                        {...form.register(`questions.${index}.codeSnippet`)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-medium">
                        Soluzione di esempio
                      </label>
                      <Textarea
                        {...form.register(`questions.${index}.sampleSolution`)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-medium">
                        Test case (JSON array)
                      </label>
                      <Textarea
                        defaultValue={JSON.stringify(
                          field.testCases || [],
                          null,
                          2
                        )}
                        onBlur={(e) => {
                          try {
                            const val = JSON.parse(e.target.value);
                            form.setValue(`questions.${index}.testCases`, val);
                          } catch {
                            toast.error(
                              "Test case non valido (deve essere un array JSON)"
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      <Button
        type="submit"
        variant="default"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Salva modifiche
      </Button>
    </form>
  );
};

export default EditQuizForm;
