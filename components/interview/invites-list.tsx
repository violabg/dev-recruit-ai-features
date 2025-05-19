"use client";

import { formatDistanceToNow } from "date-fns";
import { Copy, Loader2, Mail, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { deleteInterview, getInterviewsByQuiz } from "@/lib/actions/interviews";
import { toast } from "sonner";

interface Interview {
  id: string;
  token: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  candidate: {
    id: string;
    name: string;
    email: string;
  };
}

interface InvitesListProps {
  quizId: string;
  refreshTrigger?: number;
}

export function InvitesList({ quizId, refreshTrigger = 0 }: InvitesListProps) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchInterviews() {
      try {
        setLoading(true);
        const data = await getInterviewsByQuiz(quizId);
        setInterviews(data);
      } catch (error: any) {
        toast.error("Error", {
          description: error.message || "Failed to load invites",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchInterviews();
  }, [quizId, refreshTrigger]);

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/interview/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied", {
      description: "The invite link has been copied to your clipboard",
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await deleteInterview(deleteId);

      setInterviews(
        interviews.filter((interview) => interview.id !== deleteId)
      );

      toast.success("Invite deleted", {
        description: "The invite has been deleted successfully",
      });
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to delete invite",
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In progress</Badge>;
      case "completed":
        return <Badge>Completed</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No invites have been sent for this quiz yet
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interviews.map((interview) => (
              <TableRow key={interview.id}>
                <TableCell className="font-medium">
                  {interview.candidate.name}
                </TableCell>
                <TableCell>{interview.candidate.email}</TableCell>
                <TableCell>{getStatusBadge(interview.status)}</TableCell>
                <TableCell>{formatDate(interview.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteLink(interview.token)}
                      title="Copy link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      title="Send email"
                    >
                      <a href={`mailto:${interview.candidate.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(interview.id)}
                      title="Delete invite"
                      disabled={interview.status === "completed"}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the invite. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
