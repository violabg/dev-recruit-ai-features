import { createClient } from "@/lib/supabase/server";
import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple_choice", "open_question", "code_snippet"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  sampleAnswer: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  language: z.string().optional(),
  codeSnippet: z.string().optional(),
  sampleSolution: z.string().optional(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
      })
    )
    .optional(),
});

export async function updateQuizAction(formData: FormData) {
  const supabase = await createClient();
  const quizId = formData.get("quiz_id") as string;
  const title = formData.get("title") as string;
  const timeLimit = formData.get("time_limit")
    ? Number(formData.get("time_limit"))
    : null;
  const questions = JSON.parse(formData.get("questions") as string);

  const { error } = await supabase
    .from("quizzes")
    .update({
      title,
      time_limit: timeLimit,
      questions,
    })
    .eq("id", quizId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/quizzes/${quizId}`);
  redirect(`/dashboard/quizzes/${quizId}`);
}


export async function generateNewQuestionAction(
  quizTitle: string,
  positionTitle: string,
  experienceLevel: string,
  skills: string[],
  type: "multiple_choice" | "open_question" | "code_snippet",
  previousQuestions?: any[],
  currentIndex?: number
) {
  let previousContext = "";
  if (previousQuestions && previousQuestions.length > 0) {
    previousContext = `\nDomande già presenti nel quiz (da evitare):\n${previousQuestions.map((q: any, i: number) => `#${i + 1}: ${q.question}`).join("\n")}`;
  }
  const prompt = `Genera una domanda di tipo ${type} per un quiz intitolato "${quizTitle}" per la posizione "${positionTitle}" (${experienceLevel}). Competenze richieste: ${skills.join(", ")}.${previousContext}\nLa nuova domanda deve essere diversa da quelle già presenti.`;
  const { object: question } = await generateObject({
    model: groq("llama3-70b-8192"),
    prompt,
    system:
      "Sei un esperto di reclutamento tecnico che crea quiz per valutare le competenze dei candidati. Genera una domanda pertinente, sfidante ma equa, con risposta corretta.",
    schema: questionSchema,
  });
  return question;
}


export async function generateNewQuizAction(
  positionId: string,
  quizTitle: string,
  experienceLevel: string,
  skills: string[],
  questionCount: number,
  difficulty: number,
  previousQuestions?: any[]
) {
  let previousContext = "";
  if (previousQuestions && previousQuestions.length > 0) {
    previousContext = `\nDomande già presenti nel quiz precedente (da evitare):\n${previousQuestions.map((q: any, i: number) => `#${i + 1}: ${q.question}`).join("\n")}`;
  }
  const prompt = `Genera un quiz tecnico diverso dal precedente per la posizione "${quizTitle}" (${experienceLevel}). Competenze richieste: ${skills.join(", ")}. Numero di domande: ${questionCount}. Difficoltà: ${difficulty}.${previousContext}\nLe nuove domande devono essere diverse da quelle già presenti.`;
  const quizDataSchema = z.object({
    questions: z.array(questionSchema),
  });
  const { object: quizData } = await generateObject({
    model: groq("llama3-70b-8192"),
    prompt,
    system:
      "Sei un esperto di reclutamento tecnico che crea quiz per valutare le competenze dei candidati. Genera quiz pertinenti, sfidanti ma equi, con domande chiare e risposte corrette.",
    schema: quizDataSchema,
  });
  return quizData;
}
