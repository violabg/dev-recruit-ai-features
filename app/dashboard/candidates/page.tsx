import { CandidateGrid } from "@/components/candidates/candidate-grid";
import { CandidateTable } from "@/components/candidates/candidate-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { fetchCandidatesData } from "./candidates-actions";

// Define the search params type
type SearchParams = {
  search?: string;
  status?: string;
  position?: string;
  sort?: string;
  view?: string;
};

// Main candidates page component
export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = params?.search || "";
  const status = params?.status || "all";
  const positionId = params?.position || "all";
  const sort = params?.sort || "newest";
  const view = params?.view || "table";

  const { user, candidates, positions, statusCounts, totalCandidates } =
    await fetchCandidatesData({
      search,
      status,
      positionId,
      sort,
    });

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidati</h1>
          <p className="text-muted-foreground">
            Gestisci i candidati per le tue posizioni aperte
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/candidates/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Candidato
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Totale Candidati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
          </CardContent>
        </Card>
        {statusCounts?.map((status: any) => (
          <Card key={status.status}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
          <CardDescription>Filtra e cerca i candidati</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="search"
                  placeholder="Cerca candidati..."
                  className="pl-8"
                  defaultValue={search}
                />
              </div>
            </form>
            <form>
              <Select name="status" defaultValue={status}>
                <SelectTrigger>
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="pending">In attesa</SelectItem>
                  <SelectItem value="contacted">Contattato</SelectItem>
                  <SelectItem value="interviewing">In colloquio</SelectItem>
                  <SelectItem value="hired">Assunto</SelectItem>
                  <SelectItem value="rejected">Rifiutato</SelectItem>
                </SelectContent>
              </Select>
            </form>
            <form>
              <Select name="position" defaultValue={positionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Posizione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le posizioni</SelectItem>
                  {positions?.map((position: any) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </form>
            <form>
              <Select name="sort" defaultValue={sort}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordinamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Più recenti</SelectItem>
                  <SelectItem value="oldest">Più vecchi</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="status">Stato</SelectItem>
                </SelectContent>
              </Select>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Candidates list */}
      <Card>
        <CardHeader className="space-y-0 pb-0">
          <Tabs defaultValue={view} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="table">Tabella</TabsTrigger>
                <TabsTrigger value="grid">Griglia</TabsTrigger>
              </TabsList>
              <div className="text-sm text-muted-foreground">
                {candidates?.length} candidati trovati
              </div>
            </div>
            <TabsContent value="table" className="pt-4">
              <CandidateTable candidates={candidates || []} />
            </TabsContent>
            <TabsContent value="grid" className="pt-4">
              <CandidateGrid candidates={candidates || []} />
            </TabsContent>
          </Tabs>
        </CardHeader>
        <CardContent>
          {candidates?.length === 0 && (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <h3 className="mt-4 text-lg font-semibold">
                  Nessun candidato trovato
                </h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                  {search
                    ? `Nessun candidato trovato per "${search}". Prova a modificare i filtri.`
                    : "Non hai ancora aggiunto candidati. Aggiungi il tuo primo candidato per iniziare."}
                </p>
                <Button asChild>
                  <Link href="/dashboard/candidates/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuovo Candidato
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
