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
        <section className="bg-gradient-to-b from-background via-background/90 to-muted/20 py-20 md:py-32 backdrop-blur-vision">
          <div className="px-4 md:px-6 container">
            <div className="items-center gap-6 lg:gap-12 grid lg:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="font-bold text-3xl sm:text-5xl xl:text-6xl/none tracking-tighter">
                    Selezione tecnica potenziata dall&apos;AI
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Valuta le competenze tecniche dei candidati con quiz
                    personalizzati e colloqui in tempo reale supportati
                    dall&apos;intelligenza artificiale.
                  </p>
                </div>
                <div className="flex min-[400px]:flex-row flex-col gap-2">
                  <Link href={user ? "/dashboard" : "/auth/login"}>
                    <Button size="lg" className="gap-1.5">
                      Inizia ora
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative mx-auto lg:mx-0">
                <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-purple-500 opacity-20 blur-3xl rounded-lg" />
                <div className="relative glass-card border border-glass-border backdrop-blur-vision shadow-vision-lg p-6 rounded-xl vision-elevated">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-lg">
                      <BrainCircuit className="w-5 h-5 text-primary" />
                      <span>Quiz generato dall&apos;AI</span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="glass-bg backdrop-blur-vision border border-glass-border p-3 rounded-lg">
                        <p className="font-medium">
                          Domanda 1: Cosa è un closure in JavaScript?
                        </p>
                        <div className="space-y-1 mt-2 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="flex justify-center items-center border rounded-full w-4 h-4">
                              <div className="bg-primary rounded-full w-2 h-2" />
                            </div>
                            <span>
                              Una funzione che ha accesso al proprio scope
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="border rounded-full w-4 h-4" />
                            <span>Un metodo per chiudere una connessione</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="border rounded-full w-4 h-4" />
                            <span>Un tipo di variabile globale</span>
                          </div>
                        </div>
                      </div>
                      <div className="glass-bg backdrop-blur-vision border border-glass-border p-3 rounded-lg">
                        <p className="font-medium">
                          Domanda 2: Identifica l&apos;errore nel seguente
                          codice:
                        </p>
                        <pre className="bg-black mt-2 p-2 rounded overflow-x-auto text-white text-xs">
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
        <section className="bg-background py-12 md:py-16">
          <div className="px-4 md:px-6 container">
            <div className="space-y-3 mb-12 text-center">
              <h2 className="font-bold text-3xl tracking-tighter">
                Perché scegliere DevRecruit AI
              </h2>
              <p className="mx-auto max-w-[800px] text-muted-foreground md:text-lg">
                Ottimizza il processo di selezione tecnica con strumenti
                avanzati e intelligenti
              </p>
            </div>
            <div className="gap-8 grid md:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 p-6 text-center glass-card border border-glass-border backdrop-blur-vision rounded-xl shadow-vision-sm hover:shadow-vision transition-all duration-300 ease-vision vision-elevated vision-interactive">
                <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-4 rounded-2xl backdrop-blur-vision border border-primary/20">
                  <BrainCircuit className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl">
                  Quiz personalizzati con AI
                </h3>
                <p className="text-muted-foreground">
                  Genera automaticamente quiz tecnici su misura per ogni
                  posizione e livello di esperienza.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-6 text-center glass-card border border-glass-border backdrop-blur-vision rounded-xl shadow-vision-sm hover:shadow-vision transition-all duration-300 ease-vision vision-elevated vision-interactive">
                <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-4 rounded-2xl backdrop-blur-vision border border-primary/20">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl">Colloqui in tempo reale</h3>
                <p className="text-muted-foreground">
                  Monitora le risposte dei candidati in tempo reale durante i
                  colloqui tecnici.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-6 text-center glass-card border border-glass-border backdrop-blur-vision rounded-xl shadow-vision-sm hover:shadow-vision transition-all duration-300 ease-vision vision-elevated vision-interactive">
                <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-4 rounded-2xl backdrop-blur-vision border border-primary/20">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl">Valutazione oggettiva</h3>
                <p className="text-muted-foreground">
                  Valuta le competenze tecniche in modo oggettivo e riduci i
                  bias nel processo di selezione.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-8 md:py-12 border-t border-glass-border bg-glass-bg/30 backdrop-blur-vision">
        <div className="flex md:flex-row flex-col md:justify-between md:items-center gap-4 container">
          <div className="flex items-center gap-2 text-sm">
            <BrainCircuit className="w-4 h-4" />
            <span>© 2025 DevRecruit AI. Tutti i diritti riservati.</span>
          </div>
          <div className="flex gap-4 text-muted-foreground text-sm">
            <Link href="/" className="hover:underline">
              Privacy
            </Link>
            <Link href="/" className="hover:underline">
              Termini
            </Link>
            <Link href="/" className="hover:underline">
              Contatti
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
