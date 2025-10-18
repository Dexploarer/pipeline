"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileCode, Copy, Play } from "lucide-react"
import { NPC_TEMPLATES } from "@/lib/script-templates"

export function ScriptLibrary() {
  const templates = Object.entries(NPC_TEMPLATES)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map(([key, template]) => (
        <Card key={key} className="p-6 border-border bg-card hover:border-primary transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCode className="h-6 w-6 text-primary" />
            </div>
            <Badge variant="outline" className="border-border text-muted-foreground">
              {template.personality?.archetype}
            </Badge>
          </div>

          <h3 className="text-lg font-semibold mb-2 text-foreground">{template.personality?.name}</h3>

          <p className="text-sm text-muted-foreground mb-4">{template.personality?.traits.join(", ")}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {template.personality?.goals.slice(0, 2).map((goal, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs bg-secondary text-foreground">
                {goal}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 border-border text-foreground bg-transparent">
              <Copy className="h-3 w-3 mr-1" />
              Clone
            </Button>
            <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Play className="h-3 w-3 mr-1" />
              Test
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
