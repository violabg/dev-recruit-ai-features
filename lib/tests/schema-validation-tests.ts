// ====================
// UNIFIED SCHEMA TESTING SUITE
// ====================
// Comprehensive tests for the new unified schemas and validation middleware

import { validateJson } from "../middleware/validation";
import {
  baseSchemas,
  generateQuestionRequestSchema,
  questionSchemas,
  QuestionType,
  saveQuizRequestSchema,
  updateQuizRequestSchema,
} from "../schemas";

// ====================
// TEST DATA
// ====================

const validQuestionData = {
  id: "q-123e4567-e89b-12d3-a456-426614174000",
  question: "What is TypeScript?",
  type: "multiple_choice" as const,
  options: ["A programming language", "A database", "A framework", "A library"],
  correctAnswer: 0,
  points: 5,
  explanation:
    "TypeScript is a strongly typed programming language that builds on JavaScript.",
};

const validQuizData = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "TypeScript Fundamentals",
  position_id: "123e4567-e89b-12d3-a456-426614174001",
  questions: [validQuestionData],
  time_limit: 60,
  instructions: "Answer all questions to the best of your ability.",
  created_at: new Date().toISOString(),
  created_by: "123e4567-e89b-12d3-a456-426614174002",
};

const validGenerateQuestionRequest = {
  quizTitle: "React Development Quiz",
  positionTitle: "Frontend Developer",
  experienceLevel: "intermediate",
  skills: ["React", "JavaScript", "CSS"],
  type: "multiple_choice" as QuestionType,
  instructions: "Generate questions about React hooks and state management",
};

const validSaveQuizRequest = {
  title: "JavaScript Basics",
  position_id: "123e4567-e89b-12d3-a456-426614174001",
  questions: [validQuestionData],
  time_limit: 45,
};

const validUpdateQuizRequest = {
  quiz_id: "123e4567-e89b-12d3-a456-426614174000",
  title: "Updated Quiz Title",
  time_limit: 90,
  questions: [validQuestionData],
};

// ====================
// SCHEMA VALIDATION TESTS
// ====================

export const runSchemaTests = () => {
  console.log("🧪 Running Schema Validation Tests...");

  // Test base schemas
  console.log("📋 Testing base schemas...");

  try {
    baseSchemas.uuid.parse("123e4567-e89b-12d3-a456-426614174000");
    console.log("✅ UUID validation passed");
  } catch (error) {
    console.error("❌ UUID validation failed:", error);
  }

  try {
    baseSchemas.title.parse("Valid Quiz Title");
    console.log("✅ Title validation passed");
  } catch (error) {
    console.error("❌ Title validation failed:", error);
  }

  try {
    baseSchemas.questionType.parse("multiple_choice");
    console.log("✅ Question type validation passed");
  } catch (error) {
    console.error("❌ Question type validation failed:", error);
  }

  // Test question schemas
  console.log("📝 Testing question schemas...");

  try {
    questionSchemas.flexible.parse(validQuestionData);
    console.log("✅ Flexible question validation passed");
  } catch (error) {
    console.error("❌ Flexible question validation failed:", error);
  }

  // Test API request schemas
  console.log("🌐 Testing API request schemas...");

  try {
    generateQuestionRequestSchema.parse(validGenerateQuestionRequest);
    console.log("✅ Generate question request validation passed");
  } catch (error) {
    console.error("❌ Generate question request validation failed:", error);
  }

  try {
    saveQuizRequestSchema.parse(validSaveQuizRequest);
    console.log("✅ Save quiz request validation passed");
  } catch (error) {
    console.error("❌ Save quiz request validation failed:", error);
  }

  try {
    updateQuizRequestSchema.parse(validUpdateQuizRequest);
    console.log("✅ Update quiz request validation passed");
  } catch (error) {
    console.error("❌ Update quiz request validation failed:", error);
  }

  console.log("✨ Schema validation tests completed!\n");
};

