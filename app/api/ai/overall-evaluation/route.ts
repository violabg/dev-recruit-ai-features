import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"

type OverallEvaluation = {
  evaluation: string
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  fitScore: number
}

export async function POST(req: Request) {
  try {
    const { candidateName, answeredCount, totalCount, percentageScore, evaluations } = await req.json()

    if (!candidateName || percentageScore === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

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

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Overall evaluation error:", error)
    return NextResponse.json({ error: error.message || "Error generating overall evaluation" }, { status: 500 })
  }
}
