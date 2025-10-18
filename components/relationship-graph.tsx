"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Sparkles } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRelationshipStore } from "@/lib/stores/relationship-store"
import { CrudActions } from "./shared/crud-actions"
import { EditDialog } from "./shared/edit-dialog"

export function RelationshipGraph() {
  const { relationships, addRelationship, updateRelationship, deleteRelationship } = useRelationshipStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newRel, setNewRel] = useState({
    from: "",
    to: "",
    type: "neutral" as const,
    strength: 0,
    description: "",
  })

  const getRelationshipColor = (type: string) => {
    const colors = {
      ally: "text-green-500",
      rival: "text-orange-500",
      neutral: "text-gray-500",
      enemy: "text-red-500",
      family: "text-blue-500",
      romantic: "text-pink-500",
      mentor: "text-purple-500",
    }
    return colors[type as keyof typeof colors]
  }

  const handleSaveRelationship = () => {
    // Validate both entities are filled
    if (!newRel.from || !newRel.to) {
      toast({ title: "Error", description: "Please fill in both entities", variant: "destructive" })
      return
    }

    // Ensure from !== to
    if (newRel.from === newRel.to) {
      toast({ title: "Error", description: "Entities cannot have a relationship with themselves", variant: "destructive" })
      return
    }

    // Validate strength is a number within -100 to 100
    if (typeof newRel.strength !== "number" || isNaN(newRel.strength)) {
      toast({ title: "Error", description: "Strength must be a valid number", variant: "destructive" })
      return
    }

    if (newRel.strength < -100 || newRel.strength > 100) {
      toast({ title: "Error", description: "Strength must be between -100 and 100", variant: "destructive" })
      return
    }

    // Validate type is one of allowed values
    const allowedTypes = ["ally", "rival", "neutral", "enemy", "family", "romantic", "mentor"]
    if (!allowedTypes.includes(newRel.type)) {
      toast({ title: "Error", description: "Invalid relationship type", variant: "destructive" })
      return
    }

    // Enforce description length <= 500 chars
    if (newRel.description.length > 500) {
      toast({ title: "Error", description: "Description must be 500 characters or less", variant: "destructive" })
      return
    }

    const relationship = {
      id: crypto.randomUUID(),
      ...newRel,
    }

    addRelationship(relationship)
    setNewRel({ from: "", to: "", type: "neutral", strength: 0, description: "" })
    setShowAddForm(false)
    toast({ title: "Relationship Added", description: `Added relationship between ${newRel.from} and ${newRel.to}` })
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
  }

  const handleSaveEdit = () => {
    setEditingId(null)
    toast({ title: "Relationship Updated", description: "Changes have been saved" })
  }

  const handleDuplicate = (id: string) => {
    const rel = relationships.find((r) => r.id === id)
    if (rel) {
      const duplicate = {
        ...rel,
        id: crypto.randomUUID(),
        from: `${rel.from} (Copy)`,
      }
      addRelationship(duplicate)
      toast({ title: "Relationship Duplicated", description: "Created a copy" })
    }
  }

  const handleDelete = (id: string) => {
    deleteRelationship(id)
    toast({ title: "Relationship Deleted", description: "Relationship has been removed" })
  }

  const handleAIGenerate = async () => {
    toast({ title: "Generating Relationships", description: "AI is analyzing existing lore..." })
    setTimeout(() => {
      const generated = {
        id: crypto.randomUUID(),
        from: "Shadow Council",
        to: "Royal Guard",
        type: "enemy" as const,
        strength: -60,
        description: "Secret opposition to the crown",
      }
      addRelationship(generated)
      toast({ title: "Relationships Generated", description: "Added 1 new relationship" })
    }, 2000)
  }

  const editingRel = relationships.find((r) => r.id === editingId)

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Relationship Network</h3>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Relationship
            </Button>
            <Button size="sm" onClick={handleAIGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Generate
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">Map relationships between NPCs, factions, and entities</p>

        {showAddForm && (
          <Card className="p-4 mb-4 border-border bg-background">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="From entity..."
                  value={newRel.from}
                  onChange={(e) => setNewRel({ ...newRel, from: e.target.value })}
                />
                <Input
                  placeholder="To entity..."
                  value={newRel.to}
                  onChange={(e) => setNewRel({ ...newRel, to: e.target.value })}
                />
              </div>
              <Select value={newRel.type} onValueChange={(value: any) => setNewRel({ ...newRel, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ally">Ally</SelectItem>
                  <SelectItem value="rival">Rival</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="enemy">Enemy</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="romantic">Romantic</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Strength (-100 to 100)"
                value={newRel.strength}
                onChange={(e) => setNewRel({ ...newRel, strength: Number.parseInt(e.target.value) })}
              />
              <Input
                placeholder="Description..."
                value={newRel.description}
                onChange={(e) => setNewRel({ ...newRel, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveRelationship} className="flex-1">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {relationships.map((rel) => (
            <div key={rel.id} className="p-4 rounded-lg border border-border bg-background">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{rel.from}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-px w-8 bg-border" />
                    <Badge variant="outline" className={getRelationshipColor(rel.type)}>
                      {rel.type}
                    </Badge>
                    <div className="h-px w-8 bg-border" />
                  </div>
                  <span className="font-medium text-sm">{rel.to}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {rel.strength > 0 ? "+" : ""}
                    {rel.strength}
                  </Badge>
                  <CrudActions
                    onEdit={() => handleEdit(rel.id)}
                    onDuplicate={() => handleDuplicate(rel.id)}
                    onDelete={() => handleDelete(rel.id)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{rel.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <EditDialog
        open={!!editingId}
        onOpenChange={(open) => !open && setEditingId(null)}
        title="Edit Relationship"
        description="Modify the relationship details"
      >
        {editingRel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={editingRel.from}
                onChange={(e) => updateRelationship(editingId!, { from: e.target.value })}
                placeholder="From entity..."
              />
              <Input
                value={editingRel.to}
                onChange={(e) => updateRelationship(editingId!, { to: e.target.value })}
                placeholder="To entity..."
              />
            </div>
            <Select
              value={editingRel.type}
              onValueChange={(value: any) => updateRelationship(editingId!, { type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ally">Ally</SelectItem>
                <SelectItem value="rival">Rival</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="enemy">Enemy</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="romantic">Romantic</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={editingRel.strength}
              onChange={(e) => updateRelationship(editingId!, { strength: Number.parseInt(e.target.value) })}
            />
            <Input
              value={editingRel.description}
              onChange={(e) => updateRelationship(editingId!, { description: e.target.value })}
            />
            <Button onClick={handleSaveEdit} className="w-full">
              Save Changes
            </Button>
          </div>
        )}
      </EditDialog>

      <Card className="p-6 border-border bg-card">
        <h4 className="font-semibold mb-3">Relationship Types</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["ally", "rival", "neutral", "enemy", "family", "romantic", "mentor"].map((type) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getRelationshipColor(type as any).replace("text-", "bg-")}`} />
              <span className="text-sm capitalize">{type}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
