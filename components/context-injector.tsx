"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Database, Plus, Search, Sparkles } from "lucide-react"
import { useLoreStore } from "@/lib/stores/lore-store"
import { useNPCStore } from "@/lib/stores/npc-store"
import { useWorldStore } from "@/lib/stores/world-store"

export function ContextInjector() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContext, setSelectedContext] = useState<string[]>([])

  // Get data from stores
  const loreEntries = useLoreStore((state) => state.loreEntries)
  const npcs = useNPCStore((state) => state.npcs)
  const zones = useWorldStore((state) => state.zones)

  // Build contextSources from store data
  const contextSources = [
    ...loreEntries.map((entry) => ({
      id: entry.id,
      type: "lore" as const,
      name: entry.title,
      tags: entry.tags.length > 0 ? entry.tags : ["uncategorized"],
    })),
    ...npcs.map((npc) => ({
      id: npc.id,
      type: "npc" as const,
      name: npc.personality?.name ?? "Unknown NPC",
      tags: npc.metadata?.tags?.length > 0 ? npc.metadata.tags : ["uncategorized"],
    })),
    ...zones.map((zone) => ({
      id: zone.id,
      type: "location" as const,
      name: zone.name,
      tags: zone.factions.length > 0 ? zone.factions : ["uncategorized"],
    })),
  ]

  const filteredSources = contextSources.filter(
    (source) =>
      source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <Card className="p-6 border-border bg-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Context Injection</h3>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Inject lore, history, and world context into your quest generation
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search context sources..."
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredSources.map((source) => (
            <div
              key={source.id}
              className="p-3 rounded-lg border border-border bg-background hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => {
                setSelectedContext((prev) =>
                  prev.includes(source.id) ? prev.filter((id) => id !== source.id) : [...prev, source.id],
                )
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{source.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {source.type}
                    </Badge>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {source.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                {selectedContext.includes(source.id) && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs">✓</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedContext.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{selectedContext.length} sources selected</span>
              <Button size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Inject Context
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
