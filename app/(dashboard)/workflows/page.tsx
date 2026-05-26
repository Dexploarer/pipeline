"use client"

import Link from "next/link"
import { Workflow, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function WorkflowsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Visual Workflow Builder</h2>
        <p className="text-base text-muted-foreground">
          Create durable workflows with React Flow, combine AI generation, voice synthesis, and game integration
        </p>
      </div>
      <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-lg border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" />
            Workflow Studio
          </CardTitle>
          <CardDescription>
            Design visual workflows with custom nodes for AI generation, voice configuration, and multi-format export.
            Powered by React Flow, Workflow DevKit (durable execution), and ElevenLabs API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-semibold mb-2">Visual Node Editor</h4>
              <p className="text-sm text-muted-foreground">Drag-and-drop workflow building with custom node types</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-semibold mb-2">Durable Execution</h4>
              <p className="text-sm text-muted-foreground">State persistence and resume capability for long workflows</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-semibold mb-2">Multi-format Export</h4>
              <p className="text-sm text-muted-foreground">Export to Unity, Unreal, Godot, or ElizaOS</p>
            </div>
          </div>
          <Link href="/workflow-studio">
            <Button className="w-full" size="lg">
              Open Workflow Studio <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
