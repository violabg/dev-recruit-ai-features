"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"
import type { Database } from "@/lib/database.types"

// Create a Supabase client for server actions
const getSupabaseServer = () => {
  const cookieStore = cookies()
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_ANON_KEY!

  return createClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

// Position actions
export async function createPosition(formData: FormData) {
  const supabase = getSupabaseServer()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const experienceLevel = formData.get("experience_level") as string
  const skills = JSON.parse(formData.get("skills") as string)
  const softSkills = JSON.parse((formData.get("soft_skills") as string) || "[]")
  const contractType = formData.get("contract_type") as string

  const { data, error } = await supabase
    .from("positions")
    .insert({
      title,
      description,
      experience_level: experienceLevel,
      skills,
      soft_skills: softSkills,
      contract_type: contractType,
      created_by: user.id,
    })
    .select()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/positions")

  if (data && data[0]) {
    redirect(`/dashboard/positions/${data[0].id}`)
  } else {
    redirect("/dashboard/positions")
  }
}

export async function deletePosition(id: string) {
  const supabase = getSupabaseServer()

  const { error } = await supabase.from("positions").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/positions")
  redirect("/dashboard/positions")
}

// Quiz actions
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

// Candidate actions
export async function createCandidate(formData: FormData) {
  const supabase = getSupabaseServer()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const positionId = formData.get("position_id") as string

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      name,
      email,
      position_id: positionId,
      status: "pending",
      created_by: user.id,
    })
    .select()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/positions/${positionId}`)

  if (data && data[0]) {
    return { success: true, candidateId: data[0].id }
  } else {
    throw new Error("Failed to create candidate")
  }
}

// Interview actions
export async function createInterview(formData: FormData) {
  const supabase = getSupabaseServer()

  const candidateId = formData.get("candidate_id") as string
  const quizId = formData.get("quiz_id") as string

  // Generate unique token
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  const { data, error } = await supabase
    .from("interviews")
    .insert({
      candidate_id: candidateId,
      quiz_id: quizId,
      status: "pending",
      token,
    })
    .select()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/quizzes/${quizId}`)

  if (data && data[0]) {
    return {
      success: true,
      interviewId: data[0].id,
      token: data[0].token,
    }
  } else {
    throw new Error("Failed to create interview")
  }
}

