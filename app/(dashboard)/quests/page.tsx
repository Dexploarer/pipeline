"use client"

import { Suspense, lazy } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSkeleton } from "@/components/loading-skeleton"

const LayeredQuestBuilder = lazy(() =>
  import("@/components/layered-quest-builder").then((mod) => ({ default: mod.LayeredQuestBuilder })),
)

export default function QuestsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Layered Quest Builder</h2>
        <p className="text-base text-muted-foreground">
          Build quests in layers: game flow, lore, history, relationships, economy, and world events
        </p>
      </div>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSkeleton />}>
          <LayeredQuestBuilder />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
