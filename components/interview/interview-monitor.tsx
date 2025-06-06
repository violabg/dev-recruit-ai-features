"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Question } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import { prismLanguage } from "@/lib/utils";
import { Highlight, themes } from "prism-react-renderer";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface InterviewMonitorProps {
  interviewId: string;
  quizQuestions: Question[];
  answers: Record<string, any>;
  status: string;
}

export function InterviewMonitor({
  interviewId,
  quizQuestions,
  answers: initialAnswers,
  status,
}: InterviewMonitorProps) {
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);

  const supabase = createClient();

  // Set up real-time subscription for monitoring
  useEffect(() => {
    // Subscribe to the interview channel
    const channel = supabase
      .channel(`interview_${interviewId}`)
      .on("broadcast", { event: "answer_submitted" }, (payload) => {
        if (payload.payload.interview_id === interviewId) {
          setAnswers((prev) => ({
            ...prev,
            [payload.payload.question_id]: payload.payload.answer,
          }));
          setCurrentQuestionId(payload.payload.question_id);
        }
      })
      .on("broadcast", { event: "interview_started" }, (payload) => {
        if (payload.payload.interview_id === interviewId) {
          toast.error("Intervista iniziata", {
            description: "Il candidato ha iniziato l'intervista",
          });
        }
      })
      .on("broadcast", { event: "interview_completed" }, (payload) => {
        if (payload.payload.interview_id === interviewId) {
          toast.success("Intervista completata", {
            description: "Il candidato ha completato l'intervista",
          });
          setAnswers(payload.payload.answers);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [interviewId, supabase]);

  const getAnsweredQuestionsCount = () => {
    return Object.keys(answers).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-xl">Monitoraggio in tempo reale</h2>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected
                ? "bg-green-500"
                : status === "completed"
                ? "bg-blue-500"
                : "bg-yellow-500"
            }`}
          />
          <span className="text-sm">
            {isConnected
              ? "Connesso"
              : status === "completed"
              ? "Intervista completata"
              : "In attesa del candidato"}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progresso</CardTitle>
          <CardDescription>
            {getAnsweredQuestionsCount()} di {quizQuestions.length} domande
            completate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="gap-2 grid grid-cols-10">
            {quizQuestions.map((question, index) => {
              const isAnswered = !!answers[question.id];
              const isActive = question.id === currentQuestionId;

              return (
                <div
                  key={question.id}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium ${
                    isAnswered
                      ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                      : isActive
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                      : "border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                  }`}
                  title={`Domanda ${index + 1}`}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {quizQuestions.map((question, index) => {
          const isAnswered = !!answers[question.id];
          const isActive = question.id === currentQuestionId;

          return (
            <Card
              key={question.id}
              className={`transition-all ${
                isActive
                  ? "border-blue-500 shadow-md dark:border-blue-700"
                  : isAnswered
                  ? "border-green-200 dark:border-green-900"
                  : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {index + 1}. {question.question}
                  </CardTitle>
                  <div
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      isAnswered
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {isAnswered ? "Risposto" : "In attesa"}
                  </div>
                </div>
                <CardDescription>
                  {question.type === "multiple_choice"
                    ? "Risposta multipla"
                    : question.type === "open_question"
                    ? "Domanda aperta"
                    : "Snippet di codice"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAnswered ? (
                  <div className="space-y-2">
                    <div className="font-medium">Risposta del candidato:</div>
                    {question.type === "multiple_choice" &&
                      question.options && (
                        <div className="p-3 border rounded-md">
                          {
                            question.options[
                              Number.parseInt(answers[question.id])
                            ]
                          }
                        </div>
                      )}

                    {question.type === "open_question" && (
                      <div className="p-3 border rounded-md whitespace-pre-wrap">
                        {answers[question.id]}
                      </div>
                    )}

                    {question.type === "code_snippet" && question.language && (
                      <Highlight
                        theme={themes.vsDark}
                        code={answers[question.id].code}
                        language={prismLanguage(question.language)}
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
                              "p-4 rounded-lg font-mono text-sm bg-[oklch(0.18_0.02_260)] text-[oklch(0.95_0_0)] border border-[oklch(0.3_0.02_260)] " +
                              className
                            }
                            style={style}
                          >
                            <code className="break-words whitespace-pre-wrap">
                              {tokens.map((line, i) => {
                                const { key: lineKey, ...lineProps } =
                                  getLineProps({
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
                                        <span
                                          key={String(tokenKey)}
                                          {...rest}
                                        />
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </code>
                          </pre>
                        )}
                      </Highlight>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    Il candidato non ha ancora risposto a questa domanda.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
