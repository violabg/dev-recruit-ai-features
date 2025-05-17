import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"

type EvaluationResult = {
  evaluation: string
  score: number
  strengths: string[]
  weaknesses: string[]
}

export async function POST(req: Request) {
  try {
    const { question, answer, questionType, correctAnswer, sampleAnswer, keywords, sampleSolution, testCases } =
      await req.json()

    if (!question || !answer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Prepare the prompt based on question type
    let prompt = ""
    if (questionType === "multiple_choice") {
      prompt = `
Valuta questa risposta a scelta multipla:

Domanda: ${question}
Opzione selezionata dal candidato: "${answer}"
Opzione corretta: "${correctAnswer}"

La risposta è ${answer === correctAnswer ? "corretta" : "errata"}.

Fornisci una valutazione dettagliata della risposta, spiegando perché è corretta o errata.
Identifica i punti di forza e le debolezze nella comprensione del candidato.
`
    } else if (questionType === "open_question") {
      prompt = `
Valuta questa risposta aperta:

Domanda: ${question}
Risposta del candidato: "${answer}"
Risposta di esempio: "${sampleAnswer}"
${keywords ? `Parole chiave da cercare: ${keywords.join(", ")}` : ""}

Fornisci una valutazione dettagliata della risposta, considerando:
1. Correttezza tecnica
2. Completezza
3. Chiarezza dell'espressione
4. Presenza delle parole chiave o concetti importanti
`
    } else if (questionType === "code_snippet") {
      prompt = `
Valuta questo snippet di codice:

Domanda: ${question}
Codice del candidato:
\`\`\`
${answer}
\`\`\`

Soluzione di esempio:
\`\`\`
${sampleSolution}
\`\`\`

${
  testCases
    ? `Test cases:
${testCases.map((tc: any) => `Input: ${tc.input}, Output atteso: ${tc.expectedOutput}`).join("\n")}`
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

    return NextResponse.json({
      ...result,
      maxScore: 10,
    })
  } catch (error: any) {
    console.error("AI evaluation error:", error)
    return NextResponse.json({ error: error.message || "Error evaluating answer" }, { status: 500 })
  }
}
