"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";

interface QuestionProps {
  question: any;
  questionNumber: number;
  onAnswer: (answer: any) => void;
  currentAnswer: any;
}

export function InterviewQuestion({
  question,
  questionNumber,
  onAnswer,
  currentAnswer,
}: QuestionProps) {
  // Reset answer and code when question changes
  const [answer, setAnswer] = useState<any>(currentAnswer || null);
  const [code, setCode] = useState<string>(
    currentAnswer?.code ??
      (question.type === "code_snippet" ? question.codeSnippet || "" : "")
  );

  // Reset state when question changes
  useEffect(() => {
    setAnswer(currentAnswer || null);
    setCode(
      currentAnswer?.code ??
        (question.type === "code_snippet" ? question.codeSnippet || "" : "")
    );
  }, [question, currentAnswer]);

  const handleSubmitAnswer = () => {
    if (question.type === "multiple_choice") {
      onAnswer(answer);
    } else if (question.type === "open_question") {
      onAnswer(answer);
    } else if (question.type === "code_snippet") {
      onAnswer({ code });
    }
  };

  return (
    <Card key={questionNumber}>
      <CardHeader>
        <CardTitle className="text-xl">
          {questionNumber}. {question.question}
        </CardTitle>
        {question.type === "code_snippet" && (
          <CardDescription>
            {question.language && <span>Linguaggio: {question.language}</span>}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {question.type === "multiple_choice" && (
          <RadioGroup
            value={answer?.toString()}
            onValueChange={(value) => setAnswer(value)}
            className="space-y-3"
          >
            {question.options.map((option: string, index: number) => (
              <div
                key={index}
                className="flex items-center space-x-2 rounded-md border p-3"
              >
                <RadioGroupItem
                  value={index.toString()}
                  id={`option-${index}`}
                />
                <Label htmlFor={`option-${index}`} className="flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.type === "open_question" && (
          <Textarea
            placeholder="Scrivi la tua risposta qui..."
            className="min-h-32"
            value={answer || ""}
            onChange={(e) => setAnswer(e.target.value)}
          />
        )}

        {question.type === "code_snippet" && (
          <div className="space-y-4">
            {question.codeSnippet && (
              <div>
                <h3 className="mb-2 font-medium">Codice:</h3>
                <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
                  <code className="whitespace-pre-wrap break-words">
                    {question.codeSnippet}
                  </code>
                </pre>
              </div>
            )}
            <div>
              <h3 className="mb-2 font-medium">La tua soluzione:</h3>
              <Textarea
                placeholder="Scrivi il tuo codice qui..."
                className="min-h-40 font-mono"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSubmitAnswer}
            disabled={answer === null && code === ""}
          >
            Salva risposta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
