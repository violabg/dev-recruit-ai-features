"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { BrainCircuit, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

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
})

interface Position {
  id: string
  title: string
  description: string | null
  experience_level: string
  skills: string[]
  soft_skills: string[] | null
}

export default function GenerateQuizPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const { toast } = useToast()
  const [position, setPosition] = useState<Position | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null)

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
  })

  useEffect(() => {
    async function fetchPosition() {
      if (!supabase) return

      try {
        setLoading(true)
        const { data, error } = await supabase.from("positions").select("*").eq("id", params.id).single()

        if (error) throw error
        setPosition(data)

        // Set default title based on position
        if (data) {
          form.setValue("title", `Quiz per ${data.title} (${data.experience_level})`)
        }
      } catch (error: any) {
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati della posizione",
          variant: "destructive",
        })
        router.push("/dashboard/positions")
      } finally {
        setLoading(false)
      }
    }

    fetchPosition()
  }, [supabase, params.id, router, toast, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!supabase || !user || !position) {
      toast({
        title: "Errore",
        description: "Dati mancanti per generare il quiz",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)

    try {
      // Prepare the prompt for the AI
      const prompt = `
Genera un quiz tecnico per una posizione di "${position.title}" con livello "${position.experience_level}".

Competenze richieste: ${position.skills.join(", ")}
${position.description ? `Descrizione della posizione: ${position.description}` : ""}

Parametri del quiz:
- Numero di domande: ${values.questionCount}
- Difficoltà (1-5): ${values.difficulty}
- Tipi di domande da includere:
  ${values.includeMultipleChoice ? "- Domande a risposta multipla" : ""}
  ${values.includeOpenQuestions ? "- Domande aperte" : ""}
  ${values.includeCodeSnippets ? "- Snippet di codice e sfide di programmazione" : ""}

Istruzioni aggiuntive: ${values.instructions || "Nessuna"}

Genera un quiz in formato JSON con la seguente struttura:
{
  "questions": [
    {
      "id": "1",
      "type": "multiple_choice",
      "question": "Testo della domanda",
      "options": ["Opzione 1", "Opzione 2", "Opzione 3", "Opzione 4"],
      "correctAnswer": "Indice della risposta corretta (0-based)",
      "explanation": "Spiegazione della risposta corretta"
    },
    {
      "id": "2",
      "type": "open_question",
      "question": "Testo della domanda aperta",
      "sampleAnswer": "Esempio di risposta corretta",
      "keywords": ["parola chiave 1", "parola chiave 2"]
    },
    {
      "id": "3",
      "type": "code_snippet",
      "question": "Descrizione del problema di codice",
      "language": "javascript/python/etc",
      "codeSnippet": "// Codice da completare o analizzare",
      "sampleSolution": "// Soluzione di esempio",
      "testCases": [
        { "input": "input di esempio", "expectedOutput": "output atteso" }
      ]
    }
  ]
}

Assicurati che le domande siano pertinenti alle competenze richieste e al livello di esperienza.
`

      // Generate quiz using AI
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
        system:
          "Sei un esperto di reclutamento tecnico che crea quiz per valutare le competenze dei candidati. Genera quiz pertinenti, sfidanti ma equi, con domande chiare e risposte corrette. Rispondi SOLO con il JSON richiesto, senza testo aggiuntivo.",
      })

      // Parse the generated JSON
      let quizData
      try {
        // Extract JSON from the response if needed
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/)
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text
        quizData = JSON.parse(jsonString)
      } catch (error) {
        console.error("Error parsing JSON:", error)
        throw new Error("Impossibile analizzare il quiz generato")
      }

      // Save the quiz to the database
      const { data, error } = await supabase
        .from("quizzes")
        .insert({
          title: values.title,
          position_id: position.id,
          questions: quizData.questions,
          time_limit: values.enableTimeLimit ? values.timeLimit : null,
          created_by: user.id,
        })
        .select()

      if (error) throw error

      toast({
        title: "Quiz generato",
        description: "Il quiz è stato generato e salvato con successo",
      })

      if (data && data[0]) {
        router.push(`/dashboard/quizzes/${data[0].id}`)
      } else {
        router.push(`/dashboard/positions/${position.id}`)
      }
    } catch (error: any) {
      console.error("Error generating quiz:", error)
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante la generazione del quiz",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!position) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-lg font-medium">Posizione non trovata</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/positions">Torna alle posizioni</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Genera Quiz AI</h1>
        <p className="text-muted-foreground">Crea un quiz personalizzato per la posizione {position.title}</p>
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
                    <FormDescription>Un titolo descrittivo per il quiz</FormDescription>
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
                    <FormDescription>Istruzioni specifiche per l&apos;AI che genera il quiz</FormDescription>
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
                      <FormDescription>Seleziona il numero di domande (3-20)</FormDescription>
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
                        {["Molto facile", "Facile", "Media", "Difficile", "Molto difficile"][field.value - 1]}
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
                      <FormDescription>Seleziona il livello di difficoltà (1-5)</FormDescription>
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
                          <FormDescription>Domande con opzioni predefinite</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                          <FormDescription>Domande che richiedono risposte testuali</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                          <FormDescription>Sfide di programmazione e analisi di codice</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Limite di tempo</FormLabel>
                      <FormDescription>Imposta un limite di tempo per il completamento del quiz</FormDescription>
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
                      <FormLabel>Limite di tempo: {field.value} minuti</FormLabel>
                      <FormControl>
                        <Slider
                          min={5}
                          max={120}
                          step={5}
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>Seleziona il limite di tempo in minuti</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
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
                  <span className="font-medium">Livello:</span> {position.experience_level}
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
                    <p className="mt-1 text-sm text-muted-foreground">{position.description}</p>
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
                    <span>L&apos;AI analizza le competenze e il livello richiesti per la posizione</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center">
                      2
                    </span>
                    <span>Genera domande pertinenti in base ai parametri selezionati</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center">
                      3
                    </span>
                    <span>Crea un mix bilanciato di domande teoriche, pratiche e sfide di codice</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center">
                      4
                    </span>
                    <span>Puoi modificare il quiz generato prima di inviarlo ai candidati</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
