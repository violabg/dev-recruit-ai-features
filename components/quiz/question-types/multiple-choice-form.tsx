"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Question, QuizForm } from "@/lib/actions/quiz-schemas";
import { UseFormReturn } from "react-hook-form";

type MultipleChoiceFormProps = {
  form: UseFormReturn<QuizForm>;
  index: number;
  field: Question;
};

export const MultipleChoiceForm = ({
  form,
  index,
  field,
}: MultipleChoiceFormProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium">Opzioni</label>
      <div className="flex flex-col items-start gap-4">
        {field.options?.map((opt: string, optIdx: number) => (
          <div key={optIdx} className="flex items-center gap-2 w-full">
            <Input
              {...form.register(`questions.${index}.options.${optIdx}`)}
              className="w-full"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                const opts = form.getValues(`questions.${index}.options`) || [];
                opts.splice(optIdx, 1);
                form.setValue(`questions.${index}.options`, opts);
              }}
            >
              &times;
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            const opts = form.getValues(`questions.${index}.options`) || [];
            form.setValue(`questions.${index}.options`, [...opts, ""]);
          }}
        >
          + Aggiungi opzione
        </Button>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        <label className="font-medium">Risposta corretta (indice)</label>
        <Input
          type="number"
          {...form.register(`questions.${index}.correctAnswer`)}
          className="w-24"
        />
      </div>
      <div className="flex flex-col gap-2 mt-2">
        <label className="font-medium">Spiegazione</label>
        <Textarea
          {...form.register(`questions.${index}.explanation`)}
          className="mt-1"
        />
      </div>
    </div>
  );
};
