import { AlertCircle, CheckCircle, Loader2, Save } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "success" | "error";

export const getSaveButtonContent = (saveStatus: SaveStatus) => {
  switch (saveStatus) {
    case "saving":
      return (
        <>
          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          Salvataggio...
        </>
      );
    case "success":
      return (
        <>
          <CheckCircle className="mr-2 w-4 h-4" />
          Salvato!
        </>
      );
    case "error":
      return (
        <>
          <AlertCircle className="mr-2 w-4 h-4" />
          Errore
        </>
      );
    default:
      return (
        <>
          <Save className="mr-2 w-4 h-4" />
          Salva Quiz
        </>
      );
  }
};

export const getSaveButtonVariant = (saveStatus: SaveStatus) => {
  switch (saveStatus) {
    case "success":
      return "default" as const;
    case "error":
      return "destructive" as const;
    default:
      return "default" as const;
  }
};

// Question type filter configuration
export const questionTypes = [
  { value: "multiple_choice", label: "Scelta multipla" },
  { value: "open_question", label: "Domanda aperta" },
  { value: "code_snippet", label: "Snippet di codice" },
] as const;

export const getQuestionTypeLabel = (type: string) => {
  switch (type) {
    case "multiple_choice":
      return "Scelta multipla";
    case "open_question":
      return "Aperta";
    case "code_snippet":
      return "Codice";
    default:
      return type;
  }
};
