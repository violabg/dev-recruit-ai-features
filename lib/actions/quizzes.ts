"use server";

import { groq } from "@ai-sdk/groq";
import { generateObject, NoObjectGeneratedError } from "ai";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { getOptimalModel } from "../utils";
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
      model: groq(getOptimalModel("quiz_generation")),
      prompt,
      system: `
      You are a technical recruitment expert specializing in creating assessment quizzes. Generate valid JSON that adheres to the following specifications:

      Schema Requirements:

      1. Output must be parseable JSON
      2. Questions array must contain individual question objects
      3. All property names must be explicit and in English
      4. String values must use proper escape sequences
      5. No trailing commas allowed

      Question Types and Required Fields:

      1. Multiple Choice Questions (\`type: "multiple_choice"\`)
        - id: Format "q1" through "q10"
        - question: Italian text
        - options: Array of exactly 4 Italian strings
        - correctAnswer: Zero-based index number of the correct option
        - keywords: Array of relevant strings (optional)
        - explanation: Italian text (optional)

      2. Open Questions (\`type: "open_question"\`)

        - id: Format "q1" through "q10"
        - question: Italian text        
        - keywords: Array of relevant strings (optional)
        - sampleAnswer: Italian text
        - sampleSolution: if the question is about writing code, provide a valid code string as a sample solution
        - codeSnippet: if the question is about writing code, provide a valid code string as a code snippet
        - explanation: Italian text (optional)


      3. Code Questions (\`type: "code_snippet"\`)
        - id: Format "q1" through "q10"
        - question: Italian text, must be code related and ask to fix bugs, don't include code in the question text do it in the codeSnippet field
        - codeSnippet: Valid code string, must be relevant to the question and contain a bug if the question is about fixing bugs,
        - sampleSolution: Valid code string, must be the corrected version of the code snippet
        - language: Programming language of the code snippet (e.g., "javascript", "python", "java") MUST be always included

      Content Rules:

      - All questions and answers must be in Italian
      - JSON structure and field names must be in English
      - Question text must not contain unescaped newlines
      - Omit optional fields if not applicable
      - The "options" field must never be written as "options>" or any variant

      Example Structure:

      \`\`\`json
      {
        "questions": [
          {
            "id": "q1",
            "type": "multiple_choice",
            "question": "Italian question text",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": 0
          }
        ]
      }
      \`\`\`

      Notes:

      - Validate JSON before submission
      - Ensure proper comma placement
      - Use double quotes for all strings
      - Maintain consistent formatting

      Reference: https://json.org/
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
    model: groq(getOptimalModel("question_generation")),
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
