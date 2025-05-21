"use server";

import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
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

  return quiz[0].id;

  // revalidatePath(`/dashboard/positions/${positionId}`);

  // if (quiz && quiz[0]) {
  //   redirect(`/dashboard/quizzes/${quiz[0].id}`);
  // } else {
  //   redirect(`/dashboard/positions/${positionId}`);
  // }
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
  console.log("🚀 ~ prompt:", prompt);

  const { object: quizData } = await generateObject({
    model: groq("llama3-70b-8192"),
    prompt,
    system: `
      You are a technical recruitment expert creating quizzes.
      The output MUST be a perfectly valid JSON object that STRICTLY ADHERES to the provided Zod schema.
      ABSOLUTELY NO extraneous characters. For example, after "options", it MUST be "options": [ not "options>": [ or "options\\u003e": [.
      Ensure all JSON syntax (curly braces, square brackets, commas, double quotes for keys and string values) is correct.
      String values within the JSON, including questions, options, and code snippets, MUST NOT contain unescaped newline characters (e.g., \\n). If a newline is intended in a string, it MUST be properly escaped as \\\\n.

      Key Schema Rules:
      1. CRITICAL: Each question object in the 'questions' array MUST ALWAYS include the field "type". The value of "type" MUST be one of ONLY these allowed strings: "multiple_choice", "open_question", or "code_snippet". Example: "type": "multiple_choice".
      2. For 'multiple_choice' questions:
         - The 'correctAnswer' field MUST be a number (zero-based index of the correct option). Example: "correctAnswer": 0.
         - The 'options' field MUST be an array of strings. Example: "options": ["Option 1", "Option 2\\\\nwith newline", "Option 3"]. The key MUST be exactly "options", followed by a colon, then the array.
      3. For 'open_question' and 'code_snippet' questions:
         - OMIT the 'correctAnswer' field if a numeric answer is not applicable.
         - OMIT the 'options' field.
      4. ALL JSON field names (e.g., 'id', 'type', 'question', 'options', 'correctAnswer', 'codeSnippet', 'sampleSolution', 'testCases') MUST be in English and match the schema case EXACTLY.
      5. OMIT optional fields (like 'codeSnippet', 'sampleSolution', 'testCases' for non-code questions, or 'explanation') if they have no content or are not applicable to the question type. Do not use empty strings or empty arrays for optional fields unless the schema specifically requires an empty array.

      Simplified Examples:
      - Multiple Choice: {"id": "q1", "type": "multiple_choice", "question": "What is 2+2?", "options": ["3", "4", "5"], "correctAnswer": 1}
      - Open Question: {"id": "q2", "type": "open_question", "question": "Explain black holes."}
      - Code Snippet: {"id": "q3", "type": "code_snippet", "question": "What does this code do?", "codeSnippet": "console.log('hello');"}

      Ensure all textual content (questions, options, etc.) is in Italian, but all JSON structure, keys, and enum values for 'type' are in English as per schema.
      Focus on generating clean, valid JSON. Double-check for unescaped newlines and ANY extraneous characters (like '>') before outputting. The JSON must be parsable.
    `,
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

export async function deleteQuiz(formData: FormData) {
  const id = formData.get("quiz_id");
  if (!id || typeof id !== "string") return;
  const supabase = await createClient();

  const { error: fetchError } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", id);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  redirect("/dashboard/quizzes");
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
  // revalidatePath(`/dashboard/quizzes/${quizId}`);
  // redirect(`/dashboard/quizzes/${quizId}`);
}
