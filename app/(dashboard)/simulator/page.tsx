"use client"

import { Suspense, lazy } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSkeleton } from "@/components/loading-skeleton"

const NPCSimulator = lazy(() =>
  import("@/components/npc-simulator").then((mod) => ({ default: mod.NPCSimulator })),
)

export default function SimulatorPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">NPC Simulator</h2>
        <p className="text-base text-muted-foreground">
          Test NPC behaviors and interactions in a simulated environment
        </p>
      </div>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSkeleton />}>
          <NPCSimulator />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
