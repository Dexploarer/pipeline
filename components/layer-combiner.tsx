"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, AlertCircle, Layers } from "lucide-react"
import type {
  LayeredQuest,
  GameFlowLayer,
  LoreLayer,
  HistoryLayer,
  RelationshipLayer,
  EconomyLayer,
  WorldEventLayer
} from "@/lib/npc-types"

type LayerCombinerProps = {
  quest: Partial<LayeredQuest>
  onCombine: () => void
}

// Define discriminated union for layer data types
type LayerData =
  | { type: 'gameflow'; data: GameFlowLayer }
  | { type: 'lore'; data: LoreLayer }
  | { type: 'history'; data: HistoryLayer }
  | { type: 'relationships'; data: RelationshipLayer }
  | { type: 'economy'; data: EconomyLayer }
  | { type: 'worldEvents'; data: WorldEventLayer }

export function LayerCombiner({ quest, onCombine }: LayerCombinerProps) {
  const validateLayer = (layerType: string, layerData: LayerData['data']): { valid: boolean; issues: string[] } => {
    const issues: string[] = []

    if (layerType === "gameflow") {
      const gameflowData = layerData as GameFlowLayer
      if (!gameflowData.objectives || gameflowData.objectives.length === 0) {
        issues.push("No objectives defined")
      }
      // Check if rewards exist and if both experience and gold are zero/null/undefined
      // Using OR (||) - at least one reward type must have a value
      if (!gameflowData.rewards ||
          ((gameflowData.rewards.experience ?? 0) === 0 &&
           (gameflowData.rewards.gold ?? 0) === 0)) {
        issues.push("No rewards configured")
      }
    }

    if (layerType === "lore") {
      const loreData = layerData as LoreLayer
      if (!loreData.summary || loreData.summary.trim() === "") {
        issues.push("Missing lore summary")
      }
    }

    return { valid: issues.length === 0, issues }
  }

  const layers = [
    { key: "gameflow", name: "Game Flow", required: true },
    { key: "lore", name: "Lore", required: true },
    { key: "history", name: "History", required: false },
    { key: "relationships", name: "Relationships", required: false },
    { key: "economy", name: "Economy", required: false },
    { key: "worldEvents", name: "World Events", required: false },
  ]

  const layerStatuses = layers.map((layer) => {
    const layerData = quest.layers?.[layer.key as keyof typeof quest.layers]
    const validation = layerData ? validateLayer(layer.key, layerData) : { valid: false, issues: ["Not configured"] }
    return {
      ...layer,
      configured: !!layerData,
      validation,
    }
  })

  const requiredLayersValid = layerStatuses.filter((l) => l.required).every((l) => l.configured && l.validation.valid)

  const canCombine = quest.title && requiredLayersValid

  return (
    <Card className="p-6 border-border bg-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Layer Combination Status
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Review and combine all quest layers into a complete quest
            </p>
          </div>
          <Button onClick={onCombine} disabled={!canCombine} size="lg">
            <Check className="h-4 w-4 mr-2" />
            Combine Layers
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {layerStatuses.map((layer) => (
            <Card
              key={layer.key}
              className={`p-4 ${
                layer.configured && layer.validation.valid
                  ? "bg-green-500/10 border-green-500/20"
                  : layer.required
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-muted/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{layer.name}</span>
                    {layer.required && <Badge variant="destructive">Required</Badge>}
                    {!layer.required && <Badge variant="secondary">Optional</Badge>}
                  </div>
                  {layer.configured && layer.validation.valid && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="h-3 w-3" />
                      <span>Valid</span>
                    </div>
                  )}
                  {layer.validation.issues.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {layer.validation.issues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-1 text-xs text-muted-foreground">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {!canCombine && (
          <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-600">Cannot combine layers yet</p>
                <p className="text-muted-foreground mt-1">
                  {!quest.title && "Quest title is required. "}
                  {!requiredLayersValid && "All required layers must be valid."}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Card>
  )
}
