import { z } from "zod";
import { difficultySchema, instructionsSchema } from "./base";

// ====================
// AI GENERATION SCHEMAS
// ====================

export const aiGenerationSchema = z.object({
  instructions: instructionsSchema,
  llmModel: z.string(),
  difficulty: difficultySchema.optional(),
});

// ====================
// TYPE EXPORTS
// ====================

export type AIGenerationFormData = z.infer<typeof aiGenerationSchema>;
