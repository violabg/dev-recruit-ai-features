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
import { SupabaseClient } from "@supabase/supabase-js";

const getData = async (
  candidateId: string,
  userId: string,
  supabase: SupabaseClient
) => {
  try {
    // Get candidate information
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select(
        `
        id,
        name,
        email,
        status,
        position_id,
        created_by,
        positions (
          id,
          title
        )
      `
      )
      .eq("id", candidateId)
      .eq("created_by", userId)
      .single();

    if (candidateError || !candidate) {
      console.error("Candidate error:", candidateError);
      throw new Error(
        "Candidate not found or you don't have permission to view it"
      );
    }

    // Get all quizzes for the candidate's position
    const { data: allQuizzes, error: quizzesError } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        title,
        created_at,
        time_limit,
        position_id
      `
      )
      .eq("position_id", candidate.position_id)
      .eq("created_by", userId);

    if (quizzesError) {
      console.error("Quizzes error:", quizzesError);
      throw new Error("Failed to load available quizzes");
    }

    // Get existing interviews for this candidate to filter out already assigned quizzes
    const { data: existingInterviews, error: existingInterviewsError } =
      await supabase
        .from("interviews")
        .select(
          `
        id,
        token,
        status,
        created_at,
        started_at,
        completed_at,
        candidate_id,
        quiz_id,
        quizzes (
          title
        ),
        candidates (
          name,
          email
        )
      `
        )
        .eq("candidate_id", candidateId);

    if (existingInterviewsError) {
      throw new Error("Failed to check existing assignments");
    }

    // Filter out quizzes that are already assigned to this candidate
    const assignedQuizIds = new Set(
      existingInterviews?.map((i) => i.quiz_id) || []
    );
    const availableQuizzes = (allQuizzes || []).filter(
      (quiz) => !assignedQuizIds.has(quiz.id)
    );

    // Transform interviews data to match AssignedInterview interface

    const assignedInterviews = (existingInterviews || []).map(
      (interview: any) => ({
        id: interview.id,
        token: interview.token,
        status: interview.status,
        created_at: interview.created_at,
        started_at: interview.started_at,
        completed_at: interview.completed_at,
        candidate_id: interview.candidate_id,
        candidate_name: Array.isArray(interview.candidates)
          ? interview.candidates[0]?.name || ""
          : interview.candidates?.name || "",
        candidate_email: Array.isArray(interview.candidates)
          ? interview.candidates[0]?.email || ""
          : interview.candidates?.email || "",
        quiz_id: interview.quiz_id,
        quiz_title: Array.isArray(interview.quizzes)
          ? interview.quizzes[0]?.title || ""
          : interview.quizzes?.title || "",
      })
    );

    return {
      candidate,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      position: Array.isArray((candidate as any).positions)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (candidate as any).positions[0]
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (candidate as any).positions,
      availableQuizzes: availableQuizzes || [],
      assignedInterviews,
    };
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

  const { candidate, position, availableQuizzes, assignedInterviews } =
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
                availableQuizzes={availableQuizzes}
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
              <InvitesList assignedInterviews={assignedInterviews} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
