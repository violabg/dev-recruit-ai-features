import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Available LLM models with their capabilities
export const LLM_MODELS = {
  // Production models - stable and reliable
  VERSATILE: "llama-3.3-70b-versatile", // 128K context, 32K output - Best for complex tasks
  INSTANT: "llama-3.1-8b-instant", // 128K context, 8K output - Fast for simple tasks

  // Preview models - experimental, may be discontinued
  REASONING: "deepseek-r1-distill-llama-70b", // 128K context - Best for evaluation/reasoning
  MAVERICK: "meta-llama/llama-4-maverick-17b-128e-instruct", // 131K context, 8K output
} as const;

// Task types for model selection
export type LLMTaskType =
  | "quiz_generation" // Complex quiz creation with multiple questions
  | "question_generation" // Single question creation
  | "evaluation" // Answer evaluation and scoring
  | "overall_evaluation" // Comprehensive candidate assessment
  | "simple_task"; // Basic text processing

/**
 * Returns the optimal LLM model for a given task type.
 * Balances performance, cost, and reliability based on task complexity.
 */
export const getOptimalModel = (taskType: LLMTaskType): string => {
  switch (taskType) {
    case "quiz_generation":
      // Complex multi-question generation needs high capability and large output
      return LLM_MODELS.VERSATILE;

    case "question_generation":
      // Single question generation can use faster model
      return LLM_MODELS.INSTANT;

    case "evaluation":
      // Answer evaluation benefits from reasoning capabilities
      return LLM_MODELS.REASONING;

    case "overall_evaluation":
      // Comprehensive assessment needs high capability
      return LLM_MODELS.VERSATILE;

    case "simple_task":
      // Basic tasks use fastest model
      return LLM_MODELS.INSTANT;

    default:
      // Default to versatile model for unknown tasks
      return LLM_MODELS.VERSATILE;
  }
};

// Legacy export for backward compatibility
export const LLM_MODEL = getOptimalModel("quiz_generation");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (name?: string | null) => {
  return (
    name
      ?.split(" ")
      ?.map((word) => word[0])
      ?.join("")
      ?.toUpperCase() || "U"
  );
};

export const prismLanguage = (language: string) => {
  switch ((language || "").toLowerCase()) {
    case "javascript":
    case "js":
      return "javascript";
    case "typescript":
    case "ts":
      return "typescript";
    case "python":
    case "py":
      return "python";
    case "java":
      return "typescript";
    case "c#":
    case "csharp":
      return "csharp";
    case "cpp":
    case "c++":
      return "cpp";
    case "go":
      return "go";
    case "ruby":
      return "ruby";
    case "php":
      return "php";
    case "swift":
      return "swift";
    case "kotlin":
      return "kotlin";
    case "html":
    case "css":
      return "markup";
    default:
      return "javascript";
  }
};

export function formatDate(dateString: string | null, showTime?: boolean) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(showTime && { hour: "2-digit", minute: "2-digit" }),
  };
  return new Intl.DateTimeFormat("it-IT", formatOptions).format(date);
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500 text-black";
    case "contacted":
      return "bg-blue-600";
    case "interviewing":
      return "bg-purple-500";
    case "hired":
      return "bg-green-500 text-black";
    case "rejected":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};
