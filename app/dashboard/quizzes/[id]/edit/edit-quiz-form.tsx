"use client";

import {
  GenerateQuizRequest,
  GenerateQuizResponse,
} from "@/app/api/quiz-edit/generate-quiz/route";
import {
  CodeSnippetForm,
  MultipleChoiceForm,
  OpenQuestionForm,
} from "@/components/quiz/question-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { QuizForm, quizSchema } from "@/lib/actions/quiz-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

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
  const router = useRouter();
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiQuizLoading, setAiQuizLoading] = useState(false);
  const [questionLanguages, setQuestionLanguages] = useState<
    Record<number, string>
  >({});

  const form = useForm<QuizForm>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      ...quiz,
      difficulty: quiz.difficulty || 3, // Default to medium difficulty if not set
    },
    mode: "onChange",
  });

  const { fields, remove, update } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  // Initialize language state for existing code snippet questions
  useEffect(() => {
    const initialLanguages: Record<number, string> = {};
    fields.forEach((field, index) => {
      if (field.type === "code_snippet") {
        initialLanguages[index] = "JavaScript"; // Default to JavaScript
      }
    });
    setQuestionLanguages(initialLanguages);
  }, [fields]);

  const onSubmit = async (data: QuizForm) => {
    try {
      const formData = new FormData();
      formData.append("quiz_id", data.id);
      formData.append("title", data.title);
      formData.append("time_limit", data.time_limit?.toString() || "");
      formData.append("difficulty", data.difficulty?.toString() || "3");
      formData.append("questions", JSON.stringify(data.questions));
      const res = await fetch("/api/quiz-edit/update", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Quiz aggiornato");
      router.push(`/dashboard/quizzes/${quiz.id}`);
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
      const currentQuestions = form.getValues("questions");
      const includeMultipleChoice = currentQuestions.some(
        (q) => q.type === "multiple_choice"
      );
      const includeOpenQuestions = currentQuestions.some(
        (q) => q.type === "open_question"
      );
      const includeCodeSnippets = currentQuestions.some(
        (q) => q.type === "code_snippet"
      );

      const body = {
        positionId: position.id,
        quizTitle: quiz.title,
        // experienceLevel and skills are fetched by the server action
        questionCount: fields.length,
        difficulty: form.getValues("difficulty") || 3,
        previousQuestions: currentQuestions,
        includeMultipleChoice,
        includeOpenQuestions,
        includeCodeSnippets,
      } as GenerateQuizRequest;

      const res = await fetch("/api/quiz-edit/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const aiQuiz = (await res.json()) as GenerateQuizResponse;
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Modifica quiz: {quiz.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="gap-4 grid xl:grid-cols-3">
              <FormField
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titolo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="time_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite di tempo (minuti)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
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
                        ][(field.value || 3) - 1]
                      }
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        defaultValue={[field.value || 3]}
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
            {aiQuizLoading ? (
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 w-4 h-4" />
            )}
            Genera nuovo quiz con AI
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
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
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Badge
                      variant="outline"
                      className="flex justify-center items-center p-0 rounded-full w-6 h-6"
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
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
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
                  <FormField
                    name={`questions.${index}.question`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domanda</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Inserisci la domanda..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {field.type === "multiple_choice" && (
                    <MultipleChoiceForm index={index} />
                  )}
                  {field.type === "open_question" && (
                    <OpenQuestionForm index={index} />
                  )}
                  {field.type === "code_snippet" && (
                    <CodeSnippetForm
                      index={index}
                      field={field}
                      questionLanguages={questionLanguages}
                      setQuestionLanguages={setQuestionLanguages}
                    />
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
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : null}
          Salva modifiche
        </Button>
      </form>
    </Form>
  );
};

export default EditQuizForm;
