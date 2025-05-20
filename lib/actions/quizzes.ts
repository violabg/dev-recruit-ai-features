"use server";

import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { questionSchema, quizDataSchema } from "./quiz-schemas";

// Quiz actions

type GenerateNewQuizActionParams = {
  positionId: string;
  quizTitle: string;
  questionCount: number;
  difficulty: number;
  includeMultipleChoice: boolean;
  includeOpenQuestions: boolean;
  includeCodeSnippets: boolean;
  instructions?: string;
  previousQuestions?: { question: string }[];
};

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

  // Generate quiz using the refactored action
  const quizData = await generateNewQuizAction({
    positionId,
    quizTitle: title,
    questionCount,
    difficulty,
    includeMultipleChoice,
    includeOpenQuestions,
    includeCodeSnippets,
    instructions,
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

export async function generateNewQuizAction({
  positionId,
  quizTitle,
  questionCount,
  difficulty,
  includeMultipleChoice,
  includeOpenQuestions,
  includeCodeSnippets,
  instructions,
  previousQuestions,
}: GenerateNewQuizActionParams) {
  const supabase = await createClient();
  // Get position details
  const { data: position, error: positionError } = await supabase
    .from("positions")
    .select("*")
    .eq("id", positionId)
    .single();

  if (positionError || !position) {
    throw new Error("Position not found");
  }

  let previousContext = "";
  if (previousQuestions && previousQuestions.length > 0) {
    previousContext = `\n\nDomande già presenti nel quiz precedente (da evitare o riformulare significativamente):\n${previousQuestions
      .map((q, i) => `#${i + 1}: ${q.question}`)
      .join("\n")}`;
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
                  - Titolo del Quiz: ${quizTitle}
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

                  ${
                    instructions
                      ? `Istruzioni aggiuntive: ${instructions}`
                      : "Istruzioni aggiuntive: Nessuna"
                  }
                  ${previousContext}

                  Genera un quiz con domande pertinenti alle competenze richieste e al livello di esperienza.
                  Se previousQuestions è fornito, assicurati che le nuove domande siano significativamente diverse.
                  IMPORTANTE: Per le domande di tipo 'multiple_choice', il campo 'correctAnswer' DEVE essere l'indice numerico (basato su zero) della risposta corretta nell'array 'options'.
                  `;

  const { object: quizData } = await generateObject({
    model: groq("llama3-70b-8192"),
    prompt,
    system:
      "You are a technical recruitment expert creating quizzes. The output MUST be a perfectly valid JSON object that STRICTLY ADHERES to the provided Zod schema. All JSON syntax (curly braces, square brackets, commas, double quotes for keys and string values) must be correct. \n\nKey Schema Rules:\n1. CRITICAL: Each question object in the 'questions' array MUST include the field name 'type' followed by its value. For example: `\"type\": \"multiple_choice\"`. Valid string values for 'type' are: 'multiple_choice', 'open_question', 'code_snippet'.\n2. For 'multiple_choice' questions, the 'correctAnswer' field MUST be a number (zero-based index of the correct option in the 'options' array). E.g., `\"correctAnswer\": 0`. The 'options' array must be present and contain strings.\n3. For 'open_question' and 'code_snippet' questions, OMIT the 'correctAnswer' field if a numeric answer is not applicable. OMIT the 'options' field if it is not applicable.\n4. ALL JSON field names (e.g., 'id', 'type', 'question', 'options', 'correctAnswer', 'codeSnippet') MUST be in English and match the schema case EXACTLY.\n5. Omit optional fields if they have no content, rather than using empty strings or empty arrays, unless the schema specifically requires an empty array.\n\nExample - multiple_choice: `{\"id\": \"q1\", \"type\": \"multiple_choice\", \"question\": \"What is 2+2?\", \"options\": [\"3\", \"4\", \"5\"], \"correctAnswer\": 1}`\nExample - open_question: `{\"id\": \"q2\", \"type\": \"open_question\", \"question\": \"Explain black holes.\"}`\n\nEnsure all textual content (questions, options, explanations, etc.) is in Italian, but all JSON structure, keys, and enum values are in English as per schema.",
    schema: quizDataSchema,
  });
  return quizData;
}

type GenerateNewQuestionActionParams = {
  quizTitle: string;
  positionTitle: string;
  experienceLevel: string;
  skills: string[];
  type: "multiple_choice" | "open_question" | "code_snippet";
  previousQuestions?: { question: string; type?: string }[]; // Adjusted to be more specific
  // currentIndex is removed as it was unused and not relevant to AI generation logic
};

export async function generateNewQuestionAction({
  quizTitle,
  positionTitle,
  experienceLevel,
  skills,
  type,
  previousQuestions,
}: GenerateNewQuestionActionParams) {
  let previousContext = "";
  if (previousQuestions && previousQuestions.length > 0) {
    previousContext = `\nDomande già presenti nel quiz (da evitare):\n${previousQuestions
      .map((q, i) => `#${i + 1}: ${q.question}`)
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
