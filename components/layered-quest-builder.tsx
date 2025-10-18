"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Layers, Sparkles, History, Users, Coins, Globe, Save, Download, Combine } from "lucide-react"
import type { LayeredQuest } from "@/lib/npc-types"
import { toast } from "@/hooks/use-toast"
import { LayerEditor } from "./layer-editor"
import { LayerCombiner } from "./layer-combiner"
import { SelectModel } from "@/components/select-model"

export function LayeredQuestBuilder() {
  const [quest, setQuest] = useState<Partial<LayeredQuest>>({
    title: "",
    layers: {
      gameflow: {
        objectives: [],
        branches: [],
        triggers: [],
        rewards: { experience: 0, gold: 0 },
        difficulty: "medium",
        estimatedDuration: 30,
      },
      lore: {
        summary: "",
        relevantHistory: [],
        factions: [],
        artifacts: [],
        culturalContext: "",
      },
      history: {
        timeline: [],
        precedingEvents: [],
        consequences: [],
        historicalFigures: [],
      },
      relationships: {
        npcRelationships: [],
        factionDynamics: [],
        playerRelationships: {
          affectedBy: [],
        },
      },
    },
  })

  const [generating, setGenerating] = useState(false)
  const [activeLayer, setActiveLayer] = useState<string>("gameflow")
  const [showCombiner, setShowCombiner] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>("anthropic/claude-sonnet-4")

  const generateLayer = async (layerType: string) => {
    setGenerating(true)
    try {
      const response = await fetch("/api/generate-quest-layer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questTitle: quest.title,
          layerType,
          existingLayers: quest.layers,
          model: selectedModel,
        }),
      })

      // Validate API response before updating state
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // Verify data shape and that layer exists
      if (!data || typeof data.layer === 'undefined' || data.layer === null) {
        throw new Error("Invalid response: missing layer data")
      }

      // Safe merge that doesn't assume layers exists
      setQuest((prev) => ({
        ...prev,
        layers: {
          ...(prev.layers ?? {}),
          [layerType]: data.layer,
        },
      }))

      toast({
        title: "Layer Generated",
        description: `${layerType} layer has been generated successfully`,
      })
    } catch (error) {
      console.error("Failed to generate layer:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate layer",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveDraft = () => {
    if (!quest.title) {
      toast({
        title: "Error",
        description: "Please enter a quest title before saving",
        variant: "destructive",
      })
      return
    }

    try {
      const drafts = JSON.parse(localStorage.getItem("quest-drafts") || "[]")
      const draftIndex = drafts.findIndex((d: any) => d.title === quest.title)

      if (draftIndex >= 0) {
        drafts[draftIndex] = { ...quest, lastModified: Date.now() }
      } else {
        drafts.push({ ...quest, lastModified: Date.now() })
      }

      localStorage.setItem("quest-drafts", JSON.stringify(drafts))

      toast({
        title: "Draft Saved",
        description: `Quest "${quest.title}" has been saved to drafts`,
      })
    } catch (error) {
      console.error("Failed to save draft:", error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save draft to local storage",
        variant: "destructive",
      })
    }
  }

  const handleExportQuest = () => {
    if (!quest.title) {
      toast({
        title: "Error",
        description: "Please enter a quest title before exporting",
        variant: "destructive",
      })
      return
    }

    const questData = JSON.stringify(quest, null, 2)
    const blob = new Blob([questData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quest-${quest.title.toLowerCase().replace(/\s+/g, "-")}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Quest Exported",
      description: `Quest "${quest.title}" has been exported successfully`,
    })
  }

  const handleCombineLayers = () => {
    // Validate quest exists and has required fields
    if (!quest || typeof quest.title !== 'string' || quest.title.trim() === '') {
      toast({
        title: "Validation Error",
        description: "Please enter a valid quest title before combining layers",
        variant: "destructive",
      })
      return
    }

    // Validate layers structure
    if (!quest.layers || typeof quest.layers !== 'object') {
      toast({
        title: "Validation Error",
        description: "Quest layers are not properly configured",
        variant: "destructive",
      })
      return
    }

    const combinedQuest: LayeredQuest = {
      id: `quest-${Date.now()}`,
      title: quest.title,
      version: "1.0.0",
      layers: quest.layers as any,
      metadata: {
        author: "Content Pipeline",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
        status: "draft",
      },
    }

    const questData = JSON.stringify(combinedQuest, null, 2)
    const blob = new Blob([questData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `combined-quest-${quest.title.toLowerCase().replace(/\s+/g, "-")}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Layers Combined",
      description: "All quest layers have been merged into a complete quest package",
    })
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border bg-card">
        <div className="space-y-4">
          <div>
            <Label htmlFor="quest-title">Quest Title</Label>
            <Input
              id="quest-title"
              value={quest.title}
              onChange={(e) => setQuest({ ...quest, title: e.target.value })}
              placeholder="Enter quest title..."
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="model-select">AI Model</Label>
            <SelectModel
              value={selectedModel}
              onValueChange={setSelectedModel}
              placeholder="Select AI model for generation..."
              className="mt-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Layers className="h-3 w-3" />
                Layered Quest System
              </Badge>
              <Badge variant="secondary">{Object.keys(quest.layers || {}).length} Layers Configured</Badge>
            </div>
            <Button variant="outline" onClick={() => setShowCombiner(!showCombiner)}>
              <Combine className="h-4 w-4 mr-2" />
              {showCombiner ? "Hide" : "Show"} Combiner
            </Button>
          </div>
        </div>
      </Card>

      {showCombiner && <LayerCombiner quest={quest} onCombine={handleCombineLayers} />}

      <Tabs value={activeLayer} onValueChange={setActiveLayer} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-card border border-border">
          <TabsTrigger value="gameflow">
            <Layers className="h-4 w-4 mr-2" />
            Game Flow
          </TabsTrigger>
          <TabsTrigger value="lore">
            <Sparkles className="h-4 w-4 mr-2" />
            Lore
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="relationships">
            <Users className="h-4 w-4 mr-2" />
            Relationships
          </TabsTrigger>
          <TabsTrigger value="economy">
            <Coins className="h-4 w-4 mr-2" />
            Economy
          </TabsTrigger>
          <TabsTrigger value="world-events">
            <Globe className="h-4 w-4 mr-2" />
            World Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gameflow" className="space-y-4 mt-6">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Game Flow Layer</h3>
              <Button onClick={() => generateLayer("gameflow")} disabled={generating || !quest.title}>
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "AI Generate"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Define objectives, branches, triggers, and rewards for the quest mechanics
            </p>
            <div className="space-y-4">
              <div>
                <Label>Difficulty</Label>
                <select
                  className="w-full mt-2 p-2 rounded-md border border-border bg-background"
                  value={quest.layers?.gameflow?.difficulty ?? "medium"}
                  onChange={(e) =>
                    setQuest({
                      ...quest,
                      layers: {
                        ...(quest.layers ?? {}),
                        gameflow: {
                          ...(quest.layers?.gameflow ?? {}),
                          difficulty: e.target.value as any,
                        },
                      },
                    })
                  }
                >
                  <option value="trivial">Trivial</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="epic">Epic</option>
                </select>
              </div>
              <div>
                <Label>Estimated Duration (minutes)</Label>
                <Input
                  type="number"
                  value={quest.layers?.gameflow?.estimatedDuration ?? 30}
                  onChange={(e) =>
                    setQuest({
                      ...quest,
                      layers: {
                        ...(quest.layers ?? {}),
                        gameflow: {
                          ...(quest.layers?.gameflow ?? {}),
                          estimatedDuration: Number.parseInt(e.target.value),
                        },
                      },
                    })
                  }
                  className="mt-2"
                />
              </div>
              <LayerEditor
                layerType="gameflow"
                layerData={quest.layers?.gameflow}
                onChange={(data) =>
                  setQuest({
                    ...quest,
                    layers: { ...(quest.layers ?? {}), gameflow: data },
                  })
                }
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="lore" className="space-y-4 mt-6">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Lore Layer</h3>
              <Button onClick={() => generateLayer("lore")} disabled={generating || !quest.title}>
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "AI Generate"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Add narrative context, factions, artifacts, and cultural significance
            </p>
            <div className="space-y-4">
              <div>
                <Label>Summary</Label>
                <Textarea
                  value={quest.layers?.lore?.summary ?? ""}
                  onChange={(e) =>
                    setQuest({
                      ...quest,
                      layers: {
                        ...(quest.layers ?? {}),
                        lore: {
                          ...(quest.layers?.lore ?? {}),
                          summary: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="Brief narrative summary of the quest..."
                  className="mt-2"
                  rows={4}
                />
              </div>
              <div>
                <Label>Cultural Context</Label>
                <Textarea
                  value={quest.layers?.lore?.culturalContext ?? ""}
                  onChange={(e) =>
                    setQuest({
                      ...quest,
                      layers: {
                        ...(quest.layers ?? {}),
                        lore: {
                          ...(quest.layers?.lore ?? {}),
                          culturalContext: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="Cultural and societal context..."
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">History Layer</h3>
              <Button onClick={() => generateLayer("history")} disabled={generating || !quest.title}>
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "AI Generate"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Define historical events, timelines, and consequences that inform this quest
            </p>
            <LayerEditor
              layerType="history"
              layerData={quest.layers?.history}
              onChange={(data) =>
                setQuest({
                  ...quest,
                  layers: { ...(quest.layers ?? {}), history: data },
                })
              }
            />
          </Card>
        </TabsContent>

        <TabsContent value="relationships" className="space-y-4 mt-6">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Relationships Layer</h3>
              <Button onClick={() => generateLayer("relationships")} disabled={generating || !quest.title}>
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "AI Generate"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Map NPC relationships, faction dynamics, and player reputation requirements
            </p>
            <LayerEditor
              layerType="relationships"
              layerData={quest.layers?.relationships}
              onChange={(data) =>
                setQuest({
                  ...quest,
                  layers: { ...(quest.layers ?? {}), relationships: data },
                })
              }
            />
          </Card>
        </TabsContent>

        <TabsContent value="economy" className="space-y-4 mt-6">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Economy Layer</h3>
              <Button onClick={() => generateLayer("economy")} disabled={generating || !quest.title}>
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "AI Generate"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Define economic costs, impacts, and market changes from this quest
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="world-events" className="space-y-4 mt-6">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">World Events Layer</h3>
              <Button onClick={() => generateLayer("world-events")} disabled={generating || !quest.title}>
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "AI Generate"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Configure triggered events, environmental changes, and global effects
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleSaveDraft} disabled={!quest.title}>
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button onClick={handleExportQuest} disabled={!quest.title}>
          <Download className="h-4 w-4 mr-2" />
          Export Quest
        </Button>
      </div>
    </div>
  )
}
