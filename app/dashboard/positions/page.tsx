import { SearchPositions } from "@/components/positions/search-positions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";

// Server component for positions page
export default async function PositionsPage({
  searchParams,
}: {
  searchParams: any;
}) {
  // Await searchParams if it's a Promise (Next.js server component requirement)
  const params =
    typeof searchParams.then === "function" ? await searchParams : searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch positions
  let query = supabase
    .from("positions")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  // Apply search filter if provided
  if (params?.q) {
    query = query.ilike("title", `%${params.q}%`);
  }

  const { data: positions } = await query;

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
        <SearchPositions defaultValue={params?.q} />
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
                  <TableCell className="font-medium">
                    {position.title}
                  </TableCell>
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
                      {position.skills.length > 3 && (
                        <Badge variant="secondary">
                          +{position.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(position.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="default" size="sm" asChild>
                      <Link href={`/dashboard/positions/${position.id}`}>
                        Dettagli
                      </Link>
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
              {params?.q
                ? "Nessuna posizione trovata"
                : "Nessuna posizione creata"}
            </p>
            {!params?.q && (
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
  );
}
