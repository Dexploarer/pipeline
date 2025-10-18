"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Sparkles, Link2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useLoreStore } from "@/lib/stores/lore-store"
import { CrudActions } from "./shared/crud-actions"
import { EditDialog } from "./shared/edit-dialog"

export function LoreManager() {
  const { loreEntries: entries, addEntry, updateEntry, deleteEntry } = useLoreStore()
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    category: "history",
    tags: [] as string[],
  })

  const generateLore = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/generate-lore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newEntry.title,
          category: newEntry.category,
          existingLore: entries,
        }),
      })

      if (!response.ok) {
        // Read error message from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message
          }
        } catch {
          // If JSON parsing fails, try text
          try {
            const errorText = await response.text()
            if (errorText) {
              errorMessage = errorText
            }
          } catch {
            // Keep default error message
          }
        }

        toast({
          title: "Failed to generate lore",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      const entry = {
        id: crypto.randomUUID(),
        title: newEntry.title || "Untitled",
        content: data.content,
        category: newEntry.category,
        tags: data.tags || [],
        relatedEntries: [],
        createdAt: new Date().toISOString(),
      }
      addEntry(entry)
      setNewEntry({ title: "", content: "", category: "history", tags: [] })
      toast({ title: "Lore Generated", description: `"${entry.title}" has been created` })
    } catch (error) {
      console.error("Failed to generate lore:", error)
      toast({
        title: "Failed to generate lore",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleAddManually = () => {
    if (!newEntry.title || !newEntry.content) {
      toast({ title: "Error", description: "Please fill in title and content", variant: "destructive" })
      return
    }

    const entry = {
      id: crypto.randomUUID(),
      title: newEntry.title,
      content: newEntry.content,
      category: newEntry.category,
      tags: newEntry.tags,
      relatedEntries: [],
      createdAt: new Date().toISOString(),
    }

    addEntry(entry)
    setNewEntry({ title: "", content: "", category: "history", tags: [] })
    toast({ title: "Lore Entry Added", description: `"${entry.title}" has been added` })
  }

  const handleEdit = (id: string): void => {
    setEditingId(id)
  }

  const handleSaveEdit = (): void => {
    const entry = entries.find((e) => e.id === editingId)
    if (entry !== undefined && editingId !== null) {
      updateEntry(editingId, entry)
      setEditingId(null)
      toast({ title: "Lore Updated", description: "Changes have been saved" })
    }
  }

  const handleDuplicate = (id: string): void => {
    const entry = entries.find((e) => e.id === id)
    if (entry !== undefined) {
      const duplicate = {
        ...entry,
        id: crypto.randomUUID(),
        title: `${entry.title} (Copy)`,
        createdAt: new Date().toISOString(),
      }
      addEntry(duplicate)
      toast({ title: "Lore Duplicated", description: `Created copy of "${entry.title}"` })
    }
  }

  const handleDelete = (id: string): void => {
    const entry = entries.find((e) => e.id === id)
    deleteEntry(id)
    toast({ title: "Lore Entry Deleted", description: `"${entry?.title ?? "Entry"}" has been removed` })
  }

  const editingEntry = entries.find((e) => e.id === editingId)

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Create Lore Entry</h3>
        </div>

        <div className="space-y-4">
          <Input
            value={newEntry.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, title: e.target.value })}
            placeholder="Lore title or topic..."
          />

          <select
            className="w-full p-2 rounded-md border border-border bg-background"
            value={newEntry.category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewEntry({ ...newEntry, category: e.target.value })}
          >
            <option value="history">History</option>
            <option value="faction">Faction</option>
            <option value="character">Character</option>
            <option value="location">Location</option>
            <option value="artifact">Artifact</option>
            <option value="event">Event</option>
          </select>

          <Textarea
            value={newEntry.content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewEntry({ ...newEntry, content: e.target.value })}
            placeholder="Write lore content or let AI generate it..."
            rows={4}
          />

          <div className="flex gap-2">
            <Button onClick={generateLore} disabled={generating || !newEntry.title} className="flex-1">
              <Sparkles className="h-4 w-4 mr-2" />
              {generating ? "Generating..." : "AI Generate"}
            </Button>
            <Button variant="outline" onClick={handleAddManually} disabled={!newEntry.content || !newEntry.title}>
              <Plus className="h-4 w-4 mr-2" />
              Add Manually
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map((entry) => (
          <Card key={entry.id} className="p-4 border-border bg-card hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-foreground mb-1">{entry.title}</h4>
                <Badge variant="secondary" className="text-xs">
                  {entry.category}
                </Badge>
              </div>
              <CrudActions
                onEdit={() => handleEdit(entry.id)}
                onDuplicate={() => handleDuplicate(entry.id)}
                onDelete={() => handleDelete(entry.id)}
              />
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{entry.content}</p>

            <div className="flex flex-wrap gap-1 mb-3">
              {entry.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {entry.relatedEntries.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Link2 className="h-3 w-3" />
                <span>{entry.relatedEntries.length} connections</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      <EditDialog
        open={!!editingId}
        onOpenChange={(open) => !open && setEditingId(null)}
        title="Edit Lore Entry"
        description="Make changes to your lore entry"
      >
        {editingEntry && (
          <div className="space-y-4">
            <Input
              value={editingEntry.title}
              onChange={(e) => updateEntry(editingId!, { title: e.target.value })}
              placeholder="Title..."
            />
            <select
              className="w-full p-2 rounded-md border border-border bg-background"
              value={editingEntry.category}
              onChange={(e) => updateEntry(editingId!, { category: e.target.value })}
            >
              <option value="history">History</option>
              <option value="faction">Faction</option>
              <option value="character">Character</option>
              <option value="location">Location</option>
              <option value="artifact">Artifact</option>
              <option value="event">Event</option>
            </select>
            <Textarea
              value={editingEntry.content}
              onChange={(e) => updateEntry(editingId!, { content: e.target.value })}
              rows={6}
            />
            <Button onClick={handleSaveEdit} className="w-full">
              Save Changes
            </Button>
          </div>
        )}
      </EditDialog>
    </div>
  )
}
