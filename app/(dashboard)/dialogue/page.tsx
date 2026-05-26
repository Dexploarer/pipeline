"use client"

import { Suspense, lazy } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSkeleton } from "@/components/loading-skeleton"

const DialogueTreeEditor = lazy(() =>
  import("@/components/dialogue-tree-editor").then((mod) => ({ default: mod.DialogueTreeEditor })),
)

export default function DialoguePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Dialogue Tree Editor</h2>
        <p className="text-base text-muted-foreground">
          Create and manage branching dialogue trees for NPC interactions
        </p>
      </div>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSkeleton />}>
          <DialogueTreeEditor />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
