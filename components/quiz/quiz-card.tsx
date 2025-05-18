import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Eye, Send } from "lucide-react";
import Link from "next/link";

interface QuizCardProps {
  id: string;
  title: string;
  positionTitle?: string;
  experienceLevel?: string;
  questionCount: number;
  timeLimit?: number | null;
  createdAt: string;
  compact?: boolean;
}

// Format date helper
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function QuizCard({
  id,
  title,
  positionTitle,
  experienceLevel,
  questionCount,
  timeLimit,
  createdAt,
  compact = false,
}: QuizCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle className="line-clamp-1 text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className={compact ? "pb-2" : undefined}>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {positionTitle && <Badge variant="outline">{positionTitle}</Badge>}
            {experienceLevel && (
              <Badge variant="outline">{experienceLevel}</Badge>
            )}
            {timeLimit && (
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                {timeLimit} minuti
              </Badge>
            )}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {questionCount} domande
            </span>
            <span className="text-muted-foreground">
              {formatDate(createdAt)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto pt-2">
        <div className="flex w-full justify-between gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/quizzes/${id}`}>
              <Eye className="mr-1 h-4 w-4" />
              Visualizza
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/dashboard/quizzes/${id}/invite`}>
              <Send className="mr-1 h-4 w-4" />
              Invia
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
