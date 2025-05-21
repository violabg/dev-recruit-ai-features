"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteCandidate } from "@/lib/actions/candidates";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  ArrowUpDown,
  FileText,
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

// Props for the candidate table
interface CandidateTableProps {
  candidates: Candidate[];
}

// Candidate table component
export function CandidateTable({ candidates }: CandidateTableProps) {
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
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">
              <div className="flex items-center">
                Nome
                <ArrowUpDown className="ml-2 w-4 h-4" />
              </div>
            </TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Posizione</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow key={candidate.id}>
              <TableCell className="font-medium">{candidate.name}</TableCell>
              <TableCell>{candidate.email}</TableCell>
              <TableCell>
                {candidate.positions ? (
                  <div className="flex flex-col">
                    <span>{candidate.positions.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {candidate.positions.experience_level}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    Nessuna posizione
                  </span>
                )}
              </TableCell>
              <TableCell>
                <CandidateStatusBadge status={candidate.status} />
              </TableCell>
              <TableCell>
                {format(new Date(candidate.created_at), "dd MMM yyyy", {
                  locale: it,
                })}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 w-8 h-8">
                      <span className="sr-only">Apri menu</span>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/candidates/${candidate.id}`}>
                        <User className="mr-2 w-4 h-4" />
                        Visualizza profilo
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/candidates/${candidate.id}/send-quiz`}
                      >
                        <Send className="mr-2 w-4 h-4" />
                        Invia quiz
                      </Link>
                    </DropdownMenuItem>
                    {candidate.interviews &&
                      candidate.interviews.length > 0 && (
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/interviews/${candidate.interviews[0].id}`}
                          >
                            <FileText className="mr-2 w-4 h-4" />
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
                      <Trash className="mr-2 w-4 h-4" />
                      {isDeleting === candidate.id
                        ? "Eliminazione..."
                        : "Elimina candidato"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
