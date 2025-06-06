import { groq } from "@ai-sdk/groq";
import { generateObject, NoObjectGeneratedError } from "ai";
import {
  convertToStrictQuestions,
  Question,
  questionSchemas,
  QuestionType,
  quizDataSchema,
} from "../schemas";
import { getOptimalModel } from "../utils";

// AI-specific error types
export class AIGenerationError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AIGenerationError";
  }
}

export enum AIErrorCode {
  GENERATION_FAILED = "GENERATION_FAILED",
  MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE",
  TIMEOUT = "TIMEOUT",
  INVALID_RESPONSE = "INVALID_RESPONSE",
  RATE_LIMITED = "RATE_LIMITED",
  CONTENT_FILTERED = "CONTENT_FILTERED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
}

// Configuration interface
export interface AIGenerationConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  fallbackModels: string[];
}

// Default configuration
const DEFAULT_CONFIG: AIGenerationConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second base delay
  timeout: 60000, // 60 seconds
  fallbackModels: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
  ],
};

// Input sanitization to prevent prompt injection
function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";

  // Remove potential prompt injection patterns
  const dangerous_patterns = [
    /ignore\s+previous\s+instructions/gi,
    /forget\s+everything\s+above/gi,
    /you\s+are\s+now/gi,
    /new\s+instructions/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /user\s*:/gi,
    /<\s*script[^>]*>/gi,
    /javascript\s*:/gi,
    /data\s*:/gi,
  ];

  let sanitized = input;
  dangerous_patterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "[filtered]");
  });

  // Limit length to prevent token exhaustion
  return sanitized.substring(0, 2000);
}

// Retry mechanism with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  config: AIGenerationConfig
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof AIGenerationError) {
        if (error.code === AIErrorCode.CONTENT_FILTERED) {
          throw error; // Don't retry content filtering
        }
      }

      if (attempt < config.maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = config.retryDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Unknown error occurred during retry");
}

// Timeout wrapper
function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new AIGenerationError(
              "AI generation timed out",
              AIErrorCode.TIMEOUT
            )
          ),
        timeout
      )
    ),
  ]);
}

// Quiz generation parameters
export interface GenerateQuizParams {
  positionTitle: string;
  experienceLevel: string;
  skills: string[];
  description?: string;
  quizTitle: string;
  questionCount: number;
  difficulty: number;
  includeMultipleChoice: boolean;
  includeOpenQuestions: boolean;
  includeCodeSnippets: boolean;
  instructions?: string;
  previousQuestions?: { question: string }[];
  specificModel?: string;
}

// Question generation parameters - Updated to include difficulty and question index
export interface GenerateQuestionParams {
  quizTitle: string;
  positionTitle: string;
  experienceLevel: string;
  skills: string[];
  type: QuestionType;
  difficulty?: number;
  previousQuestions?: { question: string; type?: string }[];
  specificModel?: string;
  instructions?: string;
  questionIndex: number; // Add question index for proper ID generation
}

export class AIQuizService {
  private config: AIGenerationConfig;

