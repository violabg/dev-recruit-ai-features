import { z } from "zod";
import { baseSchemas } from "./base";

// ====================
// POSITION SCHEMAS
// ====================

export const positionFormSchema = z.object({
  title: z.string().min(2, {
    message: "Il titolo deve contenere almeno 2 caratteri.",
  }),
  description: baseSchemas.description,
  experience_level: z.string({
    required_error: "Seleziona un livello di esperienza.",
  }),
  skills: z.array(z.string()).min(1, {
    message: "Seleziona almeno una competenza.",
  }),
  soft_skills: z.array(z.string()).optional(),
  contract_type: z.string().optional(),
});

// ====================
// TYPE EXPORTS
// ====================

export type PositionFormData = z.infer<typeof positionFormSchema>;
