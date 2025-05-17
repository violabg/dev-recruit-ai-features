"use client"

import { BrainCircuit, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function InterviewComplete() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <CardTitle className="text-2xl">Quiz completato</CardTitle>
          <CardDescription>Grazie per aver completato il quiz tecnico</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p>
            Le tue risposte sono state registrate con successo. Il recruiter esaminerà i risultati e ti contatterà per i
            prossimi passi.
          </p>
          <div className="flex items-center justify-center gap-2 text-primary">
            <BrainCircuit className="h-5 w-5" />
            <span className="font-bold">DevRecruit AI</span>
          </div>
          <Button className="w-full" asChild>
            <a href="/">Torna alla home</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
