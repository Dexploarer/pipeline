"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import type { QuestObjective, QuestBranch, QuestTrigger, HistoricalEvent } from "@/lib/npc-types"

type LayerEditorProps = {
  layerType: "gameflow" | "lore" | "history" | "relationships" | "economy" | "world-events"
  layerData: any
  onChange: (data: any) => void
}

export function LayerEditor({ layerType, layerData, onChange }: LayerEditorProps) {
  const [_editingIndex, _setEditingIndex] = useState<number | null>(null)

  if (layerType === "gameflow") {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">Objectives</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newObjective: QuestObjective = {
                  id: `obj-${Date.now()}`,
                  type: "fetch",
                  description: "",
                  optional: false,
                }
                onChange({
                  ...layerData,
                  objectives: [...(layerData.objectives || []), newObjective],
                })
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Objective
            </Button>
          </div>
          <div className="space-y-3">
            {(layerData.objectives || []).map((obj: QuestObjective, idx: number) => (
              <Card key={obj.id} className="p-4 bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <select
                      className="p-2 rounded border border-border bg-background text-sm"
                      value={obj.type}
                      onChange={(e) => {
                        const updated = [...layerData.objectives]
                        updated[idx] = { ...obj, type: e.target.value }
                        onChange({ ...layerData, objectives: updated })
                      }}
                    >
                      <option value="fetch">Fetch</option>
                      <option value="kill">Kill</option>
                      <option value="escort">Escort</option>
                      <option value="discover">Discover</option>
                      <option value="craft">Craft</option>
                      <option value="social">Social</option>
                      <option value="puzzle">Puzzle</option>
                      <option value="stealth">Stealth</option>
                    </select>
                    <Badge variant={obj.optional ? "secondary" : "default"}>
                      {obj.optional ? "Optional" : "Required"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updated = layerData.objectives.filter((_: any, i: number) => i !== idx)
                        onChange({ ...layerData, objectives: updated })
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Objective description..."
                    value={obj.description}
                    onChange={(e) => {
                      const updated = [...layerData.objectives]
                      updated[idx] = { ...obj, description: e.target.value }
                      onChange({ ...layerData, objectives: updated })
                    }}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Target"
                      value={obj.target || ""}
                      onChange={(e) => {
                        const updated = [...layerData.objectives]
                        updated[idx] = { ...obj, target: e.target.value }
                        onChange({ ...layerData, objectives: updated })
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={obj.quantity || ""}
                      onChange={(e) => {
                        const updated = [...layerData.objectives]
                        updated[idx] = { ...obj, quantity: Number.parseInt(e.target.value) || undefined }
                        onChange({ ...layerData, objectives: updated })
                      }}
                    />
                    <Input
                      placeholder="Location"
                      value={obj.location || ""}
                      onChange={(e) => {
                        const updated = [...layerData.objectives]
                        updated[idx] = { ...obj, location: e.target.value }
                        onChange({ ...layerData, objectives: updated })
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">Quest Branches</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newBranch: QuestBranch = {
                  id: `branch-${Date.now()}`,
                  condition: "",
                  outcomes: { success: [], failure: [] },
                }
                onChange({
                  ...layerData,
                  branches: [...(layerData.branches || []), newBranch],
                })
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Branch
            </Button>
          </div>
          <div className="space-y-3">
            {(layerData.branches || []).map((branch: QuestBranch, idx: number) => (
              <Card key={branch.id} className="p-4 bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Branch Condition</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updated = layerData.branches.filter((_: any, i: number) => i !== idx)
                        onChange({ ...layerData, branches: updated })
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    placeholder="e.g., player.reputation > 50"
                    value={branch.condition}
                    onChange={(e) => {
                      const updated = [...layerData.branches]
                      updated[idx] = { ...branch, condition: e.target.value }
                      onChange({ ...layerData, branches: updated })
                    }}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Success Outcomes</Label>
                      <Textarea
                        placeholder="One per line..."
                        value={branch.outcomes.success.join("\n")}
                        onChange={(e) => {
                          const updated = [...layerData.branches]
                          updated[idx] = {
                            ...branch,
                            outcomes: {
                              ...branch.outcomes,
                              success: e.target.value.split("\n").filter((s) => s.trim()),
                            },
                          }
                          onChange({ ...layerData, branches: updated })
                        }}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Failure Outcomes</Label>
                      <Textarea
                        placeholder="One per line..."
                        value={branch.outcomes.failure.join("\n")}
                        onChange={(e) => {
                          const updated = [...layerData.branches]
                          updated[idx] = {
                            ...branch,
                            outcomes: {
                              ...branch.outcomes,
                              failure: e.target.value.split("\n").filter((s) => s.trim()),
                            },
                          }
                          onChange({ ...layerData, branches: updated })
                        }}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">Triggers</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newTrigger: QuestTrigger = {
                  event: "",
                  condition: "",
                  action: "",
                }
                onChange({
                  ...layerData,
                  triggers: [...(layerData.triggers || []), newTrigger],
                })
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Trigger
            </Button>
          </div>
          <div className="space-y-3">
            {(layerData.triggers || []).map((trigger: QuestTrigger, idx: number) => (
              <Card key={idx} className="p-4 bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Event Trigger</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updated = layerData.triggers.filter((_: any, i: number) => i !== idx)
                        onChange({ ...layerData, triggers: updated })
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Event"
                      value={trigger.event}
                      onChange={(e) => {
                        const updated = [...layerData.triggers]
                        updated[idx] = { ...trigger, event: e.target.value }
                        onChange({ ...layerData, triggers: updated })
                      }}
                    />
                    <Input
                      placeholder="Condition"
                      value={trigger.condition}
                      onChange={(e) => {
                        const updated = [...layerData.triggers]
                        updated[idx] = { ...trigger, condition: e.target.value }
                        onChange({ ...layerData, triggers: updated })
                      }}
                    />
                    <Input
                      placeholder="Action"
                      value={trigger.action}
                      onChange={(e) => {
                        const updated = [...layerData.triggers]
                        updated[idx] = { ...trigger, action: e.target.value }
                        onChange({ ...layerData, triggers: updated })
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-4 bg-muted/50">
          <Label className="text-base font-semibold mb-3 block">Rewards</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Experience</Label>
              <Input
                type="number"
                value={layerData.rewards?.experience || 0}
                onChange={(e) => {
                  onChange({
                    ...layerData,
                    rewards: {
                      ...layerData.rewards,
                      experience: Number.parseInt(e.target.value) || 0,
                    },
                  })
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Gold</Label>
              <Input
                type="number"
                value={layerData.rewards?.gold || 0}
                onChange={(e) => {
                  onChange({
                    ...layerData,
                    rewards: {
                      ...layerData.rewards,
                      gold: Number.parseInt(e.target.value) || 0,
                    },
                  })
                }}
                className="mt-1"
              />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (layerType === "history") {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">Historical Timeline</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newEvent: HistoricalEvent = {
                  id: `event-${Date.now()}`,
                  date: "",
                  title: "",
                  description: "",
                  participants: [],
                  location: "",
                  impact: "minor",
                }
                onChange({
                  ...layerData,
                  timeline: [...(layerData.timeline || []), newEvent],
                })
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Event
            </Button>
          </div>
          <div className="space-y-3">
            {(layerData.timeline || []).map((event: HistoricalEvent, idx: number) => (
              <Card key={event.id} className="p-4 bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="Event title..."
                      value={event.title}
                      onChange={(e) => {
                        const updated = [...layerData.timeline]
                        updated[idx] = { ...event, title: e.target.value }
                        onChange({ ...layerData, timeline: updated })
                      }}
                      className="font-semibold"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updated = layerData.timeline.filter((_: any, i: number) => i !== idx)
                        onChange({ ...layerData, timeline: updated })
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Date"
                      value={event.date}
                      onChange={(e) => {
                        const updated = [...layerData.timeline]
                        updated[idx] = { ...event, date: e.target.value }
                        onChange({ ...layerData, timeline: updated })
                      }}
                    />
                    <Input
                      placeholder="Location"
                      value={event.location}
                      onChange={(e) => {
                        const updated = [...layerData.timeline]
                        updated[idx] = { ...event, location: e.target.value }
                        onChange({ ...layerData, timeline: updated })
                      }}
                    />
                    <select
                      className="p-2 rounded border border-border bg-background text-sm"
                      value={event.impact}
                      onChange={(e) => {
                        const updated = [...layerData.timeline]
                        updated[idx] = { ...event, impact: e.target.value as any }
                        onChange({ ...layerData, timeline: updated })
                      }}
                    >
                      <option value="minor">Minor Impact</option>
                      <option value="moderate">Moderate Impact</option>
                      <option value="major">Major Impact</option>
                      <option value="world-changing">World-Changing</option>
                    </select>
                  </div>
                  <Textarea
                    placeholder="Event description..."
                    value={event.description}
                    onChange={(e) => {
                      const updated = [...layerData.timeline]
                      updated[idx] = { ...event, description: e.target.value }
                      onChange({ ...layerData, timeline: updated })
                    }}
                    rows={3}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (layerType === "relationships") {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">NPC Relationships</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newRel = {
                  npcId: `npc-${Date.now()}`,
                  name: "",
                  relationship: "neutral",
                  strength: 0,
                  history: "",
                  questRole: "observer",
                }
                onChange({
                  ...layerData,
                  npcRelationships: [...(layerData.npcRelationships || []), newRel],
                })
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add NPC
            </Button>
          </div>
          <div className="space-y-3">
            {(layerData.npcRelationships || []).map((rel: any, idx: number) => (
              <Card key={rel.npcId} className="p-4 bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="NPC Name"
                      value={rel.name}
                      onChange={(e) => {
                        const updated = [...layerData.npcRelationships]
                        updated[idx] = { ...rel, name: e.target.value }
                        onChange({ ...layerData, npcRelationships: updated })
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updated = layerData.npcRelationships.filter((_: any, i: number) => i !== idx)
                        onChange({ ...layerData, npcRelationships: updated })
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      className="p-2 rounded border border-border bg-background text-sm"
                      value={rel.relationship}
                      onChange={(e) => {
                        const updated = [...layerData.npcRelationships]
                        updated[idx] = { ...rel, relationship: e.target.value }
                        onChange({ ...layerData, npcRelationships: updated })
                      }}
                    >
                      <option value="ally">Ally</option>
                      <option value="rival">Rival</option>
                      <option value="neutral">Neutral</option>
                      <option value="enemy">Enemy</option>
                      <option value="family">Family</option>
                      <option value="romantic">Romantic</option>
                      <option value="mentor">Mentor</option>
                    </select>
                    <Input
                      type="number"
                      placeholder="Strength (-100 to 100)"
                      value={rel.strength}
                      onChange={(e) => {
                        const updated = [...layerData.npcRelationships]
                        updated[idx] = { ...rel, strength: Number.parseInt(e.target.value) || 0 }
                        onChange({ ...layerData, npcRelationships: updated })
                      }}
                    />
                    <select
                      className="p-2 rounded border border-border bg-background text-sm"
                      value={rel.questRole}
                      onChange={(e) => {
                        const updated = [...layerData.npcRelationships]
                        updated[idx] = { ...rel, questRole: e.target.value }
                        onChange({ ...layerData, npcRelationships: updated })
                      }}
                    >
                      <option value="giver">Quest Giver</option>
                      <option value="helper">Helper</option>
                      <option value="obstacle">Obstacle</option>
                      <option value="beneficiary">Beneficiary</option>
                      <option value="observer">Observer</option>
                    </select>
                  </div>
                  <Textarea
                    placeholder="Relationship history..."
                    value={rel.history}
                    onChange={(e) => {
                      const updated = [...layerData.npcRelationships]
                      updated[idx] = { ...rel, history: e.target.value }
                      onChange({ ...layerData, npcRelationships: updated })
                    }}
                    rows={2}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center text-muted-foreground py-8">
      Layer editor for {layerType} - Use AI Generate or add content manually
    </div>
  )
}
