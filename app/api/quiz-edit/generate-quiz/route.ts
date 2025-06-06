import { quizDataSchema } from "@/lib/actions/quiz-schemas";
import { generateNewQuizAction } from "@/lib/actions/quizzes";
import { QuizErrorCode, QuizSystemError } from "@/lib/services/error-handler";
import { getErrorResponse } from "@/lib/utils/error-response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Enhanced request validation schema with strict typing
const generateQuizRequestSchema = z.object({
  positionId: z.string().uuid("Invalid position ID format"),
  quizTitle: z
    .string()
    .min(1, "Quiz title is required")
    .max(200, "Quiz title too long"),
  questionCount: z
    .number()
    .int()
    .min(1, "At least 1 question required")
    .max(50, "Maximum 50 questions allowed"),
  difficulty: z
    .number()
    .int()
    .min(1, "Difficulty minimum is 1")
    .max(5, "Difficulty maximum is 5"),
  previousQuestions: z
    .array(
      z.object({
        question: z.string().min(1, "Question text required"),
      })
    )
    .optional(),
  includeMultipleChoice: z.boolean(),
  includeOpenQuestions: z.boolean(),
  includeCodeSnippets: z.boolean(),
  specificModel: z.string().optional(),
  instructions: z.string().max(2000, "Instructions too long").optional(),
});

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Request size validation
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB

export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;
export type GenerateQuizResponse = z.infer<typeof quizDataSchema>;

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    // Check request size
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        {
          error: "Request too large",
          code: QuizErrorCode.INVALID_INPUT,
        },
        { status: 413 }
      );
    }

    // Rate limiting
    const identifier =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          code: QuizErrorCode.RATE_LIMITED,
        },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
          },
        }
      );
    }

    // Parse and validate request body
    let body: any;
    try {
      body = (await req.json()) as GenerateQuizRequest;
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          code: QuizErrorCode.INVALID_INPUT,
        },
        { status: 400 }
      );
    }

    const validationResult = generateQuizRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          code: QuizErrorCode.INVALID_INPUT,
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Validate that at least one question type is selected
    if (
      !validatedData.includeMultipleChoice &&
      !validatedData.includeOpenQuestions &&
      !validatedData.includeCodeSnippets
    ) {
      return NextResponse.json(
        {
          error: "At least one question type must be selected",
          code: QuizErrorCode.INVALID_INPUT,
        },
        { status: 400 }
      );
    }

    // Generate quiz using improved action
    const aiQuiz = await generateNewQuizAction({
      positionId: validatedData.positionId,
      quizTitle: validatedData.quizTitle,
      questionCount: validatedData.questionCount,
      difficulty: validatedData.difficulty,
      includeMultipleChoice: validatedData.includeMultipleChoice,
      includeOpenQuestions: validatedData.includeOpenQuestions,
      includeCodeSnippets: validatedData.includeCodeSnippets,
      previousQuestions: validatedData.previousQuestions,
      specificModel: validatedData.specificModel,
      instructions: validatedData.instructions,
    });

    // Log performance metrics
    const duration = performance.now() - startTime;
    console.log(`Quiz generation completed in ${duration.toFixed(2)}ms`);

    // Add performance headers for monitoring
    const headers = new Headers({
      "X-Generation-Time": duration.toString(),
      "X-Question-Count": validatedData.questionCount.toString(),
    });

    return NextResponse.json(aiQuiz, { headers });
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(
      `Quiz generation failed after ${duration.toFixed(2)}ms:`,
      error
    );

    const errorResponse = getErrorResponse(error);

    // Determine appropriate HTTP status code
    let status = 500;
    if (error instanceof QuizSystemError) {
      switch (error.code) {
        case QuizErrorCode.INVALID_INPUT:
        case QuizErrorCode.INVALID_QUIZ_PARAMS:
          status = 400;
          break;
        case QuizErrorCode.UNAUTHORIZED:
          status = 401;
          break;
        case QuizErrorCode.POSITION_NOT_FOUND:
          status = 404;
          break;
        case QuizErrorCode.SERVICE_UNAVAILABLE:
          status = 503;
          break;
        case QuizErrorCode.TIMEOUT:
          status = 408;
          break;
        case QuizErrorCode.RATE_LIMITED:
          status = 429;
          break;
        default:
          status = 500;
      }
    }

    return NextResponse.json(errorResponse, { status });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "quiz-generation",
    timestamp: new Date().toISOString(),
  });
}
