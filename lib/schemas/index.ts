// ====================
// SCHEMA ENTRY POINT
// ====================
// This file serves as the main entry point for all schema definitions.
// Individual schemas are organized in separate files by domain.

// Re-export all base schemas and types
export * from "./base";

// Re-export authentication schemas and types
export * from "./auth";

// Re-export profile schemas and types
export * from "./profile";

// Re-export position schemas and types
export * from "./position";

// Re-export candidate schemas and types
export * from "./candidate";

// Re-export question schemas and types
export * from "./question";

// Re-export quiz schemas and types
export * from "./quiz";

// Re-export API schemas and types
export * from "./api";

// Re-export assignment schemas and types
export * from "./assignment";

// Re-export evaluation schemas and types
export * from "./evaluation";

// Re-export AI generation schemas and types
export * from "./ai";
