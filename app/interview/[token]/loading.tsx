import { Skeleton } from "@/components/ui/skeleton";

export default function InterviewLoading() {
  return (
    <div className="min-h-screen  p-4 w-full">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-3/4" /> {/* Quiz Title */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/4" /> {/* Question count */}
          <Skeleton className="h-4 w-1/4" /> {/* Candidate Name */}
        </div>
        <Skeleton className="h-2 w-full" /> {/* Progress bar */}
      </div>

      {/* Skeleton for InterviewQuestion component */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        {" "}
        {/* Mimicking Card structure */}
        <div className="mb-4 space-y-2">
          <Skeleton className="h-6 w-4/5" /> {/* Question title/text line 1 */}
          <Skeleton className="h-6 w-full" /> {/* Question title/text line 2 */}
          <Skeleton className="h-6 w-3/5" /> {/* Question title/text line 3 */}
        </div>
        {/* Skeleton for answer options (e.g., multiple choice) */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5 rounded-full" />{" "}
            {/* Radio button skeleton */}
            <Skeleton className="h-5 flex-1" /> {/* Option text skeleton */}
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 flex-1" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 flex-1" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 flex-1" />
          </div>
        </div>
        {/* 
              Alternatively, for a code editor or textarea:
              <Skeleton className="mt-4 h-40 w-full" /> // For code editor
              <Skeleton className="mt-4 h-24 w-full" /> // For textarea
            */}
      </div>

      <div className="mt-6 flex justify-between">
        <Skeleton className="h-10 w-24" /> {/* Previous Button */}
        <Skeleton className="h-10 w-24" /> {/* Next/Complete Button */}
      </div>
    </div>
  );
}
