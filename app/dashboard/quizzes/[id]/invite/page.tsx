"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import { useSupabase } from "@/lib/supabase/supabase-provider";
import { toast } from "sonner";

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

export default function InviteCandidatesPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!supabase || !user) return;

      try {
        setLoading(true);

        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("id, title, position_id, time_limit")
          .eq("id", params.id)
          .single();

        if (quizError) throw quizError;
        setQuiz(quizData);

        // Fetch position details
        const { data: positionData, error: positionError } = await supabase
          .from("positions")
          .select("id, title")
          .eq("id", quizData.position_id)
          .single();

        if (positionError) throw positionError;
        setPosition(positionData);
      } catch (error: any) {
        toast.error("Error", {
          description: error.message || "Failed to load data",
        });
        router.push(`/dashboard/quizzes/${params.id}`);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase, user, params.id, router]);

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
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
          <Link href={`/dashboard/quizzes/${params.id}`}>
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
              <SendInviteForm quizId={quiz.id} onSuccess={handleSuccess} />
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
              <InvitesList quizId={quiz.id} refreshTrigger={refreshTrigger} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
