"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GitBranch, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function QuestFlowVisualizer() {
  const questFlow = {
    title: "The Dragon's Pact",
    nodes: [
      { id: "start", type: "start", label: "Quest Start", status: "complete" },
      { id: "obj1", type: "objective", label: "Find Dragon's Lair", status: "complete" },
      { id: "obj2", type: "objective", label: "Negotiate with Elder", status: "active" },
      { id: "branch1", type: "branch", label: "Player Choice", status: "pending" },
      { id: "outcome1", type: "outcome", label: "Alliance Formed", status: "pending" },
      { id: "outcome2", type: "outcome", label: "War Declared", status: "pending" },
    ],
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "active":
        return <Circle className="h-4 w-4 text-blue-500 fill-blue-500" />
      case "pending":
        return <Circle className="h-4 w-4 text-gray-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const handleEditFlow = () => {
    toast({
      title: "Flow Editor",
      description: "Opening visual quest flow editor...",
    })
  }

  return (
    <Card className="p-6 border-border bg-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Quest Flow</h3>
        </div>
        <Badge variant="secondary">{questFlow.title}</Badge>
      </div>

      <div className="space-y-4">
        {questFlow.nodes.map((node, idx) => (
          <div key={node.id} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              {getStatusIcon(node.status)}
              {idx < questFlow.nodes.length - 1 && <div className="w-px h-12 bg-border mt-2" />}
            </div>

            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{node.label}</span>
                <Badge variant="outline" className="text-xs">
                  {node.type}
                </Badge>
              </div>

              {node.type === "branch" && (
                <div className="mt-2 ml-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Success Path</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Failure Path</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="outline" className="w-full bg-transparent" onClick={handleEditFlow}>
          Edit Flow
        </Button>
      </div>
    </Card>
  )
}
