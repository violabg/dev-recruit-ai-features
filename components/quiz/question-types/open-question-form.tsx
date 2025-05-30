"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Question, QuizForm } from "@/lib/actions/quiz-schemas";
import { UseFormReturn } from "react-hook-form";

type OpenQuestionFormProps = {
  form: UseFormReturn<QuizForm>;
  index: number;
  field: Question;
};

export const OpenQuestionForm = ({
  form,
  index,
  field,
}: OpenQuestionFormProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium">Risposta di esempio</label>
      <Textarea
        {...form.register(`questions.${index}.sampleAnswer`)}
        className="mt-1"
      />
      <div className="flex flex-col gap-2 mt-2">
        <label className="font-medium">
          Parole chiave (separate da virgola)
        </label>
        <Input
          defaultValue={field.keywords?.join(", ") || ""}
          onBlur={(e) => {
            const val = e.target.value
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
            form.setValue(`questions.${index}.keywords`, val);
          }}
        />
      </div>
    </div>
  );
};
