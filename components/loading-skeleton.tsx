import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function LoadingSkeleton() {
  return (
    <Card className="p-6 border-border bg-card">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  )
}
