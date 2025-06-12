/**
 * Question Prompt Helpers
 *
 * Utility functions to help create type-specific question generation parameters
 * for the new modular prompt builder system.
 */

import {
  BaseQuestionParams,
  CodeSnippetQuestionParams,
  GenerateQuestionParams,
  MultipleChoiceQuestionParams,
  OpenQuestionParams,
} from "../services/ai-service";

// ====================
// PARAMETER BUILDERS
// ====================

/**
 * Creates base question parameters shared across all question types
 */
export const createBaseParams = (
  config: Omit<BaseQuestionParams, "questionIndex">
): Omit<BaseQuestionParams, "questionIndex"> => ({
  quizTitle: config.quizTitle,
  positionTitle: config.positionTitle,
  experienceLevel: config.experienceLevel,
  skills: config.skills,
  difficulty: config.difficulty || 3,
  previousQuestions: config.previousQuestions || [],
  specificModel: config.specificModel,
  instructions: config.instructions,
});

/**
 * Creates parameters for multiple choice question generation
 */
export const createMultipleChoiceParams = (
  baseConfig: Omit<BaseQuestionParams, "questionIndex">,
  questionIndex: number,
  options: {
    focusAreas?: string[];
    distractorComplexity?: "simple" | "moderate" | "complex";
  } = {}
): MultipleChoiceQuestionParams => ({
  ...createBaseParams(baseConfig),
  type: "multiple_choice",
  questionIndex,
  focusAreas: options.focusAreas,
  distractorComplexity: options.distractorComplexity,
});

/**
 * Creates parameters for open question generation
 */
export const createOpenQuestionParams = (
  baseConfig: Omit<BaseQuestionParams, "questionIndex">,
  questionIndex: number,
  options: {
    requireCodeExample?: boolean;
    expectedResponseLength?: "short" | "medium" | "long";
    evaluationCriteria?: string[];
  } = {}
): OpenQuestionParams => ({
  ...createBaseParams(baseConfig),
  type: "open_question",
  questionIndex,
  requireCodeExample: options.requireCodeExample,
  expectedResponseLength: options.expectedResponseLength,
  evaluationCriteria: options.evaluationCriteria,
});

/**
 * Creates parameters for code snippet question generation
 */
export const createCodeSnippetParams = (
  baseConfig: Omit<BaseQuestionParams, "questionIndex">,
  questionIndex: number,
  options: {
    language?: string;
    bugType?: "syntax" | "logic" | "performance" | "security";
    codeComplexity?: "basic" | "intermediate" | "advanced";
    includeComments?: boolean;
  } = {}
): CodeSnippetQuestionParams => ({
  ...createBaseParams(baseConfig),
  type: "code_snippet",
  questionIndex,
  language: options.language,
  bugType: options.bugType,
  codeComplexity: options.codeComplexity,
  includeComments: options.includeComments,
});

// ====================
// CONVENIENCE FUNCTIONS
// ====================

/**
 * Creates question parameters based on type with sensible defaults
 */
export const createQuestionParams = (
  type: "multiple_choice" | "open_question" | "code_snippet",
  baseConfig: Omit<BaseQuestionParams, "questionIndex">,
  questionIndex: number,
  typeSpecificOptions?: Record<string, unknown>
): GenerateQuestionParams => {
  switch (type) {
    case "multiple_choice":
      return createMultipleChoiceParams(
        baseConfig,
        questionIndex,
        typeSpecificOptions
      );
    case "open_question":
      return createOpenQuestionParams(
        baseConfig,
        questionIndex,
        typeSpecificOptions
      );
    case "code_snippet":
      return createCodeSnippetParams(
        baseConfig,
        questionIndex,
        typeSpecificOptions
      );
    default:
      throw new Error(`Unsupported question type: ${type}`);
  }
};

/**
 * Creates parameters for frontend development questions with smart defaults
 */
