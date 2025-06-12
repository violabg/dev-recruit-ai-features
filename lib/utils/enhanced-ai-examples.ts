/**
 * Enhanced AI Generation Examples
 *
 * This file demonstrates advanced usage patterns for the enhanced AI generation system.
 * These examples can be integrated into the UI as preset buttons or smart generation modes.
 */

"use client";

import { QuestionType } from "@/lib/schemas";
import {
  createBackendQuestionParams,
  createCodeSnippetParams,
  createFrontendQuestionParams,
  createMultipleChoiceParams,
  createOpenQuestionParams,
} from "@/lib/utils/question-prompt-helpers";

type BaseConfig = {
  quizTitle: string;
  positionTitle: string;
  experienceLevel: string;
  skills: string[];
  previousQuestions: Array<{ question: string; type: string }>;
};

/**
 * Generate React-specific questions with optimized parameters
 */
export const generateReactQuestions = async (
  baseConfig: BaseConfig,
  questionIndex: number,
  difficulty: number = 3
) => {
  const examples = [
    // React Hooks Multiple Choice
    createMultipleChoiceParams(baseConfig, questionIndex, {
      focusAreas: ["React Hooks", "useEffect", "useState"],
      distractorComplexity: "moderate",
    }),

    // Component Architecture Open Question
    createOpenQuestionParams(baseConfig, questionIndex + 1, {
      requireCodeExample: true,
      expectedResponseLength: "medium",
      evaluationCriteria: ["component design", "reusability", "performance"],
    }),

    // React Performance Code Snippet
    createCodeSnippetParams(baseConfig, questionIndex + 2, {
      language: "javascript",
      bugType: "performance",
      codeComplexity: "intermediate",
      includeComments: true,
    }),
  ];

  return examples.map((params) => ({
    ...params,
    difficulty,
    instructions:
      "Focus on modern React best practices and real-world scenarios",
  }));
};

/**
 * Generate Node.js backend questions
 */
export const generateNodeJSQuestions = async (
  baseConfig: BaseConfig,
  questionIndex: number,
  difficulty: number = 4
) => {
  const examples = [
    // API Design Multiple Choice
    createMultipleChoiceParams(baseConfig, questionIndex, {
      focusAreas: ["REST API", "Express.js", "Middleware"],
      distractorComplexity: "complex",
    }),

    // Database Query Open Question
    createOpenQuestionParams(baseConfig, questionIndex + 1, {
      requireCodeExample: true,
      expectedResponseLength: "long",
      evaluationCriteria: ["query optimization", "security", "error handling"],
    }),

    // Security Vulnerability Code Snippet
    createCodeSnippetParams(baseConfig, questionIndex + 2, {
      language: "javascript",
      bugType: "security",
      codeComplexity: "advanced",
      includeComments: false,
    }),
  ];

  return examples.map((params) => ({
    ...params,
    difficulty,
    instructions:
      "Focus on production-ready Node.js applications and security best practices",
  }));
};

/**
 * Generate TypeScript-specific questions
 */
export const generateTypeScriptQuestions = async (
  baseConfig: BaseConfig,
  questionIndex: number,
  difficulty: number = 4
) => {
  const examples = [
    // Type System Multiple Choice
    createMultipleChoiceParams(baseConfig, questionIndex, {
      focusAreas: ["Type System", "Generics", "Utility Types"],
      distractorComplexity: "complex",
    }),

    // Advanced Types Open Question
    createOpenQuestionParams(baseConfig, questionIndex + 1, {
      requireCodeExample: true,
      expectedResponseLength: "medium",
      evaluationCriteria: [
        "type safety",
        "code readability",
        "maintainability",
      ],
    }),

    // Type Error Code Snippet
    createCodeSnippetParams(baseConfig, questionIndex + 2, {
      language: "typescript",
      bugType: "syntax",
      codeComplexity: "advanced",
      includeComments: true,
    }),
  ];

  return examples.map((params) => ({
    ...params,
    difficulty,
    instructions:
      "Focus on advanced TypeScript features and real-world type challenges",
  }));
};

/**
 * Generate Python data science questions
 */
export const generatePythonDataScienceQuestions = async (
  baseConfig: BaseConfig,
  questionIndex: number,
  difficulty: number = 3
) => {
  const examples = [
    // Pandas/NumPy Multiple Choice
    createMultipleChoiceParams(baseConfig, questionIndex, {
      focusAreas: ["Pandas", "NumPy", "Data Manipulation"],
      distractorComplexity: "moderate",
    }),

    // Algorithm Implementation Open Question
    createOpenQuestionParams(baseConfig, questionIndex + 1, {
      requireCodeExample: true,
      expectedResponseLength: "long",
      evaluationCriteria: [
        "algorithm efficiency",
        "code clarity",
        "edge case handling",
      ],
    }),

    // Performance Optimization Code Snippet
    createCodeSnippetParams(baseConfig, questionIndex + 2, {
      language: "python",
      bugType: "performance",
      codeComplexity: "intermediate",
      includeComments: true,
    }),
  ];

  return examples.map((params) => ({
    ...params,
    difficulty,
    instructions:
      "Focus on data science workflows and performance optimization",
  }));
};

