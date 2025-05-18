import { LoginForm } from "@/components/auth/login-form";
import type { Database } from "@/lib/database.types";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  // Check if user is already logged in
  const cookieStore = cookies();
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If already logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  // Update the error message handling in the login page
  const getErrorMessage = (errorCode?: string) => {
    switch (errorCode) {
      case "unauthenticated":
        return "Devi effettuare l'accesso per visualizzare questa pagina";
      case "session_expired":
        return "La tua sessione è scaduta. Effettua nuovamente l'accesso";
      case "auth_error":
        return "Si è verificato un errore di autenticazione. Riprova";
      case "no_session":
        return "Nessuna sessione trovata. Effettua l'accesso";
      default:
        return undefined;
    }
  };

  const errorMessage = getErrorMessage(searchParams.error);

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Accedi al tuo account
          </h1>
          <p className="text-sm text-muted-foreground">
            Inserisci le tue credenziali per accedere
          </p>
          {errorMessage && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
        </div>
        <LoginForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/register"
            className="hover:text-brand underline underline-offset-4"
          >
            Non hai un account? Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
