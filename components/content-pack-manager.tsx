"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useWorldStore } from "@/lib/stores/world-store"
import { useNPCStore } from "@/lib/stores/npc-store"
import { useQuestStore } from "@/lib/stores/quest-store"
import { useLoreStore } from "@/lib/stores/lore-store"
import { Package, Download, Plus, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { ContentPack } from "@/lib/npc-types"

export function ContentPackManager() {
  const { contentPacks, zones, addContentPack, deleteContentPack, exportContentPack, getAssignmentsByZone } =
    useWorldStore()
  const { npcs: _npcs } = useNPCStore()
  const { quests: _quests } = useQuestStore()
  const { loreEntries: _loreEntries } = useLoreStore()

  const [isCreating, setIsCreating] = useState(false)
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [packName, setPackName] = useState("")
  const [packDescription, setPackDescription] = useState("")

  const handleCreatePack = () => {
    if (!packName || selectedZones.length === 0) {
      toast({ title: "Error", description: "Pack name and at least one zone required", variant: "destructive" })
      return
    }

    const packContents = {
      npcs: [] as string[],
      quests: [] as string[],
      lore: [] as string[],
      dialogues: [] as string[],
      relationships: [] as string[],
    }

    selectedZones.forEach((zoneId) => {
      const assignments = getAssignmentsByZone(zoneId)
      assignments.forEach((assignment) => {
        if (assignment.entityType === "npc") packContents.npcs.push(assignment.entityId)
        if (assignment.entityType === "quest") packContents.quests.push(assignment.entityId)
        if (assignment.entityType === "lore") packContents.lore.push(assignment.entityId)
        if (assignment.entityType === "dialogue") packContents.dialogues.push(assignment.entityId)
        if (assignment.entityType === "relationship") packContents.relationships.push(assignment.entityId)
      })
    })

    const pack: ContentPack = {
      id: `pack-${Date.now()}`,
      name: packName,
      version: "1.0.0",
      description: packDescription,
      zoneIds: selectedZones,
      contents: packContents,
      dependencies: [],
      metadata: {
        author: "System",
        createdAt: new Date().toISOString(),
        tags: [],
      },
    }

    addContentPack(pack)
    setIsCreating(false)
    setPackName("")
    setPackDescription("")
    setSelectedZones([])
    toast({ title: "Success", description: "Content pack created" })
  }

  const handleExportPack = (packId: string) => {
    const pack = exportContentPack(packId)
    if (!pack) return

    const dataStr = JSON.stringify(pack, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${pack.name.toLowerCase().replace(/\s+/g, "-")}-v${pack.version}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast({ title: "Exported", description: `${pack.name} downloaded` })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Content Packs</h3>
        </div>
        <Button onClick={() => setIsCreating(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Pack
        </Button>
      </div>

      {isCreating && (
        <Card className="p-6 border-primary">
          <h4 className="font-semibold mb-4">Create Content Pack</h4>
          <div className="space-y-4">
            <div>
              <Label>Pack Name</Label>
              <Input
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="e.g., Darkwood Quest Line"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={packDescription}
                onChange={(e) => setPackDescription(e.target.value)}
                placeholder="Describe this content pack..."
                rows={3}
              />
            </div>
            <div>
              <Label>Select Zones to Include</Label>
              <div className="space-y-2 mt-2">
                {zones.map((zone) => (
                  <div key={zone.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedZones.includes(zone.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedZones([...selectedZones, zone.id])
                        } else {
                          setSelectedZones(selectedZones.filter((id) => id !== zone.id))
                        }
                      }}
                    />
                    <Label className="cursor-pointer">{zone.name}</Label>
                    <Badge variant="outline">{zone.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreatePack}>Create Pack</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contentPacks.map((pack) => (
          <Card key={pack.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-foreground">{pack.name}</h4>
                <Badge variant="outline" className="mt-1">
                  v{pack.version}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => handleExportPack(pack.id)}>
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    deleteContentPack(pack.id)
                    toast({ title: "Pack deleted" })
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{pack.description}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>NPCs: {pack.contents.npcs.length}</span>
              <span>Quests: {pack.contents.quests.length}</span>
              <span>Lore: {pack.contents.lore.length}</span>
              <span>Zones: {pack.zoneIds.length}</span>
            </div>
          </Card>
        ))}
      </div>

      {contentPacks.length === 0 && !isCreating && (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No content packs created yet</p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Pack
          </Button>
        </Card>
      )}
    </div>
  )
}
