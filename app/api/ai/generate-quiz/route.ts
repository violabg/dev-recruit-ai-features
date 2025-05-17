import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"

// Define the type for quiz questions
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

export async function POST(req: Request) {
  try {
    const {
      positionTitle,
      experienceLevel,
      skills,
      description,
      questionCount,
      difficulty,
      includeMultipleChoice,
      includeOpenQuestions,
      includeCodeSnippets,
      instructions,
    } = await req.json()

    if (!positionTitle || !experienceLevel || !skills || !questionCount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Prepare the prompt for the AI
    const prompt = `
Genera un quiz tecnico per una posizione di "${positionTitle}" con livello "${experienceLevel}".

Competenze richieste: ${Array.isArray(skills) ? skills.join(", ") : skills}
${description ? `Descrizione della posizione: ${description}` : ""}

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

    return NextResponse.json(quizData)
  } catch (error: any) {
    console.error("Quiz generation error:", error)
    return NextResponse.json({ error: error.message || "Error generating quiz" }, { status: 500 })
  }
}
