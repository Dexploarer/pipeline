'use client'

import React, { useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Save, Play, Download, Trash2 } from 'lucide-react'

// Import custom node components
import { AIGenerationNode } from './workflow-nodes/ai-generation-node'
import { VoiceConfigNode } from './workflow-nodes/voice-config-node'
import { ExportNode } from './workflow-nodes/export-node'
import { TriggerNode } from './workflow-nodes/trigger-node'
import { ConditionalNode } from './workflow-nodes/conditional-node'

const nodeTypes: NodeTypes = {
  aiGeneration: AIGenerationNode,
  voiceConfig: VoiceConfigNode,
  export: ExportNode,
  trigger: TriggerNode,
  conditional: ConditionalNode,
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: { label: 'Start: NPC Generation Request' },
  },
  {
    id: '2',
    type: 'aiGeneration',
    position: { x: 200, y: 200 },
    data: {
      label: 'Generate NPC Personality',
      model: 'claude-sonnet-4-5',
      prompt: 'Create a detailed NPC personality',
    },
  },
  {
    id: '3',
    type: 'voiceConfig',
    position: { x: 200, y: 350 },
    data: {
      label: 'Configure Voice Profile',
      voiceId: '',
      stability: 0.5,
      similarityBoost: 0.75,
    },
  },
  {
    id: '4',
    type: 'export',
    position: { x: 200, y: 500 },
    data: {
      label: 'Export NPC Package',
      formats: ['unity', 'elizaos'],
    },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
]

interface WorkflowBuilderProps {
  onSave?: (nodes: Node[], edges: Edge[]) => void
  onExecute?: (nodes: Node[], edges: Edge[]) => Promise<void>
  className?: string
}

export function WorkflowBuilder({ onSave, onExecute, className }: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [isExecuting, setIsExecuting] = useState(false)

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds))
    },
    [setEdges]
  )

  const handleSave = useCallback(() => {
    onSave?.(nodes, edges)
  }, [nodes, edges, onSave])

  const handleExecute = useCallback(async () => {
    if (!onExecute) return

    setIsExecuting(true)
    try {
      await onExecute(nodes, edges)
    } finally {
      setIsExecuting(false)
    }
  }, [nodes, edges, onExecute])

  const handleClear = useCallback(() => {
    setNodes([])
    setEdges([])
  }, [setNodes, setEdges])

  const handleExportJSON = useCallback(() => {
    const workflow = {
      nodes,
      edges,
      version: '1.0',
      createdAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [nodes, edges])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Visual Workflow Builder</span>
          <div className="flex gap-2">
            <Badge variant="outline">React Flow</Badge>
            <Badge variant="outline">Workflow DevKit</Badge>
            <Badge variant="outline">ElevenLabs</Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Design custom NPC generation pipelines with AI and voice integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: '600px', width: '100%' }} className="border rounded-lg overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-right" className="bg-background/95 backdrop-blur p-2 rounded-lg border shadow-lg">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  variant="outline"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecute}
                  disabled={isExecuting || !onExecute}
                  variant="default"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isExecuting ? 'Executing...' : 'Execute'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportJSON}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  size="sm"
                  onClick={handleClear}
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        <div className="mt-4 p-4 border rounded-lg bg-muted/50">
          <h4 className="text-sm font-semibold mb-2">Workflow Stats</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Nodes:</span>
              <span className="ml-2 font-medium">{nodes.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Connections:</span>
              <span className="ml-2 font-medium">{edges.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2 font-medium">{isExecuting ? 'Running' : 'Ready'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
