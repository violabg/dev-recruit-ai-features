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
import { Suspense } from "react";
import PositionsSkeleton from "./fallback";

// Server component for positions page
export default async function PositionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string | undefined }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-3xl">Posizioni</h1>
        <Button asChild>
          <Link href="/dashboard/positions/new">
            <Plus className="mr-2 w-4 h-4" />
            Nuova Posizione
          </Link>
        </Button>
      </div>
      <Suspense fallback={<PositionsSkeleton />}>
        <PositionsTable
          defaultValue={searchParams.then((search) => search.q)}
        />
      </Suspense>
    </div>
  );
}

const PositionsTable = async ({
  defaultValue,
}: {
  defaultValue: Promise<string | undefined>;
}) => {
  const q = await defaultValue;
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
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data: positions } = await query;
  return (
    <>
      <div className="flex items-center gap-4">
        <SearchPositions defaultValue={q} />
      </div>
      {positions && positions.length > 0 ? (
        <div className="border rounded-md">
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
        <div className="flex flex-col justify-center items-center border border-dashed rounded-lg h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {q ? "Nessuna posizione trovata" : "Nessuna posizione creata"}
            </p>
            {!q && (
              <Button className="mt-2" size="sm" asChild>
                <Link href="/dashboard/positions/new">
                  <Plus className="mr-2 w-4 h-4" />
                  Crea posizione
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
