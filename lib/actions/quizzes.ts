"use server";

import { groq } from "@ai-sdk/groq";
import { generateObject, NoObjectGeneratedError } from "ai";
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

  let quizData;
  try {
    const result = await generateObject({
      model: groq("meta-llama/llama-4-maverick-17b-128e-instruct"),
      prompt,
      system: `
      You are a technical recruitment expert creating quizzes.
      The output MUST be a perfectly valid JSON object that STRICTLY ADHERES to the provided Zod schema.
      Crucially, each individual question within the 'questions' array must be a self-contained JSON object, enclosed in curly braces \`{}\`. For example, \`\\"questions\\": [ { /* question 1 data */ }, { /* question 2 data */ } ]\`. Do NOT output question properties directly into the array without enclosing them in an object.
      Every object in the 'questions' array MUST have all property names (e.g., "id", "type", "question", etc.) explicitly written, never as positional values.
      There MUST NOT be any trailing commas in arrays or objects.
      ABSOLUTELY NO extraneous characters. For example, after "options", it MUST be "options": [ not "options>": [ or "options\\u003e": [.\n      Ensure all JSON syntax (curly braces, square brackets, commas, double quotes for keys and string values) is correct.
      String values within the JSON, including questions, options, and code snippets, MUST NOT contain unescaped newline characters (e.g., \\n). If a newline is intended in a string, it MUST be properly escaped as \\\\n.

      ***CRITICAL WARNING:*** The key "options" MUST NEVER be written as "options>", "options\\u003e", "options >", or any variant. It MUST be exactly "options": [ (with a colon and no extra characters). If you output "options>" or "options\\u003e", the output is INVALID and must be regenerated.

      Key Schema Rules:
      1. CRITICAL: Each question object in the 'questions' array MUST ALWAYS include the field "type". The value of "type" MUST be one of ONLY these allowed strings: "multiple_choice", "open_question", or "code_snippet". Example: "type": "multiple_choice".
      2. For 'multiple_choice' questions:
         - The 'correctAnswer' field MUST be a number (zero-based index of the correct option). Example: "correctAnswer": 0.
         - The 'options' field MUST be an array of exactly 4 strings, each starting with "A)", "B)", "C)", or "D)" (in order). Example: "options": ["A) Opzione uno", "B) Opzione due", "C) Opzione tre", "D) Opzione quattro"]. The key MUST be exactly "options", followed by a colon, then the array, and always have a length of 4. ***NEVER write 'options>' or 'options\\u003e' or any variant.***
         - The 'id' field for each question MUST be in the format "q1", "q2", ..., "q10" (not Roman numerals or other formats).
         - All questions, options, and sample answers MUST be in Italian.
      3. For 'open_question' questions:
         - The 'sampleAnswer' field MUST be present and contain a plausible, concise answer in Italian. Example: "sampleAnswer": "Una risposta esemplificativa in italiano."
         - OMIT the 'correctAnswer' and 'options' fields.
      4. For 'code_snippet' questions:
         - OMIT the 'correctAnswer' and 'options' fields.
      5. ALL JSON field names (e.g., 'id', 'type', 'question', 'options', 'correctAnswer', 'codeSnippet', 'sampleSolution', 'testCases', 'sampleAnswer') MUST be in English and match the schema case EXACTLY.
      6. OMIT optional fields (like 'codeSnippet', 'sampleSolution', 'testCases' for non-code questions, or 'explanation') if they have no content or are not applicable to the question type. Do not use empty strings or empty arrays for optional fields unless the schema specifically requires an empty array.

      Simplified Examples:
      - Multiple Choice: {"id": "q1", "type": "multiple_choice", "question": "What is 2+2?", "options": ["2", "3", "4", "5"], "correctAnswer": 1}
      - Open Question: {"id": "q2", "type": "open_question", "question": "Spiega i buchi neri.", "sampleAnswer": "Un buco nero è un oggetto astronomico con un campo gravitazionale così forte che nulla può sfuggirgli."}
      - Code Snippet: {"id": "q3", "type": "code_snippet", "question": "Cosa fa questo codice?", "codeSnippet": "console.log('hello');"}

      DOUBLE-CHECK: Every property in an object must be separated by a comma, especially after arrays like "options". There must ALWAYS be a comma after the closing bracket of "options" before the next property (e.g., before "correctAnswer").
      Ensure all textual content (questions, options, etc.) is in Italian, but all JSON structure, keys, and enum values for 'type' are in English as per schema.
      Focus on generating clean, valid JSON. Double-check for unescaped newlines and ANY extraneous characters (like '>') before outputting. The JSON must be parsable.
      IF YOU ARE UNSURE, OUTPUT NOTHING RATHER THAN INVALID JSON.
    `,
      schema: quizDataSchema,
    });
    quizData = result.object;
  } catch (error: unknown) {
    if (NoObjectGeneratedError.isInstance(error)) {
      console.log("NoObjectGeneratedError");
      console.log("Cause:", error.cause);
      console.log("Text:", error.text);
      console.log("Response:", error.response);
      console.log("Usage:", error.usage);
      console.log("Finish Reason:", error.finishReason);
    }
    throw error;
  }
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
    model: groq("meta-llama/llama-4-maverick-17b-128e-instruct"),
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
