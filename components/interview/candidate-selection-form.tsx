"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MultiSelect } from "@/components/ui/multi-select"; // Assuming MultiSelect is a custom component
import {
  assignCandidatesToQuiz,
  AssignCandidatesToQuizState,
} from "@/lib/actions/interviews";

const candidateSelectionSchema = z.object({
  candidateIds: z.array(z.string()).min(1, {
    message: "Please select at least one candidate.",
  }),
});

type CandidateSelectionValues = z.infer<typeof candidateSelectionSchema>;

interface Candidate {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface CandidateSelectionFormProps {
  quizId: string;
  unassignedCandidates: Candidate[];
  onSuccess?: () => void; // This might not be needed if revalidation handles updates
}

const initialState: AssignCandidatesToQuizState = {
  message: "",
};

export function CandidateSelectionForm({
  quizId,
  unassignedCandidates,
  onSuccess,
}: CandidateSelectionFormProps) {
  const [formState, formAction, isPending] = useActionState(
    // Use useActionState
    assignCandidatesToQuiz,
    initialState
  );
  const [createdLinks, setCreatedLinks] = useState<
    { candidateId: string; token: string; candidateName: string }[]
  >([]);

  const form = useForm<CandidateSelectionValues>({
    resolver: zodResolver(candidateSelectionSchema),
    defaultValues: {
      candidateIds: [],
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
      setCreatedLinks(
        formState.createdInterviews?.map((link) => ({
          ...link,
          candidateName:
            unassignedCandidates.find((c) => c.id === link.candidateId)?.name ||
            "Unknown",
        })) || []
      );
      if (onSuccess) {
        onSuccess(); // Consider if this is still needed with server-side revalidation
      }
    } else if (formState.message && formState.errors) {
      // Display general errors or specific field errors
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
  }, [formState, form, unassignedCandidates, onSuccess]);

  const copyInterviewLink = (token: string) => {
    const link = `${window.location.origin}/interview/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied", {
      description: "The interview link has been copied to your clipboard",
    });
  };

  const candidateOptions = unassignedCandidates.map((candidate) => ({
    label: `${candidate.name} (${candidate.email})`,
    value: candidate.id,
  }));

  if (unassignedCandidates.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center p-8 border border-dashed rounded-lg h-40 text-center">
        <p className="text-muted-foreground text-sm">
          No candidates available to assign for this quiz position.
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          All candidates in this position have already been assigned or there
          are no candidates in this position.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="quizId" value={quizId} />
          {form.watch("candidateIds").map((candidateId) => (
            <input
              key={candidateId}
              type="hidden"
              name="candidateIds"
              value={candidateId}
            />
          ))}

          <FormField
            control={form.control}
            name="candidateIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select candidates</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={candidateOptions}
                    onChange={field.onChange}
                    selected={field.value}
                    placeholder="Select candidates to assign this quiz"
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

      {/* Display created links */}
      {createdLinks.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Generated Interview Links</h3>
          <div className="space-y-2">
            {createdLinks.map((link) => (
              <div
                key={link.candidateId}
                className="flex justify-between items-center bg-muted/50 p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{link.candidateName}</div>
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
