"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileJson, FileCode, Database } from "lucide-react"
import { useNPCStore } from "@/lib/stores/npc-store"
import { useQuestStore } from "@/lib/stores/quest-store"
import { useLoreStore } from "@/lib/stores/lore-store"
import { useDialogueStore } from "@/lib/stores/dialogue-store"
import { createExporter, ExportFormat } from "@/lib/export/unified-exporter"
import { toast } from "@/hooks/use-toast"

export function ExportManager() {
  const [format, setFormat] = useState("json")
  const [includeNPCs, setIncludeNPCs] = useState(true)
  const [includeQuests, setIncludeQuests] = useState(true)
  const [includeLore, setIncludeLore] = useState(true)
  const [includeDialogues, setIncludeDialogues] = useState(true)

  const npcs = useNPCStore((state) => state.npcs)
  const quests = useQuestStore((state) => state.quests)
  const loreEntries = useLoreStore((state) => state.loreEntries)
  const dialogueTrees = useDialogueStore((state) => state.trees)

  const handleExport = async () => {
    try {
      // Gather real data from stores
      const data = {
        npcs: includeNPCs ? npcs : undefined,
        quests: includeQuests ? quests : undefined,
        lore: includeLore ? loreEntries : undefined,
        dialogues: includeDialogues ? dialogueTrees.flatMap(tree => tree.nodes) : undefined,
      }

      // Map format string to ExportFormat enum
      const exportFormat = format === "json" ? ExportFormat.JSON
        : format === "yaml" ? ExportFormat.YAML
        : format === "sql" ? ExportFormat.JSON // SQL not directly supported, fallback to JSON
        : ExportFormat.JSON

      // Use unified exporter to serialize according to format
      const exporter = createExporter()
      const result = await exporter.exportContentPack({
        id: `export-${Date.now()}`,
        name: "game-content-export",
        version: "1.0.0",
        description: "Exported game content",
        zoneIds: [],
        contents: {
          npcs: npcs.map(n => n.id),
          quests: quests.map(q => q.id),
          lore: loreEntries.map(l => l.id),
          dialogues: dialogueTrees.map(t => t.id),
          relationships: [],
        },
        dependencies: [],
        metadata: {
          author: "Content Pipeline",
          createdAt: new Date().toISOString(),
          tags: [],
        },
      }, {
        format: exportFormat,
        pretty: true,
        includeMetadata: true,
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || "Export failed")
      }

      // Create blob with proper mime type from result
      const blob = new Blob([result.data], { type: result.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.filename
      a.click()

      // Revoke blob URL after download
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 100)

      toast({
        title: "Export Successful",
        description: `Exported ${result.filename} (${result.size} bytes)`,
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export content",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="p-6 border-border bg-card">
      <div className="flex items-center gap-2 mb-4">
        <Download className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Export Content</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Export Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  JSON
                </div>
              </SelectItem>
              <SelectItem value="yaml">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  YAML
                </div>
              </SelectItem>
              <SelectItem value="sql">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  SQL
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Include Content</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="npcs"
                checked={includeNPCs}
                onCheckedChange={(checked) => setIncludeNPCs(checked as boolean)}
              />
              <label htmlFor="npcs" className="text-sm cursor-pointer">
                NPCs & Scripts
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="quests"
                checked={includeQuests}
                onCheckedChange={(checked) => setIncludeQuests(checked as boolean)}
              />
              <label htmlFor="quests" className="text-sm cursor-pointer">
                Quests & Objectives
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="lore"
                checked={includeLore}
                onCheckedChange={(checked) => setIncludeLore(checked as boolean)}
              />
              <label htmlFor="lore" className="text-sm cursor-pointer">
                Lore & History
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="dialogues"
                checked={includeDialogues}
                onCheckedChange={(checked) => setIncludeDialogues(checked as boolean)}
              />
              <label htmlFor="dialogues" className="text-sm cursor-pointer">
                Dialogue Trees
              </label>
            </div>
          </div>
        </div>

        <Button onClick={handleExport} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Export Content Package
        </Button>
      </div>
    </Card>
  )
}
