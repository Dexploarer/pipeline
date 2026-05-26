import type { Node, Edge } from '@xyflow/react'
import type {
  WorkflowContext,
  NodeExecutionResult,
  WorkflowExecutionState,
  AIGenerationConfig,
  VoiceConfig,
  ExportConfig,
} from './types'

function getApiBaseUrl(): string {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL']
  if (apiUrl) return apiUrl
  const vercelUrl = process.env['VERCEL_URL']
  if (vercelUrl) return `https://${vercelUrl}`
  return 'http://localhost:3000'
}

/**
 * Workflow executor that orchestrates node execution
 * This is the bridge between React Flow visualization and Workflow DevKit execution
 */
export class WorkflowExecutor {
  private authToken?: string

  /**
   * Execute a workflow defined by nodes and edges
   */
  async execute(
    nodes: Node[],
    edges: Edge[],
    input: Record<string, unknown>,
    authToken?: string
  ): Promise<WorkflowExecutionState> {
    this.authToken = authToken
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

        // Skip downstream nodes if condition not met
        const resultData = result.data as Record<string, unknown> | null
        if (resultData && 'conditionMet' in resultData && resultData['conditionMet'] === false) {
          return // Don't execute child nodes
        }
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

  private async executeTriggerNode(_node: Node, context: WorkflowContext): Promise<unknown> {
    // Trigger node just passes through the input
    return context.input
  }

  private async executeAIGenerationNode(node: Node, context: WorkflowContext): Promise<unknown> {
    const config = node.data as unknown as AIGenerationConfig

    // Call the AI generation API
    const response = await fetch(`${getApiBaseUrl()}/api/workflow/ai-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {}),
      },
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
    const response = await fetch(`${getApiBaseUrl()}/api/workflow/voice-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {}),
      },
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
    const config = node.data as unknown as ExportConfig

    // Call the export API
    const response = await fetch(`${getApiBaseUrl()}/api/workflow/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {}),
      },
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
    const { condition, operator } = node.data as { condition?: string; operator?: string }

    if (!condition) {
      return { conditionMet: true, operator, condition, evaluatedValue: undefined }
    }

    // Look up the condition value in context.results
    const evaluatedValue = context.results[condition]

    let conditionMet = false
    switch (operator) {
      case 'exists':
        conditionMet = evaluatedValue !== undefined && evaluatedValue !== null
        break
      case 'not_empty':
        conditionMet = evaluatedValue !== undefined && evaluatedValue !== null && evaluatedValue !== ''
        break
      case 'equals':
        conditionMet = evaluatedValue === true || evaluatedValue === 'true'
        break
      case 'greater_than':
        conditionMet = typeof evaluatedValue === 'number' && evaluatedValue > 0
        break
      default:
        // Default: check truthiness
        conditionMet = Boolean(evaluatedValue)
        break
    }

    return { conditionMet, operator, condition, evaluatedValue }
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}
