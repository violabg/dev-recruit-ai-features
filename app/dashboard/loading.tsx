import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-10 w-40 rounded bg-muted animate-pulse" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 rounded bg-muted animate-pulse mb-2" />
              <div className="h-3 w-32 rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent positions skeleton */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>
              <div className="h-5 w-32 rounded bg-muted animate-pulse" />
            </CardTitle>
            <CardDescription>
              <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="h-4 w-32 rounded bg-muted animate-pulse mb-1" />
                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="h-8 w-20 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent activity skeleton */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>
              <div className="h-5 w-32 rounded bg-muted animate-pulse" />
            </CardTitle>
            <CardDescription>
              <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[140px] flex-col items-center justify-center rounded-lg border border-dashed">
              <div className="h-4 w-32 rounded bg-muted animate-pulse mb-2" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
