"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCandidate } from "@/lib/actions/candidates";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Briefcase,
  Calendar,
  FileText,
  Mail,
  MoreHorizontal,
  Send,
  Trash,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CandidateStatusBadge } from "./candidate-status-badge";

// Define the candidate type
type Candidate = {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  positions: {
    id: string;
    title: string;
    experience_level: string;
  } | null;
  interviews:
    | {
        id: string;
        status: string;
        score: number | null;
        created_at: string;
      }[]
    | null;
};

// Props for the candidate grid
interface CandidateGridProps {
  candidates: Candidate[];
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

// Candidate grid component
export function CandidateGrid({ candidates }: CandidateGridProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Handle delete candidate
  async function handleDelete(id: string) {
    if (confirm("Sei sicuro di voler eliminare questo candidato?")) {
      setIsDeleting(id);
      try {
        await deleteCandidate(id);
      } catch (error) {
        console.error("Error deleting candidate:", error);
        alert(
          "Si è verificato un errore durante l'eliminazione del candidato."
        );
      } finally {
        setIsDeleting(null);
      }
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {candidates.map((candidate) => (
        <Card key={candidate.id} className="overflow-hidden">
          <CardHeader className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{candidate.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="mr-1 h-3 w-3" />
                    {candidate.email}
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Apri menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/candidates/${candidate.id}`}>
                      <User className="mr-2 h-4 w-4" />
                      Visualizza profilo
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/dashboard/candidates/${candidate.id}/send-quiz`}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Invia quiz
                    </Link>
                  </DropdownMenuItem>
                  {candidate.interviews && candidate.interviews.length > 0 && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/interviews/${candidate.interviews[0].id}`}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Visualizza risultati
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(candidate.id)}
                    disabled={isDeleting === candidate.id}
                    className="text-red-600"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    {isDeleting === candidate.id
                      ? "Eliminazione..."
                      : "Elimina candidato"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                {candidate.positions ? (
                  <div>
                    <span>{candidate.positions.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      • {candidate.positions.experience_level}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    Nessuna posizione
                  </span>
                )}
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>
                  Aggiunto il{" "}
                  {format(new Date(candidate.created_at), "dd MMMM yyyy", {
                    locale: it,
                  })}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t p-4">
            <CandidateStatusBadge status={candidate.status} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/candidates/${candidate.id}`}>
                Visualizza
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
