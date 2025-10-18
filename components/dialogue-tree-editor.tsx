"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Plus, Sparkles, Trash2 } from "lucide-react"
import type { DialogueNode } from "@/lib/npc-types"
import { useDialogueStore } from "@/lib/stores/dialogue-store"

export function DialogueTreeEditor() {
  const { trees, addTree, updateTree: _updateTree, addNodeToTree, updateNodeInTree, deleteNodeFromTree } = useDialogueStore()
  const [currentTreeId, setCurrentTreeId] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string>("start")
  const [generating, setGenerating] = useState(false)

  if (trees.length === 0 && !currentTreeId) {
    const defaultTree = {
      id: "default",
      name: "Default Dialogue",
      nodes: [
        {
          id: "start",
          text: "Greetings, traveler. What brings you to my shop?",
          responses: [
            { text: "I'm looking for supplies", nextNodeId: "supplies", effects: [] },
            { text: "Just browsing", nextNodeId: "browse", effects: [] },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
    }
    addTree(defaultTree)
    setCurrentTreeId("default")
  }

  const currentTree = trees.find((t) => t.id === currentTreeId) || trees[0]
  const nodes = currentTree?.nodes || []

  // Early return if no tree is available
  if (!currentTree) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No dialogue tree found. Create one to get started.
      </div>
    )
  }

  const generateDialogue = async (): Promise<void> => {
    if (!currentTree) return

    setGenerating(true)
    try {
      const response = await fetch("/api/generate-dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "merchant shop interaction",
          existingNodes: nodes,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        data.nodes.forEach((node: DialogueNode) => {
          addNodeToTree(currentTree.id, node)
        })
      }
    } catch (error) {
      console.error("Failed to generate dialogue:", error)
    } finally {
      setGenerating(false)
    }
  }

  const handleAddNode = (): void => {
    if (!currentTree) return

    const newNode: DialogueNode = {
      id: `node_${Date.now()}`,
      text: "New dialogue node",
      responses: [],
    }
    addNodeToTree(currentTree.id, newNode)
    setSelectedNode(newNode.id)
  }

  const handleDeleteNode = (nodeId: string): void => {
    if (!currentTree) return

    deleteNodeFromTree(currentTree.id, nodeId)
    if (selectedNode === nodeId) {
      setSelectedNode(nodes[0]?.id ?? "start")
    }
  }

  const handleAddResponse = (): void => {
    if (!currentTree) return

    const node = nodes.find((n) => n.id === selectedNode)
    if (node !== undefined) {
      const updatedNode = {
        ...node,
        responses: [...node.responses, { text: "New response", nextNodeId: "", effects: [] }],
      }
      updateNodeInTree(currentTree.id, selectedNode, updatedNode)
    }
  }

  const handleDeleteResponse = (responseIdx: number): void => {
    if (!currentTree) return

    const node = nodes.find((n) => n.id === selectedNode)
    if (node !== undefined) {
      const updatedNode = {
        ...node,
        responses: node.responses.filter((_, idx) => idx !== responseIdx),
      }
      updateNodeInTree(currentTree.id, selectedNode, updatedNode)
    }
  }

  const updateNode = (nodeId: string, text: string): void => {
    if (!currentTree) return
    updateNodeInTree(currentTree.id, nodeId, { text })
  }

  const updateResponse = (nodeId: string, responseIdx: number, field: "text" | "nextNodeId", value: string): void => {
    if (!currentTree) return

    const node = nodes.find((n) => n.id === nodeId)
    if (node !== undefined) {
      const updatedResponses = node.responses.map((r, idx) => (idx === responseIdx ? { ...r, [field]: value } : r))
      updateNodeInTree(currentTree.id, nodeId, { responses: updatedResponses })
    }
  }

  const currentNode = nodes.find((n) => n.id === selectedNode)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Dialogue Tree</h3>
          </div>
          <Button size="sm" onClick={generateDialogue} disabled={generating}>
            <Sparkles className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : "AI Expand"}
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedNode === node.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:bg-accent/50"
              }`}
              onClick={() => setSelectedNode(node.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  {node.id}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteNode(node.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm line-clamp-2">{node.text}</p>
              <div className="mt-2 text-xs text-muted-foreground">{node.responses.length} responses</div>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={handleAddNode}>
          <Plus className="h-4 w-4 mr-2" />
          Add Node
        </Button>
      </Card>

      <Card className="p-6 border-border bg-card">
        <h3 className="text-lg font-semibold mb-4">Edit Node</h3>

        {currentNode ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Node ID</label>
              <Input value={currentNode.id} disabled />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Dialogue Text</label>
              <Textarea
                value={currentNode.text}
                onChange={(e) => updateNode(currentNode.id, e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Responses</label>
              <div className="space-y-2">
                {currentNode.responses.map((response, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border bg-background">
                    <Input
                      value={response.text}
                      onChange={(e) => updateResponse(currentNode.id, idx, "text", e.target.value)}
                      placeholder="Response text..."
                      className="mb-2"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        value={response.nextNodeId}
                        onChange={(e) => updateResponse(currentNode.id, idx, "nextNodeId", e.target.value)}
                        placeholder="Next node ID..."
                        className="flex-1"
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteResponse(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent" onClick={handleAddResponse}>
                <Plus className="h-4 w-4 mr-2" />
                Add Response
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a node to edit</p>
        )}
      </Card>
    </div>
  )
}
