"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { BrainCircuit, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { InterviewQuestion } from "@/components/interview-question"
import { InterviewComplete } from "@/components/interview-complete"
import { startInterview, submitAnswer, completeInterview } from "@/lib/actions"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

interface Interview {
  id: string
  quiz_id: string
  candidate_id: string
  status: string
  started_at: string | null
  completed_at: string | null
  token: string
  answers?: Record<string, any>
}

interface Quiz {
  id: string
  title: string
  questions: any[]
  time_limit: number | null
  position: {
    title: string
  }
}

interface Candidate {
  id: string
  name: string
  email: string
}

export function InterviewClient({
  interview,
  quiz,
  candidate,
}: {
  interview: Interview
  quiz: Quiz
  candidate: Candidate
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>(interview.answers || {})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(quiz.time_limit ? quiz.time_limit * 60 : null)
  const [isCompleted, setIsCompleted] = useState(interview.status === "completed")
  const [isStarted, setIsStarted] = useState(interview.status === "in_progress")

  const supabase = createClientComponentClient<Database>()

  const handleCompleteInterview = useCallback(async () => {
    try {
      await completeInterview(interview.token)
      setIsCompleted(true)
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile completare l'intervista",
        variant: "destructive",
      })
    }
  }, [interview.token, toast])

  useEffect(() => {
    // Timer for time limit
    if (!timeRemaining || !isStarted || isCompleted) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          handleCompleteInterview()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, isStarted, isCompleted, handleCompleteInterview])

  // Set up real-time subscription for monitoring
  useEffect(() => {
    if (!supabase || !interview) return

    // Subscribe to changes on this interview
    const channel = supabase
      .channel(`interview_${interview.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "interviews",
          filter: `id=eq.${interview.id}`,
        },
        (payload: any) => {
          // Update local state if the interview is updated
          if (payload.new.status === "completed") {
            setIsCompleted(true)
          }
        },
      )
      .subscribe()

    setLoading(false)

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, interview])

  const handleStartInterview = async () => {
    try {
      await startInterview(interview.token)
      setIsStarted(true)

      // Broadcast the event to the real-time channel
      await supabase.channel(`interview_${interview.id}`).send({
        type: "broadcast",
        event: "interview_started",
        payload: { interview_id: interview.id },
      })
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile avviare l'intervista",
        variant: "destructive",
      })
    }
  }

  const handleAnswer = async (questionId: string, answer: any) => {
    try {
      // Save answer locally
      setAnswers((prev) => ({
        ...prev,
        [questionId]: answer,
      }))

      // Save answer to server
      await submitAnswer(interview.token, questionId, answer)

      // Broadcast the answer to the real-time channel
      await supabase.channel(`interview_${interview.id}`).send({
        type: "broadcast",
        event: "answer_submitted",
        payload: { question_id: questionId, answer, interview_id: interview.id },
      })

      // Move to next question if not the last one
      if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile salvare la risposta",
        variant: "destructive",
      })
    }
  }

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-lg font-medium">Caricamento intervista...</p>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return <InterviewComplete />
  }

  if (!isStarted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-center gap-2 text-primary">
              <BrainCircuit className="h-6 w-6" />
              <h2 className="text-xl font-bold">DevRecruit AI</h2>
            </div>
            <CardTitle className="text-center text-2xl">Benvenuto al colloquio tecnico</CardTitle>
            <CardDescription className="text-center">
              Stai per iniziare il quiz per la posizione di {quiz.position.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium">Dettagli del quiz</h3>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Titolo:</span>
                  <span className="font-medium">{quiz.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Numero di domande:</span>
                  <span className="font-medium">{quiz.questions.length}</span>
                </div>
                {quiz.time_limit && (
                  <div className="flex justify-between">
                    <span>Limite di tempo:</span>
                    <span className="font-medium">{quiz.time_limit} minuti</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium">Istruzioni</h3>
              <ul className="mt-2 space-y-2 text-sm">
                <li>• Leggi attentamente ogni domanda prima di rispondere</li>
                <li>• Puoi navigare tra le domande utilizzando i pulsanti avanti/indietro</li>
                <li>• Le tue risposte vengono salvate automaticamente</li>
                {quiz.time_limit && (
                  <li>
                    • Hai {quiz.time_limit} minuti per completare il quiz, dopodiché verrà inviato automaticamente
                  </li>
                )}
                <li>• Clicca su "Completa" quando hai finito di rispondere a tutte le domande</li>
              </ul>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Importante</h3>
              <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-300">
                Non chiudere o aggiornare questa pagina durante il quiz. Farlo potrebbe causare la perdita delle tue
                risposte.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleStartInterview}>
              Inizia il quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span className="font-bold">DevRecruit AI</span>
          </div>
          <div className="flex items-center gap-4">
            {timeRemaining !== null && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{formatTimeRemaining(timeRemaining)}</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleCompleteInterview}>
              Completa
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 space-y-2">
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Domanda {currentQuestionIndex + 1} di {quiz.questions.length}
              </div>
              <div className="text-sm font-medium">{candidate.name}</div>
            </div>
            <Progress value={((currentQuestionIndex + 1) / quiz.questions.length) * 100} className="h-2" />
          </div>

          {quiz.questions[currentQuestionIndex] && (
            <InterviewQuestion
              question={quiz.questions[currentQuestionIndex]}
              questionNumber={currentQuestionIndex + 1}
              onAnswer={(answer) => handleAnswer(quiz.questions[currentQuestionIndex].id, answer)}
              currentAnswer={answers[quiz.questions[currentQuestionIndex].id]}
            />
          )}

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              Precedente
            </Button>
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                disabled={!answers[quiz.questions[currentQuestionIndex].id]}
              >
                Successiva
              </Button>
            ) : (
              <Button onClick={handleCompleteInterview}>Completa quiz</Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
