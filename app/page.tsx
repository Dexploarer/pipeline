"use client"

import { Suspense, lazy, useState } from "react"
import { Sparkles } from "lucide-react"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarNav } from "@/components/sidebar-nav"

const NPCGenerator = lazy(() => import("@/components/npc-generator").then((mod) => ({ default: mod.NPCGenerator })))
const NPCSimulator = lazy(() => import("@/components/npc-simulator").then((mod) => ({ default: mod.NPCSimulator })))
const ScriptLibrary = lazy(() => import("@/components/script-library").then((mod) => ({ default: mod.ScriptLibrary })))
const LayeredQuestBuilder = lazy(() =>
  import("@/components/layered-quest-builder").then((mod) => ({ default: mod.LayeredQuestBuilder })),
)
const ContextInjector = lazy(() =>
  import("@/components/context-injector").then((mod) => ({ default: mod.ContextInjector })),
)
const LoreManager = lazy(() => import("@/components/lore-manager").then((mod) => ({ default: mod.LoreManager })))
const RelationshipGraph = lazy(() =>
  import("@/components/relationship-graph").then((mod) => ({ default: mod.RelationshipGraph })),
)
const QuestFlowVisualizer = lazy(() =>
  import("@/components/quest-flow-visualizer").then((mod) => ({ default: mod.QuestFlowVisualizer })),
)
const DialogueTreeEditor = lazy(() =>
  import("@/components/dialogue-tree-editor").then((mod) => ({ default: mod.DialogueTreeEditor })),
)
const BatchProcessor = lazy(() =>
  import("@/components/batch-processor").then((mod) => ({ default: mod.BatchProcessor })),
)
const VersionControl = lazy(() =>
  import("@/components/version-control").then((mod) => ({ default: mod.VersionControl })),
)
const ExportManager = lazy(() => import("@/components/export-manager").then((mod) => ({ default: mod.ExportManager })))
const ValidationSuite = lazy(() =>
  import("@/components/validation-suite").then((mod) => ({ default: mod.ValidationSuite })),
)
const WorldMap = lazy(() => import("@/components/world-map").then((mod) => ({ default: mod.WorldMap })))
const ContentPackManager = lazy(() =>
  import("@/components/content-pack-manager").then((mod) => ({ default: mod.ContentPackManager })),
)

export default function Home() {
  const [activeTab, setActiveTab] = useState("generator")

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/30 backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">NPC Content Pipeline</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Game Content Generation</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground font-mono">v2.1.0</span>
            </div>
          </div>
        </div>
      </header>

      <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="pt-[89px] px-8 pb-12 container mx-auto max-w-7xl">
        {/* Generator Tab */}
        {activeTab === "generator" && (
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
        )}

        {/* Quest Builder Tab */}
        {activeTab === "quest-builder" && (
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
        )}

        {/* Lore Tab */}
        {activeTab === "lore" && (
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
        )}

        {/* Relationships Tab */}
        {activeTab === "relationships" && (
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
        )}

        {/* Flow Tab */}
        {activeTab === "flow" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Quest Flow Visualizer</h2>
              <p className="text-base text-muted-foreground">
                Visualize and edit quest progression, branches, and outcomes
              </p>
            </div>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSkeleton />}>
                <QuestFlowVisualizer />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {/* Dialogue Tab */}
        {activeTab === "dialogue" && (
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
        )}

        {/* Context Tab */}
        {activeTab === "context" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Context Management</h2>
              <p className="text-base text-muted-foreground">
                Manage and inject lore, history, and world context into your content generation
              </p>
            </div>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSkeleton />}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ContextInjector />
                  <BatchProcessor />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <VersionControl />
                  <ExportManager />
                </div>
                <div className="mt-6">
                  <ValidationSuite />
                </div>
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {/* Simulator Tab */}
        {activeTab === "simulator" && (
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
        )}

        {/* Library Tab */}
        {activeTab === "library" && (
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
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
              <p className="text-base text-muted-foreground">
                Monitor NPC performance, player interactions, and content effectiveness
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 rounded-xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-lg">
                <p className="text-sm font-medium text-muted-foreground mb-3">Total NPCs Generated</p>
                <p className="text-4xl font-bold text-foreground mb-2">247</p>
                <p className="text-sm text-accent font-medium">↑ 12% from last week</p>
              </div>
              <div className="p-8 rounded-xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-lg">
                <p className="text-sm font-medium text-muted-foreground mb-3">Avg Response Time</p>
                <p className="text-4xl font-bold text-foreground mb-2">87ms</p>
                <p className="text-sm text-accent font-medium">↓ 5ms improvement</p>
              </div>
              <div className="p-8 rounded-xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-lg">
                <p className="text-sm font-medium text-muted-foreground mb-3">Player Satisfaction</p>
                <p className="text-4xl font-bold text-foreground mb-2">4.7/5</p>
                <p className="text-sm text-accent font-medium">↑ 0.3 from last month</p>
              </div>
            </div>
          </div>
        )}

        {/* World Map Tab */}
        {activeTab === "world-map" && (
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
        )}
      </main>
    </div>
  )
}
