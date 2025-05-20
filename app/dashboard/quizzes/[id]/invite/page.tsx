import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { InvitesList } from "@/components/interview/invites-list";
import { SendInviteForm } from "@/components/interview/send-invite-form";
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

interface Quiz {
  id: string;
  title: string;
  position_id: string;
  time_limit: number | null;
}

interface Position {
  id: string;
  title: string;
}

export default async function InviteCandidatesPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params; // Destructure id from params
  const supabase = await createClient(); // Assuming createClient is synchronous

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirect("/login");
  }

  let quiz: Quiz | null = null;
  let position: Position | null = null;

  try {
    // Fetch quiz details
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("id, title, position_id, time_limit")
      .eq("id", id) // Use destructured id
      .single();

    if (quizError) throw quizError;
    quiz = quizData;

    // Fetch position details
    const { data: positionData, error: positionError } = await supabase
      .from("positions")
      .select("id, title")
      .eq("id", quizData.position_id) // Use quizData directly as it's guaranteed to be non-null if no error
      .single();

    if (positionError) throw positionError;
    position = positionData;
  } catch (error: unknown) {
    let errorMessage = "Failed to load data";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error fetching data:", errorMessage);
    // It's generally better to redirect to a dedicated error page or show a generic error message
    // For now, redirecting with a query param as per previous logic
    return redirect(
      `/dashboard/quizzes/${id}?error=${encodeURIComponent(errorMessage)}` // Use destructured id
    );
  }

  if (!quiz || !position) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-lg font-medium">Quiz not found</p>
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
          <Link href={`/dashboard/quizzes/${id}`}>
            {" "}
            {/* Use destructured id */}
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to quiz
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Invite candidates</h1>
        <p className="text-muted-foreground">
          Send the quiz &quot;{quiz.title}&quot; for the position &quot;
          {position.title}&quot;
        </p>
      </div>

      <Tabs defaultValue="email">
        <TabsList>
          <TabsTrigger value="email">Invite via email</TabsTrigger>
          <TabsTrigger value="invites">Sent invites</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invite candidates via email</CardTitle>
              <CardDescription>
                Send invites to multiple candidates at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SendInviteForm quizId={quiz.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sent invites</CardTitle>
              <CardDescription>
                Manage invites sent for this quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvitesList quizId={quiz.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
