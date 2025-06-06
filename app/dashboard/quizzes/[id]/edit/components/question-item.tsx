"use client";

import {
  CodeSnippetForm,
  MultipleChoiceForm,
  OpenQuestionForm,
} from "@/components/quiz/question-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CodeSnippetQuestion, flexibleQuestionSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import {
  getQuestionTypeLabel,
  getSaveButtonContent,
  getSaveButtonVariant,
  SaveStatus,
} from "@/lib/utils/quiz-form-utils";
import { ChevronDown, ChevronUp, RefreshCw, Trash2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { EditQuizFormData } from "../hooks/use-edit-quiz-form";

type Question = z.infer<typeof flexibleQuestionSchema>;

type QuestionItemProps = {
  field: Question & { id: string };
  actualIndex: number;
  isExpanded: boolean;
  form: UseFormReturn<EditQuizFormData>;
  onToggleExpansion: (questionId: string) => void;
  onRegenerate: (index: number) => void;
  onRemove: (index: number) => void;
  aiLoading: boolean;
  // Section-specific save props
  hasQuestionChanges: boolean;
  onSaveQuestion: () => void;
  questionSaveStatus: SaveStatus;
};

export const QuestionItem = ({
  field,
  actualIndex,
  isExpanded,
  form,
  onToggleExpansion,
  onRegenerate,
  onRemove,
  aiLoading,
  hasQuestionChanges,
  onSaveQuestion,
  questionSaveStatus,
}: QuestionItemProps) => {
  return (
    <Card key={field.id} className="relative">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-muted-foreground text-sm">
              Domanda {actualIndex + 1}
            </span>
            <span className="inline-flex items-center bg-muted px-2.5 py-0.5 rounded-full font-medium text-xs">
              {getQuestionTypeLabel(field.type)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpansion(field.id)}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRegenerate(actualIndex)}
              disabled={aiLoading}
              title="Rigenera domanda con AI"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(actualIndex)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {!isExpanded && field.question && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {field.question}
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name={`questions.${actualIndex}.question`}
              render={({ field: questionField }) => (
                <FormItem>
                  <FormLabel>Testo della domanda</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Inserisci il testo della domanda"
                      {...questionField}
                      maxLength={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {field.type === "multiple_choice" && (
              <MultipleChoiceForm index={actualIndex} />
            )}
            {field.type === "open_question" && (
              <OpenQuestionForm index={actualIndex} />
            )}
            {field.type === "code_snippet" && (
              <CodeSnippetForm
                index={actualIndex}
                field={field as CodeSnippetQuestion}
              />
            )}
          </div>

          {hasQuestionChanges && (
            <CardFooter className="px-0 pt-4">
              <Button
                type="button"
                onClick={onSaveQuestion}
                disabled={questionSaveStatus === "saving"}
                variant={getSaveButtonVariant(questionSaveStatus)}
                className={cn(
                  questionSaveStatus === "success" &&
                    "bg-green-600 hover:bg-green-700",
                  questionSaveStatus === "error" &&
                    "bg-red-600 hover:bg-red-700"
                )}
              >
                {getSaveButtonContent(questionSaveStatus)}
              </Button>
            </CardFooter>
          )}
        </CardContent>
      )}
    </Card>
  );
};
