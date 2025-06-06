"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  assignQuizzesToCandidate,
  AssignQuizzesToCandidateState,
} from "@/lib/actions/candidate-quiz-assignment";
import { QuizSelection, quizSelectionSchema } from "@/lib/schemas";

type QuizSelectionValues = QuizSelection;

interface Quiz {
  id: string;
  title: string;
  created_at: string;
  time_limit: number | null;
}

interface QuizSelectionFormProps {
  candidateId: string;
  availableQuizzes: Quiz[];
  onSuccess?: () => void;
}

const initialState: AssignQuizzesToCandidateState = {
  message: "",
};

export function QuizSelectionForm({
  candidateId,
  availableQuizzes,
  onSuccess,
}: QuizSelectionFormProps) {
  const [formState, formAction, isPending] = useActionState(
    assignQuizzesToCandidate,
    initialState
  );
  const [createdLinks, setCreatedLinks] = useState<
    {
      quizId: string;
      token: string;
      quizTitle: string;
    }[]
  >([]);

  const form = useForm<QuizSelectionValues>({
    resolver: zodResolver(quizSelectionSchema),
    defaultValues: {
      quizIds: [],
    },
  });

  useEffect(() => {
    if (formState.success) {
      toast.success("Interview links created", {
        description: `${
          formState.createdInterviews?.length || 0
        } interview links have been created successfully`,
      });
      form.reset();
      setCreatedLinks(formState.createdInterviews || []);
      if (onSuccess) {
        onSuccess();
      }
    } else if (formState.message && formState.errors) {
      const errorMessages = Object.values(formState.errors).flat().join(", ");
      toast.error("Error creating interviews", {
        description:
          formState.message || errorMessages || "An unknown error occurred",
      });
    } else if (formState.message && !formState.success && !formState.errors) {
      toast.error("Error", {
        description: formState.message,
      });
    }
  }, [formState, form, onSuccess]);

  const copyInterviewLink = (token: string) => {
    const link = `${window.location.origin}/interview/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied", {
      description: "The interview link has been copied to your clipboard",
    });
  };

  const quizOptions = availableQuizzes.map((quiz) => ({
    label: `${quiz.title}${quiz.time_limit ? ` (${quiz.time_limit} min)` : ""}`,
    value: quiz.id,
  }));

  return (
    <div className="space-y-6">
      {availableQuizzes.length === 0 ? (
        <div className="flex flex-col justify-center items-center p-8 border border-dashed rounded-lg h-40 text-center">
          <p className="text-muted-foreground text-sm">
            No quizzes available for this candidate&apos;s position.
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            Create quizzes for this position first before assigning them to
            candidates.
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="candidateId" value={candidateId} />
            {form.watch("quizIds").map((quizId) => (
              <input key={quizId} type="hidden" name="quizIds" value={quizId} />
            ))}

            <FormField
              control={form.control}
              name="quizIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select quizzes</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={quizOptions}
                      onChange={field.onChange}
                      selected={field.value}
                      placeholder="Select quizzes to assign to this candidate"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Creating interviews...
                </>
              ) : (
                <>
                  <Plus className="mr-2 w-4 h-4" />
                  Create interview links
                </>
              )}
            </Button>
          </form>
        </Form>
      )}

      {/* Display created links */}
      {createdLinks.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Generated Interview Links</h3>
          <div className="space-y-2">
            {createdLinks.map((link) => (
              <div
                key={link.quizId}
                className="flex justify-between items-center bg-muted/50 p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{link.quizTitle}</div>
                  <div className="text-muted-foreground text-sm">
                    Interview link ready
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyInterviewLink(link.token)}
                >
                  <Copy className="mr-1 w-4 h-4" />
                  Copy Link
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
