"use server";

import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

// Evaluation types
type EvaluationResult = {
  evaluation: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
};

type OverallEvaluation = {
  evaluation: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  fitScore: number;
};

// Zod Schemas
const EvaluationResultSchema = z.object({
  evaluation: z
    .string()
    .describe("Una valutazione dettagliata della risposta del candidato"),
  score: z
    .number()
    .min(0)
    .max(10)
    .describe("Un punteggio da 0 a 10, dove 10 è una risposta perfetta"),
  strengths: z
    .array(z.string())
    .describe("I punti di forza della risposta del candidato"),
  weaknesses: z
    .array(z.string())
    .describe("Le aree di miglioramento nella risposta del candidato"),
});

const OverallEvaluationSchema = z.object({
  evaluation: z
    .string()
    .describe("Una valutazione complessiva dettagliata del candidato"),
  strengths: z
    .array(z.string())
    .describe("I principali punti di forza del candidato"),
  weaknesses: z
    .array(z.string())
    .describe("Le principali aree di miglioramento del candidato"),
  recommendation: z
    .string()
    .describe("Una raccomandazione su come procedere con questo candidato"),
  fitScore: z
    .number()
    .min(1)
    .max(10)
    .describe(
      "Un punteggio da 1 a 10 che indica quanto il candidato è adatto per la posizione"
    ),
});

// Evaluation actions
export async function evaluateAnswer(question: any, answer: any) {
  if (!question || !answer) {
    throw new Error("Missing required fields");
  }

  // Prepare the prompt based on question type
  let prompt = "";
  if (question.type === "multiple_choice") {
    prompt = `
              Valuta questa risposta a scelta multipla:

              Domanda: ${question.question}
              Opzione selezionata dal candidato: "${answer}"
              Opzione corretta: "${
                question.options[Number.parseInt(question.correctAnswer)]
              }"

              La risposta è ${
                answer === question.correctAnswer ? "corretta" : "errata"
              }.

              Fornisci una valutazione dettagliata della risposta, spiegando perché è corretta o errata.
              Identifica i punti di forza e le debolezze nella comprensione del candidato.
              `;
  } else if (question.type === "open_question") {
    prompt = `
              Valuta questa risposta aperta:

              Domanda: ${question.question}
              Risposta del candidato: "${answer}"
            Risposta di esempio: "${question.sampleAnswer}"
            ${
              question.keywords
                ? `Parole chiave da cercare: ${question.keywords.join(", ")}`
                : ""
            }

            Fornisci una valutazione dettagliata della risposta, considerando:
            1. Correttezza tecnica
            2. Completezza
            3. Chiarezza dell'espressione
            4. Presenza delle parole chiave o concetti importanti
            `;
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
              ${question.testCases
                .map(
                  (tc: any) =>
                    `Input: ${tc.input}, Output atteso: ${tc.expectedOutput}`
                )
                .join("\n")}`
                  : ""
              }

              Fornisci una valutazione dettagliata del codice, considerando:
              1. Correttezza funzionale
              2. Efficienza dell'algoritmo
              3. Leggibilità e stile del codice
              4. Gestione degli errori
              `;
  }

  // Use Groq to evaluate the answer with generateObject
  const { object: result } = await generateObject<EvaluationResult>({
    model: groq("llama3-70b-8192"),
    prompt,
    system:
      "Sei un esperto valutatore tecnico che analizza le risposte dei candidati durante i colloqui di lavoro. Fornisci valutazioni oggettive, dettagliate e costruttive.",
    schema: EvaluationResultSchema,
  });

  return {
    ...result,
    maxScore: 10,
  };
}

export async function generateOverallEvaluation(
  candidateName: string,
  answeredCount: number,
  totalCount: number,
  percentageScore: number,
  evaluations: Record<string, any>
) {
  // Extract strengths and weaknesses from evaluations
  const allStrengths: string[] = [];
  const allWeaknesses: string[] = [];

  Object.values(evaluations).forEach((evaluationItem: any) => {
    if (evaluationItem.strengths)
      allStrengths.push(...evaluationItem.strengths);
    if (evaluationItem.weaknesses)
      allWeaknesses.push(...evaluationItem.weaknesses);
  });

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
                  `;

  // Generate overall evaluation using AI
  const { object: result } = await generateObject<OverallEvaluation>({
    model: groq("llama3-70b-8192"),
    prompt,
    system:
      "Sei un esperto di reclutamento tecnico che fornisce valutazioni oggettive e costruttive dei candidati. Basa la tua valutazione esclusivamente sulle informazioni fornite.",
    schema: OverallEvaluationSchema,
  });

  return result;
}