/**
 * Generate questions for different experience levels
 */
export const generateByExperienceLevel = async (
  baseConfig: BaseConfig,
  questionIndex: number,
  type: QuestionType,
  experienceLevel: "junior" | "mid" | "senior"
) => {
  const difficultyMap = {
    junior: 2,
    mid: 3,
    senior: 4,
  };

  const complexityMap = {
    junior: "basic" as const,
    mid: "intermediate" as const,
    senior: "advanced" as const,
  };

  const distractorMap = {
    junior: "simple" as const,
    mid: "moderate" as const,
    senior: "complex" as const,
  };

  const difficulty = difficultyMap[experienceLevel];

  switch (type) {
    case "multiple_choice":
      return createMultipleChoiceParams(baseConfig, questionIndex, {
        distractorComplexity: distractorMap[experienceLevel],
      });

    case "open_question":
      return createOpenQuestionParams(baseConfig, questionIndex, {
        expectedResponseLength:
          experienceLevel === "junior" ? "short" : "medium",
        requireCodeExample: experienceLevel !== "junior",
      });

    case "code_snippet":
      return createCodeSnippetParams(baseConfig, questionIndex, {
        codeComplexity: complexityMap[experienceLevel],
        bugType: experienceLevel === "junior" ? "syntax" : "logic",
        includeComments: experienceLevel === "junior",
      });
  }

  return { ...baseConfig, questionIndex, difficulty };
};

/**
 * Smart question generation based on position skills
 */
export const generateSmartQuestions = async (
  baseConfig: BaseConfig,
  questionIndex: number,
  targetQuestionCount: number = 3
) => {
  const skills = baseConfig.skills.map((skill) => skill.toLowerCase());
  const questions = [];

  // Detect technology stack
  const isReactDeveloper = skills.some(
    (skill) =>
      skill.includes("react") || skill.includes("jsx") || skill.includes("next")
  );

  const isNodeDeveloper = skills.some(
    (skill) =>
      skill.includes("node") ||
      skill.includes("express") ||
      skill.includes("fastify")
  );

  const isTypeScriptDeveloper = skills.some(
    (skill) => skill.includes("typescript") || skill.includes("ts")
  );

  const isPythonDeveloper = skills.some(
    (skill) =>
      skill.includes("python") ||
      skill.includes("django") ||
      skill.includes("flask")
  );

  // Generate technology-specific questions
  if (isReactDeveloper && questions.length < targetQuestionCount) {
    const reactQuestions = await generateReactQuestions(
      baseConfig,
      questionIndex + questions.length
    );
    questions.push(
      ...reactQuestions.slice(0, targetQuestionCount - questions.length)
    );
  }

  if (isNodeDeveloper && questions.length < targetQuestionCount) {
    const nodeQuestions = await generateNodeJSQuestions(
      baseConfig,
      questionIndex + questions.length
    );
    questions.push(
      ...nodeQuestions.slice(0, targetQuestionCount - questions.length)
    );
  }

  if (isTypeScriptDeveloper && questions.length < targetQuestionCount) {
    const tsQuestions = await generateTypeScriptQuestions(
      baseConfig,
      questionIndex + questions.length
    );
    questions.push(
      ...tsQuestions.slice(0, targetQuestionCount - questions.length)
    );
  }

  if (isPythonDeveloper && questions.length < targetQuestionCount) {
    const pythonQuestions = await generatePythonDataScienceQuestions(
      baseConfig,
      questionIndex + questions.length
    );
    questions.push(
      ...pythonQuestions.slice(0, targetQuestionCount - questions.length)
    );
  }

  // Fill remaining slots with general frontend/backend questions
  while (questions.length < targetQuestionCount) {
    const remainingIndex = (questionIndex + questions.length) as number;

    if (
      isReactDeveloper ||
      skills.some((s) => s.includes("frontend") || s.includes("ui"))
    ) {
      questions.push(
        createFrontendQuestionParams(
          "multiple_choice",
          baseConfig,
          remainingIndex
        )
      );
    } else {
      questions.push(
        createBackendQuestionParams("open_question", baseConfig, remainingIndex)
      );
    }
  }

  return questions;
};

/**
 * Example usage in a React component
 */
export const useSmartGeneration = () => {
  const generateQuestionsForPosition = async (
    position: {
      title: string;
      experience_level: string;
      skills: string[];
    },
    quizTitle: string,
    startIndex: number = 1
  ) => {
    const baseConfig: BaseConfig = {
      quizTitle,
      positionTitle: position.title,
      experienceLevel: position.experience_level,
      skills: position.skills,
      previousQuestions: [],
    };

    // Generate smart questions based on position
    const questions = await generateSmartQuestions(baseConfig, startIndex, 5);

    return questions;
  };

  return { generateQuestionsForPosition };
};
