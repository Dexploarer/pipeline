"use client"

import { Suspense, lazy } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSkeleton } from "@/components/loading-skeleton"

const WorldMap = lazy(() =>
  import("@/components/world-map").then((mod) => ({ default: mod.WorldMap })),
)
const ContentPackManager = lazy(() =>
  import("@/components/content-pack-manager").then((mod) => ({ default: mod.ContentPackManager })),
)

export default function WorldPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">World Map & Content Packs</h2>
        <p className="text-base text-muted-foreground">
          Organize your content into zones and regions, then bundle them into exportable content packs
        </p>
      </div>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSkeleton />}>
          <WorldMap />
          <div className="mt-6">
            <ContentPackManager />
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
