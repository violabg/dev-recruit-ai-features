import { SignUpForm } from "@/components/auth/sign-up-form";
import { BrainCircuit } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex flex-col space-y-2 text-center mb-8">
            <Link href="/" className="mx-auto">
              <div className="flex items-center gap-2 font-bold text-xl">
                <BrainCircuit className="h-6 w-6" />
                <span>DevRecruit AI</span>
              </div>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">
              Crea un account
            </h1>
            <p className="text-sm text-muted-foreground">
              Registrati per iniziare a utilizzare DevRecruit AI
            </p>
          </div>

          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
