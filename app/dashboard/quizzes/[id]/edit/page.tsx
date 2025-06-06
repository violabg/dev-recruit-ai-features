import { EditQuizForm } from "@/app/dashboard/quizzes/[id]/edit/components/edit-quiz-form";
import { getQuizData } from "@/lib/data/quiz-data";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const awaitedParams = await params;
  const data = await getQuizData(awaitedParams.id);

  if (!data) return notFound();

  const { quiz, position } = data;

  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <EditQuizForm quiz={quiz} position={position} />
    </Suspense>
  );
}
