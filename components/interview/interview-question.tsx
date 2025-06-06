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
import { Question } from "@/lib/schemas";
import { prismLanguage } from "@/lib/utils";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Highlight, themes } from "prism-react-renderer";
import { useEffect, useState } from "react";

type QuestionAnswer = string | { code: string } | null;

interface QuestionProps {
  question: Question;
  questionNumber: number;
  onAnswer: (answer: QuestionAnswer) => void;
  currentAnswer: QuestionAnswer;
  completed: boolean;
}

export function InterviewQuestion({
  question,
  questionNumber,
  onAnswer,
  currentAnswer,
  completed,
}: QuestionProps) {
  const { theme, resolvedTheme } = useTheme();

  // Use resolvedTheme to handle 'system' theme properly
  const monacoTheme =
    resolvedTheme === "dark" || theme === "dark" ? "vs-dark" : "light";

  // Reset answer and code when question changes
  const [answer, setAnswer] = useState<string | null>(
    typeof currentAnswer === "string" ? currentAnswer : null
  );
  const [code, setCode] = useState<string>("");
  // Reset state when question changes
  useEffect(() => {
    if (typeof currentAnswer === "string") {
      setAnswer(currentAnswer);
      setCode("");
    } else if (
      currentAnswer &&
      typeof currentAnswer === "object" &&
      "code" in currentAnswer
    ) {
      setAnswer(null);
      setCode(currentAnswer.code);
    } else {
      setAnswer(null);
      setCode("");
    }
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
            {question.options?.map((option: string, index: number) => (
              <div
                key={index}
                className="flex items-center space-x-2 p-3 border rounded-md"
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
                <Highlight
                  theme={themes.vsDark}
                  code={question.codeSnippet}
                  language={prismLanguage(question.language || "javascript")}
                >
                  {({
                    className,
                    style,
                    tokens,
                    getLineProps,
                    getTokenProps,
                  }) => (
                    <pre
                      className={
                        "mt-1 overflow-x-auto rounded-md bg-muted p-4 text-sm" +
                        className
                      }
                      style={style}
                    >
                      <code className="break-words whitespace-pre-wrap">
                        {tokens.map((line, i) => {
                          const { key: lineKey, ...lineProps } = getLineProps({
                            line,
                            key: i,
                          });
                          return (
                            <div key={String(lineKey)} {...lineProps}>
                              {line.map((token, key) => {
                                const { key: tokenKey, ...rest } =
                                  getTokenProps({
                                    token,
                                    key,
                                  });
                                return (
                                  <span key={String(tokenKey)} {...rest} />
                                );
                              })}
                            </div>
                          );
                        })}
                      </code>
                    </pre>
                  )}
                </Highlight>
              </div>
            )}
            <div>
              <h3 className="mb-2 font-medium">La tua soluzione:</h3>
              <div className="border rounded-md overflow-hidden">
                <Editor
                  height="300px"
                  language={question.language || "javascript"}
                  theme={monacoTheme}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: "on",
                    folding: true,
                    contextmenu: true,
                    selectOnLineNumbers: true,
                    scrollbar: {
                      vertical: "visible",
                      horizontal: "visible",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSubmitAnswer}
            disabled={(answer === null && code === "") || completed}
          >
            Salva risposta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
