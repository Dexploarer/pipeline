"use client"

import { Suspense, lazy } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSkeleton } from "@/components/loading-skeleton"

const NPCGenerator = lazy(() =>
  import("@/components/npc-generator").then((mod) => ({ default: mod.NPCGenerator })),
)

export default function GeneratorPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">AI Script Generator</h2>
        <p className="text-base text-muted-foreground">
          Generate NPC scripts with personalities, dialogues, quests, and behaviors using AI
        </p>
      </div>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSkeleton />}>
          <NPCGenerator />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
