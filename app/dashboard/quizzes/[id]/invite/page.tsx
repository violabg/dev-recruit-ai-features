"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft, Copy, Loader2, Mail, Send, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/supabase-provider"

const emailFormSchema = z.object({
  emails: z.string().min(1, {
    message: "Inserisci almeno un indirizzo email.",
  }),
  message: z.string().optional(),
  sendEmail: z.boolean().default(true),
})

const candidateFormSchema = z.object({
  name: z.string().min(2, {
    message: "Il nome deve contenere almeno 2 caratteri.",
  }),
  email: z.string().email({
    message: "Inserisci un indirizzo email valido.",
  }),
})

interface Quiz {
  id: string
  title: string
  position_id: string
  time_limit: number | null
}

interface Position {
  id: string
  title: string
}

interface Candidate {
  id: string
  name: string
  email: string
  status: string
}

interface Interview {
  id: string
  token: string
  candidate_id: string
  candidate: {
    name: string
    email: string
  }
  status: string
  created_at: string
}

export default function InviteCandidatesPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const { toast } = useToast()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [addingCandidate, setAddingCandidate] = useState(false)

  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      emails: "",
      message: "Ti invito a completare questo quiz tecnico per la posizione a cui ti sei candidato.",
      sendEmail: true,
    },
  })

  const candidateForm = useForm<z.infer<typeof candidateFormSchema>>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  useEffect(() => {
    async function fetchData() {
      if (!supabase || !user) return

      try {
        setLoading(true)

        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("id, title, position_id, time_limit")
          .eq("id", params.id)
          .single()

        if (quizError) throw quizError
        setQuiz(quizData)

        // Fetch position details
        const { data: positionData, error: positionError } = await supabase
          .from("positions")
          .select("id, title")
          .eq("id", quizData.position_id)
          .single()

        if (positionError) throw positionError
        setPosition(positionData)

        // Fetch candidates for this position
        const { data: candidatesData, error: candidatesError } = await supabase
          .from("candidates")
          .select("id, name, email, status")
          .eq("position_id", quizData.position_id)
          .order("created_at", { ascending: false })

        if (candidatesError) throw candidatesError
        setCandidates(candidatesData || [])

        // Fetch existing interviews for this quiz
        const { data: interviewsData, error: interviewsError } = await supabase
          .from("interviews")
          .select(`
            id, 
            token, 
            status, 
            created_at,
            candidate_id,
            candidate:candidates(name, email)
          `)
          .eq("quiz_id", params.id)
          .order("created_at", { ascending: false })

        if (interviewsError) throw interviewsError
        setInterviews(interviewsData || [])
      } catch (error: any) {
        toast({
          title: "Errore",
          description: error.message || "Impossibile caricare i dati",
          variant: "destructive",
        })
        router.push(`/dashboard/quizzes/${params.id}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, user, params.id, router, toast])

  async function onEmailSubmit(values: z.infer<typeof emailFormSchema>) {
    if (!supabase || !user || !quiz || !position) {
      toast({
        title: "Errore",
        description: "Dati mancanti per inviare gli inviti",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    try {
      const emails = values.emails
        .split(/[,;\n]/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0)

      if (emails.length === 0) {
        throw new Error("Nessun indirizzo email valido")
      }

      // Create candidates and interviews
      for (const email of emails) {
        // Check if candidate already exists
        const { data: existingCandidates, error: checkError } = await supabase
          .from("candidates")
          .select("id")
          .eq("email", email)
          .eq("position_id", position.id)
          .limit(1)

        let candidateId

        if (checkError) throw checkError

        if (existingCandidates && existingCandidates.length > 0) {
          candidateId = existingCandidates[0].id
        } else {
          // Create new candidate
          const { data: newCandidate, error: candidateError } = await supabase
            .from("candidates")
            .insert({
              name: email.split("@")[0], // Use part of email as name
              email: email,
              position_id: position.id,
              status: "invited",
              created_by: user.id,
            })
            .select()

          if (candidateError) throw candidateError
          candidateId = newCandidate![0].id
        }

        // Generate unique token for interview
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

        // Create interview
        const { error: interviewError } = await supabase.from("interviews").insert({
          candidate_id: candidateId,
          quiz_id: quiz.id,
          status: "pending",
          token: token,
        })

        if (interviewError) throw interviewError

        // Send email if enabled (would be implemented with a real email service)
        if (values.sendEmail) {
          // This would be where you'd integrate with an email service
          console.log(`Email would be sent to ${email} with token ${token}`)
        }
      }

      toast({
        title: "Inviti inviati",
        description: `${emails.length} inviti sono stati inviati con successo`,
      })

      // Refresh the interviews list
      const { data: refreshedInterviews, error: refreshError } = await supabase
        .from("interviews")
        .select(`
          id, 
          token, 
          status, 
          created_at,
          candidate_id,
          candidate:candidates(name, email)
        `)
        .eq("quiz_id", params.id)
        .order("created_at", { ascending: false })

      if (!refreshError) {
        setInterviews(refreshedInterviews || [])
      }

      emailForm.reset({
        emails: "",
        message: values.message,
        sendEmail: values.sendEmail,
      })
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'invio degli inviti",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  async function onCandidateSubmit(values: z.infer<typeof candidateFormSchema>) {
    if (!supabase || !user || !quiz || !position) {
      toast({
        title: "Errore",
        description: "Dati mancanti per aggiungere il candidato",
        variant: "destructive",
      })
      return
    }

    setAddingCandidate(true)

    try {
      // Check if candidate already exists
      const { data: existingCandidates, error: checkError } = await supabase
        .from("candidates")
        .select("id")
        .eq("email", values.email)
        .eq("position_id", position.id)
        .limit(1)

      if (checkError) throw checkError

      let candidateId

      if (existingCandidates && existingCandidates.length > 0) {
        candidateId = existingCandidates[0].id
      } else {
        // Create new candidate
        const { data: newCandidate, error: candidateError } = await supabase
          .from("candidates")
          .insert({
            name: values.name,
            email: values.email,
            position_id: position.id,
            status: "invited",
            created_by: user.id,
          })
          .select()

        if (candidateError) throw candidateError
        candidateId = newCandidate![0].id
      }

      // Generate unique token for interview
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // Create interview
      const { error: interviewError } = await supabase.from("interviews").insert({
        candidate_id: candidateId,
        quiz_id: quiz.id,
        status: "pending",
        token: token,
      })

      if (interviewError) throw interviewError

      toast({
        title: "Candidato aggiunto",
        description: `${values.name} è stato aggiunto con successo`,
      })

      // Refresh the interviews list
      const { data: refreshedInterviews, error: refreshError } = await supabase
        .from("interviews")
        .select(`
          id, 
          token, 
          status, 
          created_at,
          candidate_id,
          candidate:candidates(name, email)
        `)
        .eq("quiz_id", params.id)
        .order("created_at", { ascending: false })

      if (!refreshError) {
        setInterviews(refreshedInterviews || [])
      }

      candidateForm.reset({
        name: "",
        email: "",
      })
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'aggiunta del candidato",
        variant: "destructive",
      })
    } finally {
      setAddingCandidate(false)
    }
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/interview/${token}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link copiato",
      description: "Il link di invito è stato copiato negli appunti",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!quiz || !position) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-lg font-medium">Quiz non trovato</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/quizzes">Torna ai quiz</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/quizzes/${params.id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Torna al quiz
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Invita candidati</h1>
        <p className="text-muted-foreground">
          Invia il quiz &quot;{quiz.title}&quot; per la posizione &quot;{position.title}&quot;
        </p>
      </div>

      <Tabs defaultValue="email">
        <TabsList>
          <TabsTrigger value="email">Invita via email</TabsTrigger>
          <TabsTrigger value="candidate">Aggiungi candidato</TabsTrigger>
          <TabsTrigger value="invites">Inviti inviati</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invita candidati via email</CardTitle>
              <CardDescription>Invia inviti a più candidati contemporaneamente</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                  <FormField
                    control={emailForm.control}
                    name="emails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indirizzi email</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Inserisci gli indirizzi email separati da virgole, punti e virgola o nuove righe"
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Esempio: candidato1@esempio.com, candidato2@esempio.com</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={emailForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Messaggio (opzionale)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Inserisci un messaggio personalizzato da includere nell'email"
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Questo messaggio verrà incluso nell&apos;email di invito</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={emailForm.control}
                    name="sendEmail"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Invia email</FormLabel>
                          <FormDescription>
                            Se disabilitato, verranno generati solo i link di invito senza inviare email
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={sending}>
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Invia inviti
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="candidate" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Aggiungi candidato</CardTitle>
              <CardDescription>Aggiungi un nuovo candidato e genera un link di invito</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...candidateForm}>
                <form onSubmit={candidateForm.handleSubmit(onCandidateSubmit)} className="space-y-6">
                  <FormField
                    control={candidateForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Mario Rossi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={candidateForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="candidato@esempio.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={addingCandidate}>
                    {addingCandidate ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Aggiunta in corso...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Aggiungi candidato
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inviti inviati</CardTitle>
              <CardDescription>Gestisci gli inviti inviati per questo quiz</CardDescription>
            </CardHeader>
            <CardContent>
              {interviews.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidato</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Data invio</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interviews.map((interview) => (
                      <TableRow key={interview.id}>
                        <TableCell className="font-medium">{interview.candidate.name}</TableCell>
                        <TableCell>{interview.candidate.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              interview.status === "pending"
                                ? "outline"
                                : interview.status === "completed"
                                  ? "default"
                                  : interview.status === "in_progress"
                                    ? "secondary"
                                    : "outline"
                            }
                          >
                            {interview.status === "pending"
                              ? "In attesa"
                              : interview.status === "completed"
                                ? "Completato"
                                : interview.status === "in_progress"
                                  ? "In corso"
                                  : interview.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(interview.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyInviteLink(interview.token)}
                              title="Copia link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              title="Invia email"
                              disabled={interview.status === "completed"}
                            >
                              <Link href={`mailto:${interview.candidate.email}`}>
                                <Mail className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              title="Visualizza risultati"
                              disabled={interview.status !== "completed"}
                            >
                              <Link href={`/dashboard/interviews/${interview.id}`}>
                                <span>Risultati</span>
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Nessun invito inviato per questo quiz</p>
                    <Button className="mt-2" size="sm" onClick={() => emailForm.reset()}>
                      <Send className="mr-2 h-4 w-4" />
                      Invia inviti
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
