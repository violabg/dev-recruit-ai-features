import { AuthDebug } from "@/components/auth/auth-debug";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Database } from "@/lib/database.types";
import { createClient } from "@supabase/supabase-js";
import { BarChart3, Briefcase, Plus, Users } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";

// Server component for dashboard stats
async function DashboardStats() {
  const cookieStore = cookies();
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

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
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Posizioni Aperte
          </CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{positionsCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Posizioni attualmente aperte
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Candidati</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{candidatesCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Candidati totali nel sistema
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Colloqui Completati
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{interviewsCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Colloqui completati con successo
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Server component for recent positions
async function RecentPositions() {
  const cookieStore = cookies();
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

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
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">{position.title}</div>
                  <div className="text-sm text-muted-foreground">
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
          <div className="flex h-[140px] flex-col items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Nessuna posizione creata
              </p>
              <Button className="mt-2" size="sm" asChild>
                <Link href="/dashboard/positions/new">
                  <Plus className="mr-2 h-4 w-4" />
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
  // Get the current user from server-side
  const cookieStore = cookies();
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/dashboard/positions/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuova Posizione
          </Link>
        </Button>
      </div>

      {/* Auth Debug - Only visible in development */}
      {process.env.NODE_ENV !== "production" && (
        <div className="mb-6">
          <AuthDebug />
        </div>
      )}

      {/* Stats cards */}
      <DashboardStats />

      <div className="grid gap-4 md:grid-cols-2">
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
            <div className="flex h-[140px] flex-col items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
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
