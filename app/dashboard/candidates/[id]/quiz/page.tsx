import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { InvitesList } from "@/components/interview/invites-list";
import { QuizSelectionForm } from "@/components/quiz/quiz-selection-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { CandidateQuizData } from "@/lib/supabase/types";
import { SupabaseClient } from "@supabase/supabase-js";

const getData = async (
  candidateId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<CandidateQuizData> => {
  try {
    // Use the new database function to get all data in one call
    const { data, error } = await supabase.rpc("get_candidate_quiz_data", {
      p_candidate_id: candidateId,
      p_user_id: userId,
    });

    if (error || !data) {
      console.error("Database function error:", error);
      throw new Error("Failed to load candidate and quiz data");
    }

    // Parse the JSON response
    const result = data as CandidateQuizData;

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error: unknown) {
    let errorMessage = "Failed to load data";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error fetching data for CandidateQuizPage:", errorMessage);
    return redirect(
      `/dashboard/candidates/${candidateId}?error=${encodeURIComponent(
        errorMessage
      )}`
    );
  }
};

export default async function CandidateQuizPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: candidateId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirect("/login");
  }

  const { candidate, position, available_quizzes, assigned_interviews } =
    await getData(candidateId, user.id, supabase);

  if (!candidate || !position) {
    return (
      <div className="flex flex-col justify-center items-center h-[400px]">
        <p className="font-medium text-lg">Candidate or Position not found</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/candidates">Return to candidates</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/candidates/${candidateId}`}>
            <ArrowLeft className="mr-1 w-4 h-4" />
            Back to candidate
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-bold text-3xl">Assign quizzes to candidate</h1>
        <p className="text-muted-foreground">
          Assign quizzes for the position &quot;{position.title}&quot; to &quot;
          {candidate.name}&quot; ({candidate.email})
        </p>
      </div>

      <Tabs defaultValue="quizzes">
        <TabsList>
          <TabsTrigger value="quizzes">Assign quizzes</TabsTrigger>
          <TabsTrigger value="interviews">Existing interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign quizzes to candidate</CardTitle>
              <CardDescription>
                Select quizzes and create interview links for this candidate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuizSelectionForm
                candidateId={candidate.id}
                availableQuizzes={available_quizzes}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Existing interviews</CardTitle>
              <CardDescription>
                Manage interviews created for this candidate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvitesList assignedInterviews={assigned_interviews} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
