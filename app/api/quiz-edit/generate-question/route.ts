import { generateNewQuestionAction } from "@/lib/actions/quizzes";
import {
  generateQuestionRequestSchema,
  flexibleQuestionSchema as questionSchema,
} from "@/lib/schemas";
import { QuizErrorCode, QuizSystemError } from "@/lib/services/error-handler";
import { getErrorResponse } from "@/lib/utils/error-response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Rate limiting for question generation
const questionRateLimitMap = new Map<
  string,
  { count: number; resetTime: number }
>();
const QUESTION_RATE_LIMIT_REQUESTS = 10; // More generous for individual questions
const QUESTION_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkQuestionRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = questionRateLimitMap.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    questionRateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + QUESTION_RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= QUESTION_RATE_LIMIT_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

export type GenerateQuestionResponse = z.infer<typeof questionSchema>;

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    // Rate limiting
    const identifier =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkQuestionRateLimit(identifier)) {
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
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          code: QuizErrorCode.INVALID_INPUT,
        },
        { status: 400 }
      );
    }

    const validationResult = generateQuestionRequestSchema.safeParse(body);

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

    // Generate question using improved action
    const question = await generateNewQuestionAction({
      quizTitle: validatedData.quizTitle,
      positionTitle: validatedData.positionTitle,
      experienceLevel: validatedData.experienceLevel,
      skills: validatedData.skills,
      type: validatedData.type,
      previousQuestions: validatedData.previousQuestions,
      specificModel: validatedData.specificModel,
      instructions: validatedData.instructions,
    });

    // Log performance metrics
    const duration = performance.now() - startTime;
    console.log(`Question generation completed in ${duration.toFixed(2)}ms`);

    // Add performance headers for monitoring
    const headers = new Headers({
      "X-Generation-Time": duration.toString(),
      "X-Question-Type": validatedData.type,
    });

    return NextResponse.json(question, { headers });
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(
      `Question generation failed after ${duration.toFixed(2)}ms:`,
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
    service: "question-generation",
    timestamp: new Date().toISOString(),
  });
}
