import { z } from "zod";
import { emailSchema, nameSchema } from "./base";

// ====================
// CANDIDATE SCHEMAS
// ====================

export const candidateFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  position_id: z.string().min(1, { message: "Seleziona una posizione." }),
});

// ====================
// TYPE EXPORTS
// ====================

export type CandidateFormData = z.infer<typeof candidateFormSchema>;
