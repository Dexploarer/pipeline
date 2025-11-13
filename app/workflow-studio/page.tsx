'use client'

import { useState } from 'react'
import { WorkflowBuilder } from '@/components/workflow-builder'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sparkles, Workflow, Mic2, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { Node, Edge } from '@xyflow/react'

interface ExecutionResult {
  success: boolean
  executionId?: string
  status?: string
  results?: Record<string, unknown>
  error?: string
  duration?: number
}

export default function WorkflowStudioPage() {
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const handleSaveWorkflow = (nodes: Node[], edges: Edge[]) => {
    console.log('Saving workflow...', { nodes, edges })
    // In production, save to database
    alert('Workflow saved successfully!')
  }

  const handleExecuteWorkflow = async (nodes: Node[], edges: Edge[]) => {
    setIsExecuting(true)
    setExecutionResult(null)

    try {
      const response = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes,
          edges,
          input: {
            prompt: 'Create a mysterious tavern keeper NPC',
            archetype: 'merchant',
          },
        }),
      })

      const result = await response.json()
      setExecutionResult(result)
    } catch (error) {
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Workflow Studio</h1>
            <p className="text-muted-foreground mt-2">
              Visual workflow builder powered by React Flow, Workflow DevKit, and ElevenLabs
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm">
              <Workflow className="w-3 h-3 mr-1" />
              React Flow
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Workflow DevKit
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Mic2 className="w-3 h-3 mr-1" />
              ElevenLabs
            </Badge>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Workflow className="w-5 h-5 text-blue-500" />
              Visual Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Drag-and-drop interface for designing custom NPC generation pipelines with React Flow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Durable Execution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Workflows that can pause, resume, and survive deployments with Workflow DevKit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mic2 className="w-5 h-5 text-green-500" />
              Voice Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add voice personalities and conversational AI to NPCs with ElevenLabs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
          <TabsTrigger value="examples">Example Workflows</TabsTrigger>
          <TabsTrigger value="results">Execution Results</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <WorkflowBuilder
            onSave={handleSaveWorkflow}
            onExecute={handleExecuteWorkflow}
          />

          {/* Execution Status */}
          {isExecuting && (
            <Alert>
              <Loader2 className="w-4 h-4 animate-spin" />
              <AlertTitle>Executing Workflow</AlertTitle>
              <AlertDescription>
                Your workflow is being executed. This may take a few moments...
              </AlertDescription>
            </Alert>
          )}

          {executionResult && (
            <Alert variant={executionResult.success ? 'default' : 'destructive'}>
              {executionResult.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <AlertTitle>
                {executionResult.success ? 'Workflow Completed' : 'Workflow Failed'}
              </AlertTitle>
              <AlertDescription>
                {executionResult.success ? (
                  <div className="space-y-2">
                    <p>Execution ID: {executionResult.executionId}</p>
                    <p>Duration: {executionResult.duration}ms</p>
                    <p>Status: {executionResult.status}</p>
                  </div>
                ) : (
                  <p>Error: {executionResult.error}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic NPC Generation</CardTitle>
                <CardDescription>
                  Simple workflow with AI generation, voice config, and export
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">1</Badge>
                    <span>Trigger: Manual start</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">2</Badge>
                    <span>AI Generation: Create personality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">3</Badge>
                    <span>Voice Config: Add ElevenLabs voice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">4</Badge>
                    <span>Export: Unity + ElizaOS formats</span>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Load Example
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Batch NPC Generation</CardTitle>
                <CardDescription>
                  Generate multiple NPCs with relationships and lore
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">1</Badge>
                    <span>Trigger: Batch input (CSV)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">2</Badge>
                    <span>Loop: Process each NPC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">3</Badge>
                    <span>AI Generation: Multi-stage pipeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">4</Badge>
                    <span>Voice Config: Unique voices</span>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Load Example
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conditional Branching</CardTitle>
                <CardDescription>
                  Dynamic workflow with conditional paths
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">1</Badge>
                    <span>AI Generation: Generate NPC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">2</Badge>
                    <span>Conditional: Check archetype</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">3a</Badge>
                    <span>If Merchant: Add trade items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">3b</Badge>
                    <span>If Warrior: Add combat stats</span>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Load Example
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Voice-First NPC</CardTitle>
                <CardDescription>
                  Create conversational AI agents with ElevenLabs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">1</Badge>
                    <span>AI Generation: Create character</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">2</Badge>
                    <span>Voice Selection: Pick from library</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">3</Badge>
                    <span>Agent Creation: ElevenLabs agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">4</Badge>
                    <span>Test: Voice conversation preview</span>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Load Example
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Results</CardTitle>
              <CardDescription>
                View the output of your workflow executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {executionResult ? (
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No execution results yet. Run a workflow to see results here.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation & Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start" asChild>
              <a href="https://reactflow.dev/learn" target="_blank" rel="noopener noreferrer">
                <Workflow className="w-4 h-4 mr-2" />
                React Flow Docs
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="https://useworkflow.dev" target="_blank" rel="noopener noreferrer">
                <Sparkles className="w-4 h-4 mr-2" />
                Workflow DevKit Docs
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="https://elevenlabs.io/docs/api-reference/agents" target="_blank" rel="noopener noreferrer">
                <Mic2 className="w-4 h-4 mr-2" />
                ElevenLabs API Docs
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
