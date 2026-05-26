"use client"

import { Suspense, lazy } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSkeleton } from "@/components/loading-skeleton"

const ContextInjector = lazy(() =>
  import("@/components/context-injector").then((mod) => ({ default: mod.ContextInjector })),
)
const BatchProcessor = lazy(() =>
  import("@/components/batch-processor").then((mod) => ({ default: mod.BatchProcessor })),
)
const VersionControl = lazy(() =>
  import("@/components/version-control").then((mod) => ({ default: mod.VersionControl })),
)
const ExportManager = lazy(() =>
  import("@/components/export-manager").then((mod) => ({ default: mod.ExportManager })),
)
const ValidationSuite = lazy(() =>
  import("@/components/validation-suite").then((mod) => ({ default: mod.ValidationSuite })),
)

export default function ToolsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Tools</h2>
        <p className="text-base text-muted-foreground">
          Utilities for context injection, batch processing, version control, export, and validation
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSkeleton />}>
            <ContextInjector />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSkeleton />}>
            <BatchProcessor />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSkeleton />}>
            <VersionControl />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSkeleton />}>
            <ExportManager />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSkeleton />}>
            <ValidationSuite />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}
