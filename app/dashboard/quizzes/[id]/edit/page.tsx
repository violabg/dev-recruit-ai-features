import EditQuizForm from "@/app/dashboard/quizzes/[id]/edit/edit-quiz-form";
import { quizSchema } from "@/lib/actions/quiz-schemas";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const awaitedParams = await params;
  const supabase = await createClient();
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", awaitedParams.id)
    .single();
  if (error || !quiz) return notFound();

  const { data: position } = await supabase
    .from("positions")
    .select("id, title, experience_level, skills")
    .eq("id", quiz.position_id)
    .single();
  if (!position) return notFound();

  // Validate quiz data
  const parsedQuiz = quizSchema.safeParse(quiz);
  if (!parsedQuiz.success) return notFound();

  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <EditQuizForm quiz={parsedQuiz.data} position={position} />
    </Suspense>
  );
}
