import { z } from "zod";
import { baseSchemas } from "./base";

// ====================
// CANDIDATE SCHEMAS
// ====================

export const candidateFormSchema = z.object({
  name: baseSchemas.name,
  email: baseSchemas.email,
  position_id: z.string().min(1, { message: "Seleziona una posizione." }),
});

// ====================
// TYPE EXPORTS
// ====================

export type CandidateFormData = z.infer<typeof candidateFormSchema>;
