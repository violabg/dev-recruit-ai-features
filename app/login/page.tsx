import Link from "next/link"
import { BrainCircuit } from "lucide-react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
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
            <h1 className="text-2xl font-semibold tracking-tight">Accedi al tuo account</h1>
            <p className="text-sm text-muted-foreground">Inserisci le tue credenziali per accedere</p>
          </div>

          <LoginForm />

          <div className="mt-6">
            <div className="text-center text-sm">
              Non hai un account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Registrati
              </Link>
            </div>
            <div className="mt-2 text-center text-sm">
              <Link href="/reset-password" className="font-medium text-primary hover:underline">
                Password dimenticata?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
