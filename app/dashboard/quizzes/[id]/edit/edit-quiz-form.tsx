"use client";

import { GenerateQuizResponse } from "@/app/api/quiz-edit/generate-quiz/route";
import {
  CodeSnippetForm,
  MultipleChoiceForm,
  OpenQuestionForm,
} from "@/components/quiz/question-types";
import { AIGenerationDialog } from "@/components/ui/ai-generation-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateQuizAction } from "@/lib/actions/quizzes";
import {
  CodeSnippetQuestion,
  flexibleQuestionSchema,
  Question,
  QuizForm,
  saveQuizRequestSchema,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Use the consolidated schemas with form-specific validation
const editQuizFormSchema = saveQuizRequestSchema.extend({
  position_id: z.string().optional(), // Make position_id optional for updates
  questions: z
    .array(flexibleQuestionSchema)
    .min(1, "Almeno una domanda è obbligatoria"),
});

type EditQuizFormData = z.infer<typeof editQuizFormSchema>;
type QuestionTypeFilter =
  | "all"
  | "multiple_choice"
  | "open_question"
  | "code_snippet";

// Generate simple UUID-like string
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

type EditQuizFormProps = {
  quiz: QuizForm;
  position: {
    id: string;
    title: string;
    experience_level: string;
    skills: string[];
  };
};

export function EditQuizForm({ quiz, position }: EditQuizFormProps) {
  const router = useRouter();
  const [questionTypeFilter, setQuestionTypeFilter] =
    useState<QuestionTypeFilter>("all");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );

  // AI Generation States
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [fullQuizDialogOpen, setFullQuizDialogOpen] = useState(false);
  const [generatingQuestionType, setGeneratingQuestionType] = useState<
    "multiple_choice" | "open_question" | "code_snippet" | null
  >(null);
  const [regeneratingQuestionIndex, setRegeneratingQuestionIndex] = useState<
    number | null
  >(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  const form = useForm<EditQuizFormData>({
    resolver: zodResolver(editQuizFormSchema),
    defaultValues: {
      title: quiz.title,
      position_id: position.id,
      time_limit: quiz.time_limit,
      questions: quiz.questions,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  // Set all questions as expanded by default
  useEffect(() => {
    const allQuestionIds = new Set(fields.map((field) => field.id));
    setExpandedQuestions(allQuestionIds);
  }, [fields]);

  // Memoize filtered questions for better performance
  const filteredQuestions = useMemo(() => {
    return fields.filter((field) => {
      if (questionTypeFilter === "all") return true;
      return field.type === questionTypeFilter;
    });
  }, [fields, questionTypeFilter]);

  const handleSave = async (data: EditQuizFormData) => {
    setSaveStatus("saving");

    try {
      const formData = new FormData();
      formData.append("quiz_id", quiz.id);
      formData.append("title", data.title);
      if (data.time_limit !== null) {
        formData.append("time_limit", data.time_limit.toString());
      }
      formData.append("questions", JSON.stringify(data.questions));

      await updateQuizAction(formData);

      setSaveStatus("success");
      toast.success("Quiz salvato con successo", {
        icon: <CheckCircle className="w-4 h-4" />,
      });

      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("error");
      console.error("Errore salvataggio:", error);

      let errorMessage = "Errore durante il salvataggio del quiz";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Errore salvataggio", {
        description: errorMessage,
        icon: <AlertCircle className="w-4 h-4" />,
      });

      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleGenerateQuestion = async (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => {
    if (!generatingQuestionType) return;

    setAiLoading(true);

    try {
      const response = await fetch("/api/quiz-edit/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizTitle: form.getValues("title"),
          positionTitle: position.title,
          experienceLevel: position.experience_level,
          skills: position.skills,
          type: generatingQuestionType,
          difficulty: data.difficulty,
          previousQuestions: fields.map((field) => ({
            question: field.question,
            type: field.type,
          })),
          specificModel: data.llmModel,
          instructions: data.instructions || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const newQuestion = await response.json();
      const newQuestionWithId = {
        ...newQuestion,
        id: generateId(),
      };

      append(newQuestionWithId);

      // Expand the new question by default
      setExpandedQuestions((prev) => new Set([...prev, newQuestionWithId.id]));

      toast.success("Domanda generata con successo!", {
        icon: <Sparkles className="w-4 h-4" />,
      });

      setGeneratingQuestionType(null);
    } catch (error) {
      console.error("Errore generazione domanda:", error);

      let errorMessage = "Errore durante la generazione della domanda";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Errore generazione", {
        description: errorMessage,
        icon: <AlertCircle className="w-4 h-4" />,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleRegenerateQuestion = async (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => {
    if (regeneratingQuestionIndex === null) return;

    setAiLoading(true);

    try {
      const currentQuestion = fields[regeneratingQuestionIndex];

      const response = await fetch("/api/quiz-edit/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizTitle: form.getValues("title"),
          positionTitle: position.title,
          experienceLevel: position.experience_level,
          skills: position.skills,
          type: currentQuestion.type,
          difficulty: data.difficulty,
          previousQuestions: fields
            .filter((_, index) => index !== regeneratingQuestionIndex)
            .map((field) => ({
              question: field.question,
              type: field.type,
            })),
          specificModel: data.llmModel,
          instructions: data.instructions || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const newQuestion = await response.json();

      // Update the question at the specific index
      update(regeneratingQuestionIndex, {
        ...newQuestion,
        id: currentQuestion.id, // Keep the same ID
      });

      toast.success("Domanda rigenerata con successo!", {
        icon: <RefreshCw className="w-4 h-4" />,
      });

      setRegeneratingQuestionIndex(null);
    } catch (error) {
      console.error("Errore rigenerazione domanda:", error);

      let errorMessage = "Errore durante la rigenerazione della domanda";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Errore rigenerazione", {
        description: errorMessage,
        icon: <AlertCircle className="w-4 h-4" />,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateFullQuiz = async (data: {
    instructions?: string;
    llmModel: string;
    difficulty?: number;
  }) => {
    setAiLoading(true);

    try {
      const response = await fetch("/api/quiz-edit/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          positionId: position.id,
          quizTitle: form.getValues("title"),
          questionCount: fields.length || 5, // Use current question count or default to 5
          difficulty: data.difficulty || 3,
          includeMultipleChoice: true,
          includeOpenQuestions: true,
          includeCodeSnippets: true,
          specificModel: data.llmModel,
          instructions: data.instructions || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const newQuiz = (await response.json()) as GenerateQuizResponse;

      // Replace all questions with new ones
      const newQuestions = newQuiz.questions.map((q) => ({
        ...q,
        id: generateId(),
      }));

      // Clear current questions and add new ones
      fields.forEach(() => remove(0));
      newQuestions.forEach((question) => append(question));

      // Set all new questions as expanded
      const newQuestionIds = new Set<string>(
        newQuestions.map((q) => q.id as string)
      );
      setExpandedQuestions(newQuestionIds);

      toast.success("Quiz rigenerato completamente con successo!", {
        icon: <Sparkles className="w-4 h-4" />,
      });
    } catch (error) {
      console.error("Errore rigenerazione quiz:", error);

      let errorMessage = "Errore durante la rigenerazione del quiz";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Errore rigenerazione quiz", {
        description: errorMessage,
        icon: <AlertCircle className="w-4 h-4" />,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const toggleQuestionExpansion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const addNewQuestion = (
    type: "multiple_choice" | "open_question" | "code_snippet"
  ) => {
    let newQuestion: Question;

    if (type === "multiple_choice") {
      newQuestion = {
        id: generateId(),
        type: "multiple_choice",
        question: "",
        options: ["", "", "", ""], // Start with 4 empty options
        correctAnswer: 0,
      };
    } else if (type === "open_question") {
      newQuestion = {
        id: generateId(),
        type: "open_question",
        question: "",
      };
    } else {
      // code_snippet
      newQuestion = {
        id: generateId(),
        type: "code_snippet",
        question: "",
        language: "javascript",
      };
    }

    append(newQuestion);

    // Expand the new question by default
    setExpandedQuestions((prev) => new Set([...prev, newQuestion.id]));

    toast.info(
      `Nuova domanda ${
        type === "multiple_choice"
          ? "a scelta multipla"
          : type === "open_question"
          ? "aperta"
          : "con codice"
      } aggiunta`
    );
  };

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Salvataggio...
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle className="mr-2 w-4 h-4" />
            Salvato!
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="mr-2 w-4 h-4" />
            Errore
          </>
        );
      default:
        return (
          <>
            <Save className="mr-2 w-4 h-4" />
            Salva Quiz
          </>
        );
    }
  };

  const getSaveButtonVariant = () => {
    switch (saveStatus) {
      case "success":
        return "default" as const;
      case "error":
        return "destructive" as const;
      default:
        return "default" as const;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Modifica Quiz</CardTitle>
          <CardDescription>
            Aggiorna le domande e le impostazioni del quiz per la posizione{" "}
            <strong>{position.title}</strong>
          </CardDescription>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Impostazioni Quiz</CardTitle>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFullQuizDialogOpen(true)}
                  disabled={aiLoading}
                >
                  <Sparkles className="mr-2 w-4 h-4" />
                  Genera nuovo quiz con AI
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titolo del Quiz</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Inserisci il titolo del quiz"
                        {...field}
                        maxLength={200}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite di Tempo (minuti)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Lascia vuoto per nessun limite"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        min={1}
                        max={180}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardFooter className="px-0 pt-2">
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={saveStatus === "saving"}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveStatus === "saving"}
                    variant={getSaveButtonVariant()}
                    className={cn(
                      saveStatus === "success" &&
                        "bg-green-600 hover:bg-green-700",
                      saveStatus === "error" && "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    {getSaveButtonContent()}
                  </Button>
                </div>
              </CardFooter>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
              <div>
                <CardTitle>Domande ({fields.length})</CardTitle>
                <CardDescription>Gestisci le domande del quiz</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Select
                  value={questionTypeFilter}
                  onValueChange={(value: QuestionTypeFilter) =>
                    setQuestionTypeFilter(value)
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="multiple_choice">
                      Scelta multipla
                    </SelectItem>
                    <SelectItem value="open_question">
                      Domanda aperta
                    </SelectItem>
                    <SelectItem value="code_snippet">
                      Snippet di codice
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addNewQuestion("multiple_choice")}
                >
                  <Sparkles className="mr-2 w-4 h-4" />
                  Scelta multipla
                  <Plus className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addNewQuestion("open_question")}
                >
                  <Sparkles className="mr-2 w-4 h-4" />
                  Domanda aperta
                  <Plus className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addNewQuestion("code_snippet")}
                >
                  <Sparkles className="mr-2 w-4 h-4" />
                  Snippet di codice
                  <Plus className="ml-2 w-4 h-4" />
                </Button>
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="py-8 text-muted-foreground text-center">
                  {questionTypeFilter === "all"
                    ? "Nessuna domanda presente. Aggiungi la prima domanda usando i pulsanti sopra."
                    : `Nessuna domanda di tipo "${questionTypeFilter}" trovata.`}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuestions.map((field) => {
                    const actualIndex = fields.findIndex(
                      (f) => f.id === field.id
                    );
                    const isExpanded = expandedQuestions.has(field.id);

                    return (
                      <Card key={field.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-muted-foreground text-sm">
                                Domanda {actualIndex + 1}
                              </span>
                              <span className="inline-flex items-center bg-muted px-2.5 py-0.5 rounded-full font-medium text-xs">
                                {field.type === "multiple_choice" &&
                                  "Scelta multipla"}
                                {field.type === "open_question" && "Aperta"}
                                {field.type === "code_snippet" && "Codice"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleQuestionExpansion(field.id)
                                }
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRegeneratingQuestionIndex(actualIndex);
                                  setRegenerateDialogOpen(true);
                                }}
                                disabled={aiLoading}
                                title="Rigenera domanda con AI"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(actualIndex)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {!isExpanded && field.question && (
                            <p className="text-muted-foreground text-sm line-clamp-2">
                              {field.question}
                            </p>
                          )}
                        </CardHeader>

                        {isExpanded && (
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name={`questions.${actualIndex}.question`}
                                render={({ field: questionField }) => (
                                  <FormItem>
                                    <FormLabel>Testo della domanda</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Inserisci il testo della domanda"
                                        {...questionField}
                                        maxLength={500}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {field.type === "multiple_choice" && (
                                <MultipleChoiceForm index={actualIndex} />
                              )}
                              {field.type === "open_question" && (
                                <OpenQuestionForm index={actualIndex} />
                              )}
                              {field.type === "code_snippet" && (
                                <CodeSnippetForm
                                  index={actualIndex}
                                  field={field as CodeSnippetQuestion}
                                />
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saveStatus === "saving"}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={saveStatus === "saving"}
              variant={getSaveButtonVariant()}
              className={cn(
                saveStatus === "success" && "bg-green-600 hover:bg-green-700",
                saveStatus === "error" && "bg-red-600 hover:bg-red-700"
              )}
            >
              {getSaveButtonContent()}
            </Button>
          </div>
        </form>
      </Form>

      {/* New Question Generation Dialog */}
      <AIGenerationDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        title="Genera Domanda con AI"
        description="Specifica le istruzioni per generare una nuova domanda"
        onGenerate={handleGenerateQuestion}
        loading={aiLoading}
        showDifficulty={true}
        defaultDifficulty={quiz.difficulty || 3}
      />

      {/* Question Regeneration Dialog */}
      <AIGenerationDialog
        open={regenerateDialogOpen}
        onOpenChange={setRegenerateDialogOpen}
        title="Rigenera Domanda con AI"
        description="Sostituisci la domanda esistente con una nuova generata dall'AI"
        onGenerate={handleRegenerateQuestion}
        loading={aiLoading}
        showDifficulty={true}
        defaultDifficulty={3}
      />

      {/* Full Quiz Regeneration Dialog */}
      <AIGenerationDialog
        open={fullQuizDialogOpen}
        onOpenChange={setFullQuizDialogOpen}
        title="Genera Nuovo Quiz con AI"
        description="Sostituisci completamente tutte le domande del quiz con nuove generate dall'AI"
        onGenerate={handleGenerateFullQuiz}
        loading={aiLoading}
        showDifficulty={true}
        defaultDifficulty={3}
      />
    </div>
  );
}
