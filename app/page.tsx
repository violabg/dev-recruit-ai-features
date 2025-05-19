import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, BrainCircuit, CheckCircle, Users } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="py-20 md:py-32 bg-linear-to-b from-background to-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Selezione tecnica potenziata dall&apos;AI
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Valuta le competenze tecniche dei candidati con quiz
                    personalizzati e colloqui in tempo reale supportati
                    dall&apos;intelligenza artificiale.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href={user ? "/dashboard" : "/login"}>
                    <Button size="lg" className="gap-1.5">
                      Inizia ora
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button size="lg" variant="outline">
                      Richiedi una demo
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto lg:mx-0 relative">
                <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-purple-500 rounded-lg blur-3xl opacity-20" />
                <div className="relative bg-card border rounded-lg shadow-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <BrainCircuit className="h-5 w-5 text-primary" />
                      <span>Quiz generato dall&apos;AI</span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-muted rounded-md">
                        <p className="font-medium">
                          Domanda 1: Cosa è un closure in JavaScript?
                        </p>
                        <div className="mt-2 space-y-1 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            </div>
                            <span>
                              Una funzione che ha accesso al proprio scope
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border" />
                            <span>Un metodo per chiudere una connessione</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border" />
                            <span>Un tipo di variabile globale</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="font-medium">
                          Domanda 2: Identifica l&apos;errore nel seguente
                          codice:
                        </p>
                        <pre className="mt-2 p-2 bg-black text-white text-xs rounded overflow-x-auto">
                          {`function fetchData() {
  return fetch('/api/data')
    .then(res => res.json);
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-12 md:py-16 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter">
                Perché scegliere DevRecruit AI
              </h2>
              <p className="text-muted-foreground md:text-lg max-w-[800px] mx-auto">
                Ottimizza il processo di selezione tecnica con strumenti
                avanzati e intelligenti
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-2 p-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <BrainCircuit className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">
                  Quiz personalizzati con AI
                </h3>
                <p className="text-muted-foreground">
                  Genera automaticamente quiz tecnici su misura per ogni
                  posizione e livello di esperienza.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2 p-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Colloqui in tempo reale</h3>
                <p className="text-muted-foreground">
                  Monitora le risposte dei candidati in tempo reale durante i
                  colloqui tecnici.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2 p-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Valutazione oggettiva</h3>
                <p className="text-muted-foreground">
                  Valuta le competenze tecniche in modo oggettivo e riduci i
                  bias nel processo di selezione.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <BrainCircuit className="h-4 w-4" />
            <span>© 2025 DevRecruit AI. Tutti i diritti riservati.</span>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Termini
            </Link>
            <Link href="/contact" className="hover:underline">
              Contatti
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