export async function startInterview(token: string) {
  const supabase = getSupabaseServer()

  const { error } = await supabase
    .from("interviews")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("token", token)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

export async function submitAnswer(token: string, questionId: string, answer: any) {
  const supabase = getSupabaseServer()

  // Get current interview
  const { data: interview, error: fetchError } = await supabase
    .from("interviews")
    .select("*")
    .eq("token", token)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  // Get current answers
  const currentAnswers = interview?.answers || {}

  // Update answers
  const updatedAnswers = {
    ...currentAnswers,
    [questionId]: answer,
  }

  // Update interview with new answer
  const { error } = await supabase
    .from("interviews")
    .update({
      answers: updatedAnswers,
    })
    .eq("id", interview.id)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

export async function completeInterview(token: string) {
  const supabase = getSupabaseServer()

  const { error } = await supabase
    .from("interviews")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("token", token)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

// Authentication actions
export async function signIn(formData: FormData) {
  const supabase = getSupabaseServer()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Set a cookie to ensure the session is properly maintained
  const session = data.session
  if (session) {
    cookies().set("supabase-auth-token", session.access_token, {
      path: "/",
      maxAge: session.expires_in,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function signUp(formData: FormData) {
  const supabase = getSupabaseServer()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const company = formData.get("company") as string

  // Register the user
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company,
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (data.user) {
    // Create profile record
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: data.user.id,
      full_name: fullName,
      company,
      role: "recruiter", // Default role for new users
    })

    if (profileError) {
      return { error: profileError.message }
    }
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function signOut() {
  const supabase = getSupabaseServer()

  await supabase.auth.signOut()

  revalidatePath("/")
  redirect("/")
}

// Evaluation actions
type EvaluationResult = {
  evaluation: string
  score: number
  strengths: string[]
  weaknesses: string[]
}

export async function evaluateAnswer(question: any, answer: any) {
  if (!question || !answer) {
    throw new Error("Missing required fields")
  }

  // Prepare the prompt based on question type
  let prompt = ""
  if (question.type === "multiple_choice") {
    prompt = `
Valuta questa risposta a scelta multipla:

Domanda: ${question.question}
Opzione selezionata dal candidato: "${answer}"
Opzione corretta: "${question.options[Number.parseInt(question.correctAnswer)]}"

La risposta è ${answer === question.correctAnswer ? "corretta" : "errata"}.

Fornisci una valutazione dettagliata della risposta, spiegando perché è corretta o errata.
Identifica i punti di forza e le debolezze nella comprensione del candidato.
`
  } else if (question.type === "open_question") {
    prompt = `
Valuta questa risposta aperta:

Domanda: ${question.question}
Risposta del candidato: "${answer}"
Risposta di esempio: "${question.sampleAnswer}"
${question.keywords ? `Parole chiave da cercare: ${question.keywords.join(", ")}` : ""}

Fornisci una valutazione dettagliata della risposta, considerando:
1. Correttezza tecnica
2. Completezza
3. Chiarezza dell'espressione
4. Presenza delle parole chiave o concetti importanti
`
  } else if (question.type === "code_snippet") {
    prompt = `
Valuta questo snippet di codice:

Domanda: ${question.question}
Codice del candidato:
\`\`\`
${answer.code}
\`\`\`

Soluzione di esempio:
\`\`\`
${question.sampleSolution}
\`\`\`

${
  question.testCases
    ? `Test cases:
${question.testCases.map((tc: any) => `Input: ${tc.input}, Output atteso: ${tc.expectedOutput}`).join("\n")}`
    : ""
}

Fornisci una valutazione dettagliata del codice, considerando:
1. Correttezza funzionale
2. Efficienza dell'algoritmo
3. Leggibilità e stile del codice
4. Gestione degli errori
`
  }

  // Use Groq to evaluate the answer with generateObject
  const { object: result } = await generateObject<EvaluationResult>({
    model: groq("llama3-70b-8192"),
    prompt,
    system:
      "Sei un esperto valutatore tecnico che analizza le risposte dei candidati durante i colloqui di lavoro. Fornisci valutazioni oggettive, dettagliate e costruttive.",
    schema: {
      type: "object",
      properties: {
        evaluation: {
          type: "string",
          description: "Una valutazione dettagliata della risposta del candidato",
        },
        score: {
          type: "number",
          minimum: 0,
          maximum: 10,
          description: "Un punteggio da 0 a 10, dove 10 è una risposta perfetta",
        },
        strengths: {
          type: "array",
          items: { type: "string" },
          description: "I punti di forza della risposta del candidato",
        },
        weaknesses: {
          type: "array",
          items: { type: "string" },
          description: "Le aree di miglioramento nella risposta del candidato",
        },
      },
      required: ["evaluation", "score", "strengths", "weaknesses"],
    },
  })

  return {
    ...result,
    maxScore: 10,
  }
}

type OverallEvaluation = {
  evaluation: string
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  fitScore: number
}

export async function generateOverallEvaluation(
  candidateName: string,
  answeredCount: number,
  totalCount: number,
  percentageScore: number,
  evaluations: Record<string, any>,
) {
  // Extract strengths and weaknesses from evaluations
  const allStrengths: string[] = []
  const allWeaknesses: string[] = []

  Object.values(evaluations).forEach((evaluationItem: any) => {
    if (evaluationItem.strengths) allStrengths.push(...evaluationItem.strengths)
    if (evaluationItem.weaknesses) allWeaknesses.push(...evaluationItem.weaknesses)
  })

  // Prepare the prompt for overall evaluation
  const prompt = `
Fornisci una valutazione complessiva del candidato ${candidateName} basata sulle sue risposte al quiz tecnico.

Il candidato ha risposto a ${answeredCount} domande su ${totalCount}.
Il punteggio complessivo è ${percentageScore}%.

Punti di forza identificati:
${allStrengths.map((s) => `- ${s}`).join("\n")}

Aree di miglioramento:
${allWeaknesses.map((w) => `- ${w}`).join("\n")}

Fornisci una valutazione dettagliata delle competenze del candidato, evidenziando i punti di forza e le aree di miglioramento.
Includi una raccomandazione su come procedere con questo candidato (es. procedere con un colloquio dal vivo, considerare per un'altra posizione, ecc.).
`

  // Generate overall evaluation using AI
  const { object: result } = await generateObject<OverallEvaluation>({
    model: groq("llama3-70b-8192"),
    prompt,
    system:
      "Sei un esperto di reclutamento tecnico che fornisce valutazioni oggettive e costruttive dei candidati. Basa la tua valutazione esclusivamente sulle informazioni fornite.",
    schema: {
      type: "object",
      properties: {
        evaluation: {
          type: "string",
          description: "Una valutazione complessiva dettagliata del candidato",
        },
        strengths: {
          type: "array",
          items: { type: "string" },
          description: "I principali punti di forza del candidato",
        },
        weaknesses: {
          type: "array",
          items: { type: "string" },
          description: "Le principali aree di miglioramento del candidato",
        },
        recommendation: {
          type: "string",
          description: "Una raccomandazione su come procedere con questo candidato",
        },
        fitScore: {
          type: "number",
          minimum: 1,
          maximum: 10,
          description: "Un punteggio da 1 a 10 che indica quanto il candidato è adatto per la posizione",
        },
      },
      required: ["evaluation", "strengths", "weaknesses", "recommendation", "fitScore"],
    },
  })

  return result
}
