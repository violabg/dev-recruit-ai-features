"use client";

import { updateQuizAction } from "@/lib/actions/quizzes";
import {
  flexibleQuestionSchema,
  QuizForm,
  saveQuizRequestSchema,
} from "@/lib/schemas";
import { generateId } from "@/lib/utils/quiz-form-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Use the consolidated schemas with form-specific validation
const editQuizFormSchema = saveQuizRequestSchema.extend({
  position_id: z.string().optional(), // Make position_id optional for updates
  questions: z
    .array(flexibleQuestionSchema)
    .min(1, "Almeno una domanda è obbligatoria"),
});

export type EditQuizFormData = z.infer<typeof editQuizFormSchema>;

type UseEditQuizFormProps = {
  quiz: QuizForm;
  position: {
    id: string;
    title: string;
    experience_level: string;
    skills: string[];
  };
};

export const useEditQuizForm = ({ quiz, position }: UseEditQuizFormProps) => {
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  const form = useForm<EditQuizFormData>({
    resolver: zodResolver(editQuizFormSchema),
    defaultValues: {
      title: quiz.title,
      position_id: position.id,
      time_limit: quiz.time_limit,
      questions: quiz.questions,
    },
  });

  const { fields, append, prepend, remove, update } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const handleSave = async (data: EditQuizFormData) => {
    setSaveStatus("saving");

    try {
      const formData = new FormData();
      formData.append("quiz_id", quiz.id);
      formData.append("title", data.title);
      if (data.time_limit !== null) {
        formData.append("time_limit", data.time_limit.toString());
      }
      formData.append("questions", JSON.stringify(data.questions));

      await updateQuizAction(formData);

      setSaveStatus("success");
      toast.success("Quiz salvato con successo");

      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("error");
      console.error("Errore salvataggio:", error);

      let errorMessage = "Errore durante il salvataggio del quiz";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Errore salvataggio", {
        description: errorMessage,
      });

      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return {
    form,
    fields,
    append,
    prepend,
    remove,
    update,
    handleSave,
    saveStatus,
    generateId,
  };
};
