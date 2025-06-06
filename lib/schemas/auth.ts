import { z } from "zod";
import { emailSchema, passwordSchema } from "./base";

// ====================
// AUTHENTICATION SCHEMAS
// ====================

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z
  .object({
    first_name: z
      .string()
      .min(2, { message: "Nome deve essere almeno 2 caratteri" })
      .max(30, { message: "Nome deve essere massimo 30 caratteri" }),
    last_name: z
      .string()
      .min(2, { message: "Cognome deve essere almeno 2 caratteri" })
      .max(30, { message: "Cognome deve essere massimo 30 caratteri" }),
    email: emailSchema,
    password: passwordSchema,
    repeatPassword: passwordSchema,
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Passwords do not match",
    path: ["repeatPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    current_password: passwordSchema,
    new_password: z
      .string()
      .min(6, { message: "Password deve essere almeno 6 caratteri" })
      .max(100, { message: "Password deve essere massimo 100 caratteri" }),
    confirm_password: passwordSchema,
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Le password non corrispondono",
    path: ["confirm_password"],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "La nuova password deve essere diversa da quella attuale",
    path: ["new_password"],
  });

// ====================
// TYPE EXPORTS
// ====================

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
