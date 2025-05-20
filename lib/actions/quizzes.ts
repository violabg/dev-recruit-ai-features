"use server";

import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { questionSchema, quizDataSchema } from "./quiz-schemas";

// Quiz actions
export async function generateAndSaveQuiz(formData: FormData) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const positionId = formData.get("position_id") as string;
  const title = formData.get("title") as string;
  const instructions = formData.get("instructions") as string;
  const questionCount = Number.parseInt(
    formData.get("question_count") as string
  );
  const difficulty = Number.parseInt(formData.get("difficulty") as string);
  const includeMultipleChoice =
    formData.get("include_multiple_choice") === "true";
  const includeOpenQuestions =
    formData.get("include_open_questions") === "true";
  const includeCodeSnippets = formData.get("include_code_snippets") === "true";
  const enableTimeLimit = formData.get("enable_time_limit") === "true";
  const timeLimit = enableTimeLimit
    ? Number.parseInt(formData.get("time_limit") as string)
    : null;

  // Get position details
  const { data: position, error: positionError } = await supabase
    .from("positions")
    .select("*")
    .eq("id", positionId)
    .single();

  if (positionError || !position) {
    throw new Error("Position not found");
  }

  // Prepare the prompt for the AI
  const prompt = `
                  Genera un quiz tecnico per una posizione di "${
                    position.title
                  }" con livello "${position.experience_level}".

                  Competenze richieste: ${position.skills.join(", ")}
                  ${
                    position.description
                      ? `Descrizione della posizione: ${position.description}`
                      : ""
                  }

                  Parametri del quiz:
                  - Numero di domande: ${questionCount}
                  - Difficoltà (1-5): ${difficulty}
                  - Tipi di domande da includere:
                    ${
                      includeMultipleChoice
                        ? "- Domande a risposta multipla"
                        : ""
                    }
                    ${includeOpenQuestions ? "- Domande aperte" : ""}
                    ${
                      includeCodeSnippets
                        ? "- Snippet di codice e sfide di programmazione"
                        : ""
                    }

                  Istruzioni aggiuntive: ${instructions || "Nessuna"}

                  Genera un quiz con domande pertinenti alle competenze richieste e al livello di esperienza.
                  `;

  // Generate quiz using AI with generateObject
  const { object: quizData } = await generateObject({
    model: groq("llama3-70b-8192"),
    prompt,
    system:
      "Sei un esperto di reclutamento tecnico che crea quiz per valutare le competenze dei candidati. Genera quiz pertinenti, sfidanti ma equi, con domande chiare e risposte corrette.",
    schema: quizDataSchema,
  });

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
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/positions/${positionId}`);

  if (quiz && quiz[0]) {
    redirect(`/dashboard/quizzes/${quiz[0].id}`);
  } else {
    redirect(`/dashboard/positions/${positionId}`);
  }
}

export async function generateNewQuizAction(
  positionId: string,
  quizTitle: string,
  experienceLevel: string,
  skills: string[],
  questionCount: number,
  difficulty: number,
  previousQuestions?: { question: string }[]
) {
  let previousContext = "";
  if (previousQuestions && previousQuestions.length > 0) {
    previousContext = `\nDomande già presenti nel quiz precedente (da evitare):\n${previousQuestions
      .map((q, i) => `#${i + 1}: ${q.question}`)
      .join("\n")}`;
  }
  const prompt = `Genera un quiz tecnico diverso dal precedente per la posizione "${quizTitle}" (${experienceLevel}). Competenze richieste: ${skills.join(
    ", "
  )}. Numero di domande: ${questionCount}. Difficoltà: ${difficulty}.${previousContext}\nLe nuove domande devono essere diverse da quelle già presenti.`;
  const { object: quizData } = await generateObject({
    model: groq("llama3-70b-8192"),
    prompt,
    system:
      "Sei un esperto di reclutamento tecnico che crea quiz per valutare le competenze dei candidati. Genera quiz pertinenti, sfidanti ma equi, con domande chiare e risposte corrette.",
    schema: quizDataSchema,
  });
  return quizData;
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
    previousContext = `\nDomande già presenti nel quiz (da evitare):\n${previousQuestions
      .map((q: any, i: number) => `#${i + 1}: ${q.question}`)
      .join("\n")}`;
  }
  const prompt = `Genera una domanda di tipo ${type} per un quiz intitolato "${quizTitle}" per la posizione "${positionTitle}" (${experienceLevel}). Competenze richieste: ${skills.join(
    ", "
  )}.${previousContext}\nLa nuova domanda deve essere diversa da quelle già presenti.`;
  const { object: question } = await generateObject({
    model: groq("llama3-70b-8192"),
    prompt,
    system:
      "Sei un esperto di reclutamento tecnico che crea quiz per valutare le competenze dei candidati. Genera una domanda pertinente, sfidante ma equa, con risposta corretta.",
    schema: questionSchema,
  });
  return question;
}

export async function deleteQuiz(id: string) {
  const supabase = await createClient();

  const { data: quiz, error: fetchError } = await supabase
    .from("quizzes")
    .select("position_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const positionId = quiz?.position_id;

  const { error } = await supabase.from("quizzes").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/positions/${positionId}`);
  redirect(`/dashboard/positions/${positionId}`);
}

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
