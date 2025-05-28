import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { BarChart3, Briefcase, Plus, Users } from "lucide-react";
import Link from "next/link";

// Server component for dashboard stats
async function DashboardStats() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch positions count
  const { count: positionsCount } = await supabase
    .from("positions")
    .select("*", { count: "exact", head: true })
    .eq("created_by", user.id);

  // Fetch candidates count
  const { count: candidatesCount } = await supabase
    .from("candidates")
    .select("*", { count: "exact", head: true })
    .eq("created_by", user.id);

  // Fetch interviews count
  const { count: interviewsCount } = await supabase
    .from("interviews")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  return (
    <div className="gap-4 grid md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center pb-2">
          <CardTitle className="font-medium text-sm">
            Posizioni Aperte
          </CardTitle>
          <Briefcase className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{positionsCount || 0}</div>
          <p className="text-muted-foreground text-xs">
            Posizioni attualmente aperte
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center pb-2">
          <CardTitle className="font-medium text-sm">Candidati</CardTitle>
          <Users className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{candidatesCount || 0}</div>
          <p className="text-muted-foreground text-xs">
            Candidati totali nel sistema
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center pb-2">
          <CardTitle className="font-medium text-sm">
            Colloqui Completati
          </CardTitle>
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{interviewsCount || 0}</div>
          <p className="text-muted-foreground text-xs">
            Colloqui completati con successo
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Server component for recent positions
async function RecentPositions() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch recent positions
  const { data: positions } = await supabase
    .from("positions")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Posizioni Recenti</CardTitle>
        <CardDescription>Le ultime posizioni create</CardDescription>
      </CardHeader>
      <CardContent>
        {positions && positions.length > 0 ? (
          <div className="space-y-2">
            {positions.map((position) => (
              <div
                key={position.id}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{position.title}</div>
                  <div className="text-muted-foreground text-sm">
                    {position.experience_level}
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/positions/${position.id}`}>
                    Dettagli
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center border border-dashed rounded-lg h-[140px]">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Nessuna posizione creata
              </p>
              <Button className="mt-2" size="sm" asChild>
                <Link href="/dashboard/positions/new">
                  <Plus className="mr-2 w-4 h-4" />
                  Crea posizione
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main dashboard page (server component)
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-3xl">Dashboard</h1>
        <Button asChild variant={"default"}>
          <Link href="/dashboard/positions/new">
            <Plus className="mr-2 w-4 h-4" />
            Nuova Posizione
          </Link>
        </Button>
        <Button asChild variant={"secondary"}>
          <Link href="/dashboard/positions/new">
            <Plus className="mr-2 w-4 h-4" />
            secondary
          </Link>
        </Button>
        <Button asChild variant={"outline"}>
          <Link href="/dashboard/positions/new">
            <Plus className="mr-2 w-4 h-4" />
            outline
          </Link>
        </Button>
        <Button asChild variant={"ghost"}>
          <Link href="/dashboard/positions/new">
            <Plus className="mr-2 w-4 h-4" />
            ghost
          </Link>
        </Button>
        <Button asChild variant={"glass"}>
          <Link href="/dashboard/positions/new">
            <Plus className="mr-2 w-4 h-4" />
            glass
          </Link>
        </Button>
        <Button asChild variant={"link"}>
          <Link href="/dashboard/positions/new">
            <Plus className="mr-2 w-4 h-4" />
            link
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <DashboardStats />

      <div className="gap-4 grid md:grid-cols-2">
        {/* Recent positions */}
        <RecentPositions />

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Attività Recenti</CardTitle>
            <CardDescription>
              Le ultime attività sulla piattaforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col justify-center items-center border border-dashed rounded-lg h-[140px]">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Nessuna attività recente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
