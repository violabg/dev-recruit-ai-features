"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"
import { getSupabaseServer } from "../supabase-server"

// Quiz types
type Question = {
  id: string
  type: "multiple_choice" | "open_question" | "code_snippet"
  question: string
} & (
  | {
      type: "multiple_choice"
      options: string[]
      correctAnswer: string
      explanation?: string
    }
  | {
      type: "open_question"
      sampleAnswer: string
      keywords?: string[]
    }
  | {
      type: "code_snippet"
      language?: string
      codeSnippet?: string
      sampleSolution: string
      testCases?: Array<{ input: string; expectedOutput: string }>
    }
)

type QuizData = {
  questions: Question[]
}

// Quiz actions
export async function generateQuiz(formData: FormData) {
  const supabase = getSupabaseServer()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  const positionId = formData.get("position_id") as string
  const title = formData.get("title") as string
  const instructions = formData.get("instructions") as string
  const questionCount = Number.parseInt(formData.get("question_count") as string)
  const difficulty = Number.parseInt(formData.get("difficulty") as string)
  const includeMultipleChoice = formData.get("include_multiple_choice") === "true"
  const includeOpenQuestions = formData.get("include_open_questions") === "true"
  const includeCodeSnippets = formData.get("include_code_snippets") === "true"
  const enableTimeLimit = formData.get("enable_time_limit") === "true"
  const timeLimit = enableTimeLimit ? Number.parseInt(formData.get("time_limit") as string) : null

  // Get position details
  const { data: position, error: positionError } = await supabase
    .from("positions")
    .select("*")
    .eq("id", positionId)
    .single()

  if (positionError || !position) {
    throw new Error("Position not found")
  }

  // Prepare the prompt for the AI
  const prompt = `
Genera un quiz tecnico per una posizione di "${position.title}" con livello "${position.experience_level}".

Competenze richieste: ${position.skills.join(", ")}
${position.description ? `Descrizione della posizione: ${position.description}` : ""}

Parametri del quiz:
- Numero di domande: ${questionCount}
- Difficoltà (1-5): ${difficulty}
- Tipi di domande da includere:
  ${includeMultipleChoice ? "- Domande a risposta multipla" : ""}
  ${includeOpenQuestions ? "- Domande aperte" : ""}
  ${includeCodeSnippets ? "- Snippet di codice e sfide di programmazione" : ""}

Istruzioni aggiuntive: ${instructions || "Nessuna"}

Genera un quiz con domande pertinenti alle competenze richieste e al livello di esperienza.
`

  // Generate quiz using AI with generateObject
  const { object: quizData } = await generateObject<QuizData>({
    model: groq("llama3-70b-8192"),
    prompt,
    system:
      "Sei un esperto di reclutamento tecnico che crea quiz per valutare le competenze dei candidati. Genera quiz pertinenti, sfidanti ma equi, con domande chiare e risposte corrette.",
    schema: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "type", "question"],
            properties: {
              id: { type: "string" },
              type: { type: "string", enum: ["multiple_choice", "open_question", "code_snippet"] },
              question: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              correctAnswer: { type: "string" },
              explanation: { type: "string" },
              sampleAnswer: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
              language: { type: "string" },
              codeSnippet: { type: "string" },
              sampleSolution: { type: "string" },
              testCases: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    input: { type: "string" },
                    expectedOutput: { type: "string" },
                  },
                  required: ["input", "expectedOutput"],
                },
              },
            },
          },
        },
      },
      required: ["questions"],
    },
  })

  // Save the quiz to the database
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .insert({
      title,
      position_id: positionId,
      questions: quizData.questions,
      time_limit: timeLimit,
      created_by: user.id,
    })
    .select()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/positions/${positionId}`)

  if (quiz && quiz[0]) {
    redirect(`/dashboard/quizzes/${quiz[0].id}`)
  } else {
    redirect(`/dashboard/positions/${positionId}`)
  }
}

export async function deleteQuiz(id: string) {
  const supabase = getSupabaseServer()

  const { data: quiz, error: fetchError } = await supabase.from("quizzes").select("position_id").eq("id", id).single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  const positionId = quiz?.position_id

  const { error } = await supabase.from("quizzes").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/positions/${positionId}`)
  redirect(`/dashboard/positions/${positionId}`)
}
