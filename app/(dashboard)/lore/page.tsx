"use client"

import { Suspense, lazy } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSkeleton } from "@/components/loading-skeleton"

const LoreManager = lazy(() =>
  import("@/components/lore-manager").then((mod) => ({ default: mod.LoreManager })),
)

export default function LorePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Lore Management</h2>
        <p className="text-base text-muted-foreground">
          Create and manage interconnected lore entries for your game world
        </p>
      </div>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSkeleton />}>
          <LoreManager />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
