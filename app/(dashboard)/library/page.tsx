"use client"

import { Suspense, lazy } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSkeleton } from "@/components/loading-skeleton"

const ScriptLibrary = lazy(() =>
  import("@/components/script-library").then((mod) => ({ default: mod.ScriptLibrary })),
)

export default function LibraryPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Script Library</h2>
        <p className="text-base text-muted-foreground">
          Browse and clone pre-built NPC templates for rapid development
        </p>
      </div>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSkeleton />}>
          <ScriptLibrary />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
