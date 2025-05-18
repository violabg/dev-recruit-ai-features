"use server";

// This file is kept for backward compatibility
// All actions have been moved to separate files in the actions/ directory
// Please import from lib/actions/[category] instead

import * as CandidateActions from "./actions/candidates";
import * as EvaluationActions from "./actions/evaluations";
import * as InterviewActions from "./actions/interviews";
import * as PositionActions from "./actions/positions";
import * as QuizActions from "./actions/quizzes";

// Re-export all actions

export const { createPosition, deletePosition } = PositionActions;

export const { generateQuiz, deleteQuiz } = QuizActions;

export const { createCandidate } = CandidateActions;

export const {
  createInterview,
  startInterview,
  submitAnswer,
  completeInterview,
} = InterviewActions;

export const { evaluateAnswer, generateOverallEvaluation } = EvaluationActions;