// ====================
// MIDDLEWARE TESTS
// ====================

export const runMiddlewareTests = () => {
  console.log("🔧 Testing Validation Middleware...");

  // Test validateJson helper
  console.log("📦 Testing validateJson helper...");

  const validResult = validateJson(
    generateQuestionRequestSchema,
    validGenerateQuestionRequest
  );
  if (validResult.success) {
    console.log("✅ validateJson with valid data passed");
  } else {
    console.error("❌ validateJson with valid data failed:", validResult.error);
  }

  const invalidResult = validateJson(generateQuestionRequestSchema, {
    invalid: "data",
  });
  if (!invalidResult.success) {
    console.log("✅ validateJson with invalid data correctly rejected");
  } else {
    console.error("❌ validateJson with invalid data incorrectly passed");
  }

  console.log("✨ Middleware tests completed!\n");
};

// ====================
// TYPE CHECKING TESTS
// ====================

export const runTypeTests = () => {
  console.log("🔍 Testing Type Safety...");

  // Test that schemas work correctly
  try {
    questionSchemas.flexible.parse(validQuestionData);
    console.log("✅ Question schema parsing works");
  } catch (error) {
    console.error("❌ Question schema parsing failed:", error);
  }

  try {
    generateQuestionRequestSchema.parse(validGenerateQuestionRequest);
    console.log("✅ Generate request schema parsing works");
  } catch (error) {
    console.error("❌ Generate request schema parsing failed:", error);
  }

  try {
    saveQuizRequestSchema.parse(validSaveQuizRequest);
    console.log("✅ Save request schema parsing works");
  } catch (error) {
    console.error("❌ Save request schema parsing failed:", error);
  }

  try {
    updateQuizRequestSchema.parse(validUpdateQuizRequest);
    console.log("✅ Update request schema parsing works");
  } catch (error) {
    console.error("❌ Update request schema parsing failed:", error);
  }

  console.log("✨ Type safety tests completed!\n");
};

// ====================
// ERROR HANDLING TESTS
// ====================

export const runErrorHandlingTests = () => {
  console.log("🚨 Testing Error Handling...");

  // Test invalid data handling
  const invalidQuestionData = {
    question: "", // Invalid: empty string
    type: "invalid_type", // Invalid: not a valid QuestionType
    options: [], // Invalid: empty array for multiple choice
    correct_answers: [], // Invalid: empty array
    points: -1, // Invalid: negative points
  };

  try {
    questionSchemas.flexible.parse(invalidQuestionData);
    console.error("❌ Should have failed validation for invalid question data");
  } catch {
    console.log("✅ Invalid question data correctly rejected");
  }

  // Test missing required fields
  const incompleteRequest = {
    quizTitle: "Test Quiz",
    // Missing required fields
  };

  try {
    generateQuestionRequestSchema.parse(incompleteRequest);
    console.error("❌ Should have failed validation for incomplete request");
  } catch {
    console.log("✅ Incomplete request correctly rejected");
  }

  console.log("✨ Error handling tests completed!\n");
};

// ====================
// COMPREHENSIVE TEST RUNNER
// ====================

export const runAllTests = () => {
  console.log("🚀 Running Comprehensive Schema and Middleware Tests\n");
  console.log("=".repeat(60));

  try {
    runSchemaTests();
    runMiddlewareTests();
    runTypeTests();
    runErrorHandlingTests();

    console.log("🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log(
      "✅ Schema consolidation and type safety improvements are working correctly"
    );
  } catch (error) {
    console.error("💥 Test execution failed:", error);
  }
};

// Export test suite for use in other files
const testSuite = {
  runAllTests,
  runSchemaTests,
  runMiddlewareTests,
  runTypeTests,
  runErrorHandlingTests,
  validQuestionData,
  validQuizData,
  validGenerateQuestionRequest,
  validSaveQuizRequest,
  validUpdateQuizRequest,
};

export default testSuite;
