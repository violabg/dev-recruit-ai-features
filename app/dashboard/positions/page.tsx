import Link from "next/link"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { SearchPositions } from "@/components/search-positions"
import type { Database } from "@/lib/database.types"

// Format date helper
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

// Server component for positions page
export default async function PositionsPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const cookieStore = cookies()
  const supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch positions
  let query = supabase.from("positions").select("*").eq("created_by", user.id).order("created_at", { ascending: false })

  // Apply search filter if provided
  if (searchParams.q) {
    query = query.ilike("title", `%${searchParams.q}%`)
  }

  const { data: positions } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Posizioni</h1>
        <Button asChild>
          <Link href="/dashboard/positions/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuova Posizione
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <SearchPositions defaultValue={searchParams.q} />
      </div>

      {positions && positions.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titolo</TableHead>
                <TableHead>Livello</TableHead>
                <TableHead>Competenze</TableHead>
                <TableHead>Data Creazione</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{position.experience_level}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {position.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {position.skills.length > 3 && <Badge variant="secondary">+{position.skills.length - 3}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(position.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/positions/${position.id}`}>Dettagli</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {searchParams.q ? "Nessuna posizione trovata" : "Nessuna posizione creata"}
            </p>
            {!searchParams.q && (
              <Button className="mt-2" size="sm" asChild>
                <Link href="/dashboard/positions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crea posizione
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
