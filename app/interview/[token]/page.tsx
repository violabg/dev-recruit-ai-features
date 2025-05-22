import { Quiz } from "@/app/dashboard/quizzes/quizzes-actions";
import { InterviewClient } from "@/components/interview/interview-client";
import { createClient } from "@/lib/supabase/server";

// Server component for interview page
export default async function InterviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const interviewParams = await params;
  const supabase = await createClient();

  // Fetch interview details
  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("*")
    .eq("token", interviewParams.token)
    .single();
  console.log("🚀 ~ interview:", interview);
  console.log("🚀 ~ interviewError:", interviewError);

  if (interviewError || !interview) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="bg-card shadow-lg p-6 border rounded-lg w-full max-w-md">
          <h1 className="font-bold text-2xl text-center">
            Intervista non trovata
          </h1>
          <p className="mt-2 text-muted-foreground text-center">
            Il link che hai seguito non è valido o l&apos;intervista è stata
            cancellata.
          </p>
        </div>
      </div>
    );
  }

  // Fetch quiz details
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select(
      `
      id, 
      title, 
      questions,
      time_limit,
      position:positions(title)
      `
    )
    .eq("id", interview.quiz_id)
    .single<Quiz>();
  console.log("🚀 ~ quiz:", quiz);

  if (quizError || !quiz) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="bg-card shadow-lg p-6 border rounded-lg w-full max-w-md">
          <h1 className="font-bold text-2xl text-center">Quiz non trovato</h1>
          <p className="mt-2 text-muted-foreground text-center">
            Il quiz associato a questa intervista non è stato trovato.
          </p>
        </div>
      </div>
    );
  }

  // Fetch candidate details
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, name, email")
    .eq("id", interview.candidate_id)
    .single();

  if (candidateError || !candidate) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="bg-card shadow-lg p-6 border rounded-lg w-full max-w-md">
          <h1 className="font-bold text-2xl text-center">
            Candidato non trovato
          </h1>
          <p className="mt-2 text-muted-foreground text-center">
            Il candidato associato a questa intervista non è stato trovato.
          </p>
        </div>
      </div>
    );
  }

  return (
    <InterviewClient interview={interview} quiz={quiz} candidate={candidate} />
  );
}