export const createFrontendQuestionParams = (
  type: "multiple_choice" | "open_question" | "code_snippet",
  baseConfig: Omit<BaseQuestionParams, "questionIndex">,
  questionIndex: number
): GenerateQuestionParams => {
  const frontendDefaults = {
    multiple_choice: {
      focusAreas: ["React", "JavaScript", "CSS", "DOM"],
      distractorComplexity: "moderate" as const,
    },
    open_question: {
      requireCodeExample: true,
      expectedResponseLength: "medium" as const,
      evaluationCriteria: [
        "technical accuracy",
        "best practices",
        "code quality",
      ],
    },
    code_snippet: {
      language: "javascript",
      bugType: "logic" as const,
      codeComplexity: "intermediate" as const,
      includeComments: true,
    },
  };

  return createQuestionParams(
    type,
    baseConfig,
    questionIndex,
    frontendDefaults[type]
  );
};

/**
 * Creates parameters for backend development questions with smart defaults
 */
export const createBackendQuestionParams = (
  type: "multiple_choice" | "open_question" | "code_snippet",
  baseConfig: Omit<BaseQuestionParams, "questionIndex">,
  questionIndex: number
): GenerateQuestionParams => {
  const backendDefaults = {
    multiple_choice: {
      focusAreas: ["APIs", "databases", "server architecture", "security"],
      distractorComplexity: "complex" as const,
    },
    open_question: {
      requireCodeExample: true,
      expectedResponseLength: "long" as const,
      evaluationCriteria: [
        "system design",
        "scalability",
        "security considerations",
      ],
    },
    code_snippet: {
      language: "javascript", // Can be overridden
      bugType: "security" as const,
      codeComplexity: "advanced" as const,
      includeComments: true,
    },
  };

  return createQuestionParams(
    type,
    baseConfig,
    questionIndex,
    backendDefaults[type]
  );
};

// ====================
// VALIDATION HELPERS
// ====================

/**
 * Validates that question parameters are properly formed
 */
export const validateQuestionParams = (
  params: GenerateQuestionParams
): boolean => {
  // Check base requirements
  if (!params.quizTitle || !params.positionTitle || !params.skills.length) {
    return false;
  }

  if (params.questionIndex < 1) {
    return false;
  }

  // Type-specific validation
  switch (params.type) {
    case "multiple_choice":
      // No additional validation needed for multiple choice
      break;
    case "open_question":
      // No additional validation needed for open questions
      break;
    case "code_snippet":
      // Code snippet questions should preferably have a language specified
      if (
        !params.language &&
        !params.skills.some((skill) =>
          ["javascript", "typescript", "python", "java", "c#", "php"].includes(
            skill.toLowerCase()
          )
        )
      ) {
        console.warn(
          "Code snippet question without explicit language or programming language in skills"
        );
      }
      break;
  }

  return true;
};

// ====================
// TYPE GUARDS
// ====================

export const isMultipleChoiceParams = (
  params: GenerateQuestionParams
): params is MultipleChoiceQuestionParams => {
  return params.type === "multiple_choice";
};

export const isOpenQuestionParams = (
  params: GenerateQuestionParams
): params is OpenQuestionParams => {
  return params.type === "open_question";
};

export const isCodeSnippetParams = (
  params: GenerateQuestionParams
): params is CodeSnippetQuestionParams => {
  return params.type === "code_snippet";
};

// ====================
// EXAMPLES
// ====================

/**
 * Example usage:
 *
 * ```typescript
 * // Create a multiple choice question for a React developer
 * const mcParams = createMultipleChoiceParams(
 *   {
 *     quizTitle: "React Assessment",
 *     positionTitle: "Frontend Developer",
 *     experienceLevel: "senior",
 *     skills: ["React", "TypeScript", "CSS"],
 *     difficulty: 4,
 *   },
 *   1,
 *   {
 *     focusAreas: ["React Hooks", "State Management"],
 *     distractorComplexity: "complex"
 *   }
 * );
 *
 * // Create a code snippet question for a Node.js developer
 * const codeParams = createCodeSnippetParams(
 *   {
 *     quizTitle: "Backend Assessment",
 *     positionTitle: "Backend Developer",
 *     experienceLevel: "mid",
 *     skills: ["Node.js", "Express", "MongoDB"],
 *     difficulty: 3,
 *   },
 *   2,
 *   {
 *     language: "javascript",
 *     bugType: "logic",
 *     codeComplexity: "intermediate",
 *     includeComments: true
 *   }
 * );
 *
 * // Use convenience function for frontend questions
 * const frontendParams = createFrontendQuestionParams(
 *   "open_question",
 *   baseConfig,
 *   3
 * );
 * ```
 */
