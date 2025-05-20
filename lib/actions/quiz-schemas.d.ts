export declare const questionSchema: import("zod").ZodObject<
  {
    id: import("zod").ZodString;
    type: import("zod").ZodEnum<
      ["multiple_choice", "open_question", "code_snippet"]
    >;
    question: import("zod").ZodString;
    options: import("zod").ZodOptional<
      import("zod").ZodArray<import("zod").ZodString, "many">
    >;
    correctAnswer: import("zod").ZodOptional<import("zod").ZodString>;
    explanation: import("zod").ZodOptional<import("zod").ZodString>;
    sampleAnswer: import("zod").ZodOptional<import("zod").ZodString>;
    keywords: import("zod").ZodOptional<
      import("zod").ZodArray<import("zod").ZodString, "many">
    >;
    language: import("zod").ZodOptional<import("zod").ZodString>;
    codeSnippet: import("zod").ZodOptional<import("zod").ZodString>;
    sampleSolution: import("zod").ZodOptional<import("zod").ZodString>;
    testCases: import("zod").ZodOptional<
      import("zod").ZodArray<
        import("zod").ZodObject<
          {
            input: import("zod").ZodString;
            expectedOutput: import("zod").ZodString;
          },
          "strip",
          import("zod").ZodTypeAny,
          {
            input: string;
            expectedOutput: string;
          },
          {
            input: string;
            expectedOutput: string;
          }
        >,
        "many"
      >
    >;
  },
  "strip",
  import("zod").ZodTypeAny,
  {
    id: string;
    type: "multiple_choice" | "open_question" | "code_snippet";
    question: string;
    options?: string[] | undefined;
    correctAnswer?: string | undefined;
    explanation?: string | undefined;
    sampleAnswer?: string | undefined;
    keywords?: string[] | undefined;
    language?: string | undefined;
    codeSnippet?: string | undefined;
    sampleSolution?: string | undefined;
    testCases?:
      | {
          input: string;
          expectedOutput: string;
        }[]
      | undefined;
  },
  {
    id: string;
    type: "multiple_choice" | "open_question" | "code_snippet";
    question: string;
    options?: string[] | undefined;
    correctAnswer?: string | undefined;
    explanation?: string | undefined;
    sampleAnswer?: string | undefined;
    keywords?: string[] | undefined;
    language?: string | undefined;
    codeSnippet?: string | undefined;
    sampleSolution?: string | undefined;
    testCases?:
      | {
          input: string;
          expectedOutput: string;
        }[]
      | undefined;
  }
>;

export declare const quizDataSchema: import("zod").ZodObject<
  {
    questions: import("zod").ZodArray<typeof questionSchema, "many">;
  },
  "strip",
  import("zod").ZodTypeAny,
  {
    questions: Array<{
      id: string;
      type: "multiple_choice" | "open_question" | "code_snippet";
      question: string;
      options?: string[] | undefined;
      correctAnswer?: string | undefined;
      explanation?: string | undefined;
      sampleAnswer?: string | undefined;
      keywords?: string[] | undefined;
      language?: string | undefined;
      codeSnippet?: string | undefined;
      sampleSolution?: string | undefined;
      testCases?:
        | {
            input: string;
            expectedOutput: string;
          }[]
        | undefined;
    }>;
  },
  {
    questions: Array<{
      id: string;
      type: "multiple_choice" | "open_question" | "code_snippet";
      question: string;
      options?: string[] | undefined;
      correctAnswer?: string | undefined;
      explanation?: string | undefined;
      sampleAnswer?: string | undefined;
      keywords?: string[] | undefined;
      language?: string | undefined;
      codeSnippet?: string | undefined;
      sampleSolution?: string | undefined;
      testCases?:
        | {
            input: string;
            expectedOutput: string;
          }[]
        | undefined;
    }>;
  }
>;
