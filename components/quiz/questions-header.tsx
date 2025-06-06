"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionTypeFilter } from "@/hooks/use-question-management";
import { questionTypes } from "@/lib/utils/quiz-form-utils";
import { ChevronDown, ChevronUp, Plus, Sparkles } from "lucide-react";

type QuestionsHeaderProps = {
  fieldsLength: number;
  questionTypeFilter: QuestionTypeFilter;
  setQuestionTypeFilter: (filter: QuestionTypeFilter) => void;
  expandAllQuestions: () => void;
  collapseAllQuestions: () => void;
  onGenerateQuestion: (
    type: "multiple_choice" | "open_question" | "code_snippet"
  ) => void;
};

export const QuestionsHeader = ({
  fieldsLength,
  questionTypeFilter,
  setQuestionTypeFilter,
  expandAllQuestions,
  collapseAllQuestions,
  onGenerateQuestion,
}: QuestionsHeaderProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
        <div>
          <CardTitle>Domande ({fieldsLength})</CardTitle>
          <CardDescription>Gestisci le domande del quiz</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={expandAllQuestions}
              disabled={fieldsLength === 0}
              title="Espandi tutte le domande"
            >
              <ChevronDown className="w-4 h-4" />
              Espandi tutto
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={collapseAllQuestions}
              disabled={fieldsLength === 0}
              title="Chiudi tutte le domande"
            >
              <ChevronUp className="w-4 h-4" />
              Chiudi tutto
            </Button>
          </div>
          <div className="bg-border w-px h-6" />
          <Select
            value={questionTypeFilter}
            onValueChange={(value: QuestionTypeFilter) =>
              setQuestionTypeFilter(value)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[{ value: "all", label: "Tutti i tipi" }, ...questionTypes].map(
                (filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {questionTypes.map((item) => (
            <Button
              key={item.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onGenerateQuestion(item.value)}
            >
              <Sparkles className="mr-2 w-4 h-4" />
              {item.label}
              <Plus className="ml-2 w-4 h-4" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
