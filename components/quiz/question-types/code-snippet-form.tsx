"use client";

import { programmingLanguages } from "@/components/positions/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Question, QuizForm } from "@/lib/actions/quiz-schemas";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { UseFormReturn } from "react-hook-form";
import { getLanguageCode } from ".";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false }
);

type CodeSnippetFormProps = {
  form: UseFormReturn<QuizForm>;
  index: number;
  field: Question;
  questionLanguages: Record<number, string>;
  setQuestionLanguages: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;
};

export const CodeSnippetForm = ({
  form,
  index,
  field,
  questionLanguages,
  setQuestionLanguages,
}: CodeSnippetFormProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="font-medium">Linguaggio di programmazione</label>
        <Select
          value={field.language || "JavaScript"}
          onValueChange={(value) =>
            setQuestionLanguages((prev) => ({
              ...prev,
              [index]: value,
            }))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Seleziona linguaggio" />
          </SelectTrigger>
          <SelectContent>
            {programmingLanguages.map((lang) => (
              <SelectItem key={lang} value={lang.toLowerCase()}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-medium">Snippet di codice</label>
        <CodeEditor
          value={form.watch(`questions.${index}.codeSnippet`) || ""}
          language={getLanguageCode(questionLanguages[index] || "JavaScript")}
          placeholder="Inserisci il codice qui..."
          onChange={(evn) =>
            form.setValue(`questions.${index}.codeSnippet`, evn.target.value)
          }
          padding={15}
          data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
          style={{
            fontSize: 14,
            backgroundColor: resolvedTheme === "dark" ? "#1a1a1a" : "#f8f9fa",
            fontFamily:
              "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: resolvedTheme === "dark" ? "#374151" : "#d1d5db",
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-medium">Soluzione di esempio</label>
        <CodeEditor
          value={form.watch(`questions.${index}.sampleSolution`) || ""}
          language={getLanguageCode(questionLanguages[index] || "JavaScript")}
          placeholder="Inserisci la soluzione qui..."
          onChange={(evn) =>
            form.setValue(`questions.${index}.sampleSolution`, evn.target.value)
          }
          padding={15}
          data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
          style={{
            fontSize: 14,
            backgroundColor: resolvedTheme === "dark" ? "#1a1a1a" : "#f8f9fa",
            fontFamily:
              "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: resolvedTheme === "dark" ? "#374151" : "#d1d5db",
          }}
        />
      </div>
    </div>
  );
};
