"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWorldStore } from "@/lib/stores/world-store"
import { useNPCStore } from "@/lib/stores/npc-store"
import { useQuestStore } from "@/lib/stores/quest-store"
import { useLoreStore } from "@/lib/stores/lore-store"
import { Map, Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { WorldZone } from "@/lib/npc-types"

export function WorldMap() {
  const { zones, regions: _regions, addZone, updateZone: _updateZone, deleteZone, addRegion: _addRegion, assignments: _assignments, getAssignmentsByZone } =
    useWorldStore()
  const { npcs: _npcs } = useNPCStore()
  const { quests: _quests } = useQuestStore()
  const { loreEntries: _loreEntries } = useLoreStore()

  const [_selectedZone, setSelectedZone] = useState<WorldZone | null>(null)
  const [isCreatingZone, setIsCreatingZone] = useState(false)
  const [newZone, setNewZone] = useState<Partial<WorldZone>>({
    name: "",
    description: "",
    type: "wilderness",
    coordinates: { x: 0, y: 0, width: 100, height: 100 },
    dangerLevel: 1,
    factions: [],
    resources: [],
    connectedZones: [],
    metadata: { color: "#3b82f6", discovered: true, locked: false },
  })

  const handleCreateZone = () => {
    if (!newZone.name) {
      toast({ title: "Error", description: "Zone name is required", variant: "destructive" })
      return
    }

    const zone: WorldZone = {
      id: `zone-${Date.now()}`,
      name: newZone.name,
      description: newZone.description || "",
      type: newZone.type || "wilderness",
      coordinates: newZone.coordinates || { x: 0, y: 0, width: 100, height: 100 },
      dangerLevel: newZone.dangerLevel || 1,
      factions: newZone.factions || [],
      resources: newZone.resources || [],
      connectedZones: newZone.connectedZones || [],
      metadata: newZone.metadata || { color: "#3b82f6", discovered: true, locked: false },
    }

    addZone(zone)
    setIsCreatingZone(false)
    setNewZone({
      name: "",
      description: "",
      type: "wilderness",
      coordinates: { x: 0, y: 0, width: 100, height: 100 },
      dangerLevel: 1,
      factions: [],
      resources: [],
      connectedZones: [],
      metadata: { color: "#3b82f6", discovered: true, locked: false },
    })
    toast({ title: "Success", description: "Zone created successfully" })
  }

  const getZoneContent = (zoneId: string) => {
    const zoneAssignments = getAssignmentsByZone(zoneId)
    return {
      npcs: zoneAssignments.filter((a) => a.entityType === "npc").length,
      quests: zoneAssignments.filter((a) => a.entityType === "quest").length,
      lore: zoneAssignments.filter((a) => a.entityType === "lore").length,
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">World Map & Zones</h3>
        </div>
        <Button onClick={() => setIsCreatingZone(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Zone
        </Button>
      </div>

      {isCreatingZone && (
        <Card className="p-6 border-primary">
          <h4 className="font-semibold mb-4">Create New Zone</h4>
          <div className="space-y-4">
            <div>
              <Label>Zone Name</Label>
              <Input
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="e.g., Darkwood Forest"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newZone.description}
                onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                placeholder="Describe this zone..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Zone Type</Label>
                <Select
                  value={newZone.type}
                  onValueChange={(value: WorldZone["type"]) => setNewZone({ ...newZone, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="city">City</SelectItem>
                    <SelectItem value="wilderness">Wilderness</SelectItem>
                    <SelectItem value="dungeon">Dungeon</SelectItem>
                    <SelectItem value="village">Village</SelectItem>
                    <SelectItem value="landmark">Landmark</SelectItem>
                    <SelectItem value="region">Region</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Danger Level</Label>
                <Select
                  value={String(newZone.dangerLevel)}
                  onValueChange={(value: string) =>
                    setNewZone({ ...newZone, dangerLevel: Number(value) as WorldZone["dangerLevel"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Safe</SelectItem>
                    <SelectItem value="2">2 - Low</SelectItem>
                    <SelectItem value="3">3 - Medium</SelectItem>
                    <SelectItem value="4">4 - High</SelectItem>
                    <SelectItem value="5">5 - Extreme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateZone}>Create Zone</Button>
              <Button variant="outline" onClick={() => setIsCreatingZone(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone) => {
          const content = getZoneContent(zone.id)
          return (
            <Card
              key={zone.id}
              className="p-4 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedZone(zone)}
              style={{ borderLeftColor: zone.metadata.color, borderLeftWidth: "4px" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-foreground">{zone.name}</h4>
                  <Badge variant="outline" className="mt-1">
                    {zone.type}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedZone(zone)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteZone(zone.id)
                      toast({ title: "Zone deleted" })
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{zone.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Danger: {zone.dangerLevel}/5</span>
                <span>NPCs: {content.npcs}</span>
                <span>Quests: {content.quests}</span>
              </div>
            </Card>
          )
        })}
      </div>

      {zones.length === 0 && !isCreatingZone && (
        <Card className="p-12 text-center">
          <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No zones created yet</p>
          <Button onClick={() => setIsCreatingZone(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Zone
          </Button>
        </Card>
      )}
    </div>
  )
}
