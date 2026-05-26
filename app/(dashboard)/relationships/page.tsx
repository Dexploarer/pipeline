"use client"

import { Suspense, lazy } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSkeleton } from "@/components/loading-skeleton"

const RelationshipGraph = lazy(() =>
  import("@/components/relationship-graph").then((mod) => ({ default: mod.RelationshipGraph })),
)

export default function RelationshipsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Relationship Network</h2>
        <p className="text-base text-muted-foreground">
          Map and visualize relationships between NPCs, factions, and entities
        </p>
      </div>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSkeleton />}>
          <RelationshipGraph />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
