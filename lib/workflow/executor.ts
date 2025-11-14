import type { Node, Edge } from '@xyflow/react'
import type {
  WorkflowContext,
  NodeExecutionResult,
  WorkflowExecutionState,
  AIGenerationConfig,
  VoiceConfig,
  ExportConfig,
} from './types'

/**
 * Workflow executor that orchestrates node execution
 * This is the bridge between React Flow visualization and Workflow DevKit execution
 */
export class WorkflowExecutor {
  /**
   * Execute a workflow defined by nodes and edges
   */
  async execute(
    nodes: Node[],
    edges: Edge[],
    input: Record<string, unknown>
  ): Promise<WorkflowExecutionState> {
    const executionId = this.generateExecutionId()
    const context: WorkflowContext = {
      executionId,
      input,
      results: {},
      metadata: {
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
      },
    }

    const state: WorkflowExecutionState = {
      executionId,
      workflowId: 'workflow-' + Date.now(),
      status: 'running',
      context,
      completedNodes: [],
      failedNodes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    try {
      // Find the trigger node (entry point)
      const triggerNode = nodes.find((node) => node.type === 'trigger')
      if (!triggerNode) {
        throw new Error('Workflow must have a trigger node')
      }

      // Execute nodes in topological order
      await this.executeNodeChain(triggerNode, nodes, edges, context, state)

      state.status = 'completed'
      state.completedAt = new Date()
    } catch (error) {
      state.status = 'failed'
      state.error = error instanceof Error ? error.message : 'Unknown error'
      state.completedAt = new Date()
    }

    state.updatedAt = new Date()
    return state
  }

  /**
   * Execute a chain of nodes starting from a given node
   */
  private async executeNodeChain(
    currentNode: Node,
    allNodes: Node[],
    edges: Edge[],
    context: WorkflowContext,
    state: WorkflowExecutionState
  ): Promise<void> {
    // Skip if already executed
    if (state.completedNodes.includes(currentNode.id)) {
      return
    }

    context.metadata.currentNodeId = currentNode.id
    context.metadata.lastUpdatedAt = new Date()

    try {
      // Execute the current node
      const result = await this.executeNode(currentNode, context)

      if (result.success) {
        state.completedNodes.push(currentNode.id)
        context.results[currentNode.id] = result.data
      } else {
        state.failedNodes.push(currentNode.id)
        throw new Error(`Node ${currentNode.id} failed: ${result.error}`)
      }

      // Find and execute child nodes
      const outgoingEdges = edges.filter((edge) => edge.source === currentNode.id)
      for (const edge of outgoingEdges) {
        const nextNode = allNodes.find((node) => node.id === edge.target)
        if (nextNode) {
          await this.executeNodeChain(nextNode, allNodes, edges, context, state)
        }
      }
    } catch (error) {
      state.failedNodes.push(currentNode.id)
      throw error
    }
  }

  /**
   * Execute a single node based on its type
   */
  private async executeNode(
    node: Node,
    context: WorkflowContext
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()

    try {
      let data: unknown

      switch (node.type) {
        case 'trigger':
          data = await this.executeTriggerNode(node, context)
          break
        case 'aiGeneration':
          data = await this.executeAIGenerationNode(node, context)
          break
        case 'voiceConfig':
          data = await this.executeVoiceConfigNode(node, context)
          break
        case 'export':
          data = await this.executeExportNode(node, context)
          break
        case 'conditional':
          data = await this.executeConditionalNode(node, context)
          break
        default:
          throw new Error(`Unknown node type: ${node.type}`)
      }

      return {
        success: true,
        data,
        duration: Date.now() - startTime,
        nodeId: node.id,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        nodeId: node.id,
      }
    }
  }

  private async executeTriggerNode(node: Node, context: WorkflowContext): Promise<unknown> {
    // Trigger node just passes through the input
    return context.input
  }

  private async executeAIGenerationNode(node: Node, context: WorkflowContext): Promise<unknown> {
    const config = node.data as AIGenerationConfig

    // Call the AI generation API
    const response = await fetch('/api/workflow/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt: config.prompt,
        temperature: config.temperature,
        systemPrompt: config.systemPrompt,
        context: context.results,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.statusText}`)
    }

    return response.json()
  }

  private async executeVoiceConfigNode(node: Node, context: WorkflowContext): Promise<unknown> {
    const config = node.data as VoiceConfig

    // Call the voice configuration API
    const response = await fetch('/api/workflow/voice-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voiceConfig: config,
        npcData: context.results,
      }),
    })

    if (!response.ok) {
      throw new Error(`Voice configuration failed: ${response.statusText}`)
    }

    return response.json()
  }

  private async executeExportNode(node: Node, context: WorkflowContext): Promise<unknown> {
    const config = node.data as ExportConfig

    // Call the export API
    const response = await fetch('/api/workflow/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exportConfig: config,
        workflowResults: context.results,
      }),
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    return response.json()
  }

  private async executeConditionalNode(node: Node, context: WorkflowContext): Promise<unknown> {
    const { condition, operator } = node.data

    // Evaluate the condition based on previous results
    // This is a simplified implementation
    return {
      conditionMet: true,
      operator,
      condition,
    }
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}
