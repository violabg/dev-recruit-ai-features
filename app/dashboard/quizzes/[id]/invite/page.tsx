import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CandidateSelectionForm } from "@/components/interview/candidate-selection-form";
import { InvitesList } from "@/components/interview/invites-list"; // Import AssignedInterview type
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
import { SupabaseClient } from "@supabase/supabase-js";

const getData = async (
  quizId: string,
  userId: string,
  supabase: SupabaseClient
) => {
  try {
    // Call the Supabase function to get assigned and unassigned candidates
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_candidates_for_quiz_assignment",
      { quiz_id_param: quizId, p_user_id: userId }
    );

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw new Error(
        rpcError.message || "Failed to load candidate assignment data"
      );
    }

    if (rpcData && rpcData.error) {
      console.error("RPC Function Error:", rpcData.error);
      // Potentially redirect or show a specific error message based on rpcData.error
      return redirect(
        `/dashboard/quizzes/${quizId}?error=${encodeURIComponent(
          rpcData.error
        )}`
      );
    }

    return rpcData;
  } catch (error: unknown) {
    let errorMessage = "Failed to load data";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error(
      "Error fetching data for InviteCandidatesPage:",
      errorMessage
    );
    return redirect(
      `/dashboard/quizzes/${quizId}?error=${encodeURIComponent(errorMessage)}`
    );
  }
};

export default async function InviteCandidatesPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: quizId } = await params; // Destructure and rename id to quizId for clarity
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirect("/login");
  }

  const { quiz, position, assigned_interviews, unassigned_candidates } =
    await getData(quizId, user.id, supabase);

  // This check is redundant due to earlier checks but kept for safety
  if (!quiz || !position) {
    return (
      <div className="flex flex-col justify-center items-center h-[400px]">
        <p className="font-medium text-lg">Quiz or Position not found</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/quizzes">Return to quizzes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/quizzes/${quizId}`}>
            <ArrowLeft className="mr-1 w-4 h-4" />
            Back to quiz
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-bold text-3xl">Assign quiz to candidates</h1>
        <p className="text-muted-foreground">
          Assign the quiz &quot;{quiz.title}&quot; for the position &quot;
          {position.title}&quot; to candidates
        </p>
      </div>

      <Tabs defaultValue="candidates">
        <TabsList>
          <TabsTrigger value="candidates">Assign to candidates</TabsTrigger>
          <TabsTrigger value="interviews">Created interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign quiz to candidates</CardTitle>
              <CardDescription>
                Select candidates and create interview links for this quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CandidateSelectionForm
                quizId={quiz.id}
                unassignedCandidates={unassigned_candidates}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Created interviews</CardTitle>
              <CardDescription>
                Manage interviews created for this quiz
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
