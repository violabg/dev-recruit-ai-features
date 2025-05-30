"use client";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFieldArray, useFormContext } from "react-hook-form";

type MultipleChoiceFormProps = {
  index: number;
};

export const MultipleChoiceForm = ({ index }: MultipleChoiceFormProps) => {
  const form = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `questions.${index}.options`,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="font-medium">Opzioni</label>
        <div className="flex flex-col items-start gap-4">
          {fields.map((field, optIdx) => (
            <div key={field.id} className="flex items-center gap-2 w-full">
              <FormField
                name={`questions.${index}.options.${optIdx}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder={`Opzione ${optIdx + 1}`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => remove(optIdx)}
              >
                &times;
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => append("")}
          >
            + Aggiungi opzione
          </Button>
        </div>
      </div>
      <FormField
        name={`questions.${index}.correctAnswer`}
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Risposta corretta (indice)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0, 1, 2..."
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
      <FormField
        name={`questions.${index}.explanation`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Spiegazione</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Spiega perché questa è la risposta corretta..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
