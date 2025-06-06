"use server";

import {
  EvaluationResult,
  evaluationResultSchema,
  OverallEvaluation,
  overallEvaluationSchema,
} from "@/lib/schemas";
import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { getOptimalModel } from "../utils";

// Evaluation actions
export async function evaluateAnswer(
  question: any,
  answer: any,
  specificModel?: string
) {
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
              ${answer}
              \`\`\`

              Soluzione di esempio:
              \`\`\`
              ${question.sampleSolution}
              \`\`\`

              Fornisci una valutazione dettagliata del codice, considerando:
              1. Correttezza funzionale
              2. Efficienza dell'algoritmo
              3. Leggibilità e stile del codice
              4. Gestione degli errori

              Restituisci SOLO un oggetto JSON valido che rispetti esattamente questo schema: { evaluation: string, score: number, strengths: string[], weaknesses: string[] }. Non includere testo aggiuntivo, markdown o spiegazioni.
              `;
  }

  // Use Groq to evaluate the answer with generateObject
  const { object: result } = await generateObject<EvaluationResult>({
    model: groq(getOptimalModel("evaluation", specificModel)),
    prompt,
    system:
      "Sei un esperto valutatore tecnico che analizza le risposte dei candidati durante i colloqui di lavoro. Fornisci valutazioni oggettive, dettagliate e costruttive.",
    schema: evaluationResultSchema,
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
  evaluations: Record<string, any>,
  specificModel?: string
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
    model: groq(getOptimalModel("overall_evaluation", specificModel)),
    prompt,
    system:
      "Sei un esperto di reclutamento tecnico che fornisce valutazioni oggettive e costruttive dei candidati. Basa la tua valutazione esclusivamente sulle informazioni fornite.",
    schema: overallEvaluationSchema,
  });

  return result;
}