  constructor(config: Partial<AIGenerationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Builds the appropriate system prompt for quiz or question generation
   * @param isSingleQuestion Whether to generate a single question or full quiz
   * @param questionIndex The index of the question (for single question generation)
   * @returns The system prompt string
   */
  private buildQuizSystem(
    isSingleQuestion: boolean = false,
    questionIndex?: number
  ): string {
    const questionStructure = isSingleQuestion
      ? "Generate a valid JSON object for a single question (NOT an array)"
      : "Generate valid JSON that contains a questions array with individual question objects";

    const idFormat = isSingleQuestion
      ? `Format "q${questionIndex || 1}" (use "q${
          questionIndex || 1
        }" for this specific question)`
      : 'Format "q1" through "q10"';

    const exampleId = isSingleQuestion ? `q${questionIndex || 1}` : "q1";

    const exampleStructure = isSingleQuestion
      ? `Example Single Question Structure:

        \`\`\`json
        {
          "id": "${exampleId}",
          "type": "multiple_choice",
          "question": "Cosa rappresenta il DOM in JavaScript?",
          "options": [
            "Document Object Model",
            "Data Object Management",
            "Dynamic Object Mapping",
            "Distributed Object Method"
          ],
          "correctAnswer": 0,
          "keywords": ["DOM", "JavaScript", "web"],
          "explanation": "Il DOM (Document Object Model) è una rappresentazione strutturata del documento HTML che permette a JavaScript di manipolare il contenuto e la struttura della pagina."
        }
        \`\`\`

        Ensure your output is a single question object matching this exact format.`
      : `Example Structure:

        \`\`\`json
        {
          "questions": [
            {
              "id": "q1",
              "type": "multiple_choice",
              "question": "Cosa rappresenta il DOM in JavaScript?",
              "options": [
                "Document Object Model",
                "Data Object Management",
                "Dynamic Object Mapping",
                "Distributed Object Method"
              ],
              "correctAnswer": 0,
              "keywords": ["DOM", "JavaScript", "web"],
              "explanation": "Il DOM (Document Object Model) è una rappresentazione strutturata del documento HTML che permette a JavaScript di manipolare il contenuto e la struttura della pagina."
            }
          ]
        }
        \`\`\`

        Ensure your output matches this exact format for seamless integration.`;

    return `
        You are a technical recruitment expert specializing in creating assessment ${
          isSingleQuestion ? "questions" : "quizzes"
        }. ${questionStructure} that adheres to the following specifications:
  
        Schema Requirements:
  
        1. Output must be parseable JSON
        ${
          !isSingleQuestion
            ? "2. Questions array must contain individual question objects"
            : ""
        }
        ${
          isSingleQuestion ? "2" : "3"
        }. All property names must be explicit and in English
        ${
          isSingleQuestion ? "3" : "4"
        }. String values must use proper escape sequences
        ${isSingleQuestion ? "4" : "5"}. No trailing commas allowed
  
        Question Types and Required Fields:
  
        1. Multiple Choice Questions (\`type: "multiple_choice"\`)
          - id: ${idFormat}
          - question: Italian text
          - options: Array of exactly 4 Italian strings
          - correctAnswer: Zero-based index number of the correct option
          - keywords: Array of relevant strings (optional)
          - explanation: Italian text (optional)
  
        2. Open Questions (\`type: "open_question"\`)
          - id: ${idFormat}
          - question: Italian text
          - keywords: Array of relevant strings (optional)
          - sampleAnswer: Italian text
          - sampleSolution: if the question is about writing code, provide a valid code string as a sample solution
          - codeSnippet: if the question is about writing code, provide a valid code string as a code snippet
          - explanation: Italian text (optional)
  
        3. Code Questions (\`type: "code_snippet"\`)
          - id: ${idFormat}
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
  
        ${exampleStructure}
      `;
  }
  private system = () => this.buildQuizSystem(false);

  private singleQuestionSystem = (questionIndex?: number) =>
    this.buildQuizSystem(true, questionIndex);

  private buildQuizPrompt(params: GenerateQuizParams): string {
    const {
      positionTitle,
      experienceLevel,
      skills,
      description,
      quizTitle,
      questionCount,
      difficulty,
      includeMultipleChoice,
      includeOpenQuestions,
      includeCodeSnippets,
      instructions,
      previousQuestions = [],
    } = params;

    // Sanitize all inputs
    const sanitizedTitle = sanitizeInput(positionTitle);
    const sanitizedDescription = description ? sanitizeInput(description) : "";
    const sanitizedQuizTitle = sanitizeInput(quizTitle);
    const sanitizedInstructions = instructions
      ? sanitizeInput(instructions)
      : "";

    const questionTypes = [];
    if (includeMultipleChoice) questionTypes.push("multiple_choice");
    if (includeOpenQuestions) questionTypes.push("open_question");
    if (includeCodeSnippets) questionTypes.push("code_snippet");

    const prompt = `Create a technical quiz for the position "${sanitizedTitle}" with ${questionCount} questions.

                    Position Details:
                    - Experience Level: ${experienceLevel}
                    - Required Skills: ${skills.join(", ")}
                    ${
                      sanitizedDescription
                        ? `- Description: ${sanitizedDescription}`
                        : ""
                    }

                    Quiz Requirements:
                    - Title: ${sanitizedQuizTitle}
                    - Number of questions: ${questionCount}
                    - Difficulty level: ${difficulty}/5
                    - Question types to include: ${questionTypes.join(", ")}
                    ${
                      sanitizedInstructions
                        ? `- Special instructions: ${sanitizedInstructions}`
                        : ""
                    }

                    ${
                      previousQuestions.length > 0
                        ? `
                    Avoid repeating these existing questions:
                    ${previousQuestions
                      .map((q) => `- ${sanitizeInput(q.question)}`)
                      .join("\n")}
                    `
                        : ""
                    }

                    Important Guidelines:
                    1. Create practical, job-relevant questions
                    2. Ensure questions test real-world application of skills
                    3. For code questions, use realistic scenarios
                    4. Make multiple choice options plausible but clearly distinguishable
                    5. Provide clear, concise explanations for correct answers
                    6. Vary question difficulty within the specified range

                    Generate exactly ${questionCount} questions following these specifications.`;

    return prompt;
  }

  private buildQuestionPrompt(params: GenerateQuestionParams): string {
    const {
      quizTitle,
      positionTitle,
      experienceLevel,
      skills,
      type,
      difficulty = 3,
      previousQuestions = [],
      instructions,
    } = params;

    // Sanitize inputs
    const sanitizedQuizTitle = sanitizeInput(quizTitle);
    const sanitizedPositionTitle = sanitizeInput(positionTitle);
    const sanitizedInstructions = instructions
      ? sanitizeInput(instructions)
      : "";

    const prompt = `Create a single ${type.replace(
      "_",
      " "
    )} question for the quiz "${sanitizedQuizTitle}" for the position "${sanitizedPositionTitle}".

                    Position Details:
                    - Experience Level: ${experienceLevel}
                    - Required Skills: ${skills.join(", ")}
                    - Difficulty level: ${difficulty}/5
                    ${
                      sanitizedInstructions
                        ? `- Special instructions: ${sanitizedInstructions}`
                        : ""
                    }

                    ${
                      previousQuestions.length > 0
                        ? `
                    Avoid repeating these existing questions:
                    ${previousQuestions
                      .map((q) => `- ${sanitizeInput(q.question)}`)
                      .join("\n")}
                    `
                        : ""
                    }

                    Question Requirements:
                    - Type: ${type}
                    - Must be practical and job-relevant
                    - Should test real-world application of skills
                    - Appropriate for ${experienceLevel} level
                    - Difficulty level: ${difficulty}/5

                    Generate exactly 1 question following these specifications.`;

    return prompt;
  }

  async generateQuiz(
    params: GenerateQuizParams
  ): Promise<{ questions: Question[] }> {
    const startTime = performance.now();

    try {
      const model = getOptimalModel("quiz_generation", params.specificModel);
      const prompt = this.buildQuizPrompt(params);

      console.log(`Starting quiz generation with model: ${model}`);

      const result = await withTimeout(
        withRetry(async () => {
          try {
            const response = await generateObject({
              model: groq(model),
              prompt,
              system: this.system(),
              schema: quizDataSchema,
              temperature: 0.7,
            });

            if (!response.object || !response.object.questions) {
              throw new AIGenerationError(
                "Invalid response structure from AI model",
                AIErrorCode.INVALID_RESPONSE,
                { response }
              );
            }

            return response.object;
          } catch (error) {
            if (error instanceof NoObjectGeneratedError) {
              throw new AIGenerationError(
                "AI model failed to generate valid quiz structure",
                AIErrorCode.GENERATION_FAILED,
                { originalError: error.message }
              );
            }
            throw error;
          }
        }, this.config),
        this.config.timeout
      );

      const duration = performance.now() - startTime;
      console.log(`Quiz generation completed in ${duration.toFixed(2)}ms`);

      return {
        questions: convertToStrictQuestions(result.questions),
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `Quiz generation failed after ${duration.toFixed(2)}ms:`,
        error
      );

      if (error instanceof AIGenerationError) {
        throw error;
      }

      // Try fallback models if available
      if (params.specificModel && this.config.fallbackModels.length > 0) {
        console.log("Attempting fallback models...");
        for (const fallbackModel of this.config.fallbackModels) {
          if (fallbackModel !== params.specificModel) {
            try {
              return await this.generateQuiz({
                ...params,
                specificModel: fallbackModel,
              });
            } catch {
              console.log(`Fallback model ${fallbackModel} also failed`);
              continue;
            }
          }
        }
      }

      throw new AIGenerationError(
        "All quiz generation attempts failed",
        AIErrorCode.GENERATION_FAILED,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  async generateQuestion(params: GenerateQuestionParams): Promise<Question> {
    const startTime = performance.now();

    try {
      const model = getOptimalModel(
        "question_generation",
        params.specificModel
      );
      const prompt = this.buildQuestionPrompt(params);

      console.log(`Starting question generation with model: ${model}`);

      const result = await withTimeout(
        withRetry(async () => {
          try {
            const response = await generateObject({
              model: groq(model),
              prompt,
              system: this.singleQuestionSystem(params.questionIndex), // Use questionIndex for proper ID generation
              schema: questionSchemas.flexible, // Use questionSchemas.flexible for single question
              temperature: 0.7,
            });

            if (!response.object) {
              throw new AIGenerationError(
                "Invalid response structure from AI model",
                AIErrorCode.INVALID_RESPONSE,
                { response }
              );
            }

            return response.object;
          } catch (error) {
            console.log("🚀 ~ AIQuizService ~ withRetry ~ error:", error);
            if (error instanceof NoObjectGeneratedError) {
              throw new AIGenerationError(
                "AI model failed to generate valid question structure",
                AIErrorCode.GENERATION_FAILED,
                { originalError: error.message }
              );
            }
            throw error;
          }
        }, this.config),
        this.config.timeout
      );

      const duration = performance.now() - startTime;
      console.log(`Question generation completed in ${duration.toFixed(2)}ms`);

      // Convert the single question result to strict type
      if (!result || !result.question) {
        throw new AIGenerationError(
          "No question generated in response",
          AIErrorCode.INVALID_RESPONSE,
          { result }
        );
      }

      const strictQuestions = convertToStrictQuestions([result]);
      return strictQuestions[0];
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `Question generation failed after ${duration.toFixed(2)}ms:`,
        error
      );

      if (error instanceof AIGenerationError) {
        throw error;
      }

      // Try fallback models if available
      if (params.specificModel && this.config.fallbackModels.length > 0) {
        console.log("Attempting fallback models...");
        for (const fallbackModel of this.config.fallbackModels) {
          if (fallbackModel !== params.specificModel) {
            try {
              return await this.generateQuestion({
                ...params,
                specificModel: fallbackModel,
              });
            } catch {
              console.log(`Fallback model ${fallbackModel} also failed`);
              continue;
            }
          }
        }
      }

      throw new AIGenerationError(
        "All question generation attempts failed",
        AIErrorCode.GENERATION_FAILED,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }
}

// Export a singleton instance for use throughout the application
export const aiQuizService = new AIQuizService();
