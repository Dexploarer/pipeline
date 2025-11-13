import type { Node, Edge } from '@xyflow/react'

/**
 * Workflow execution context passed between nodes
 */
export interface WorkflowContext {
  /** Unique workflow execution ID */
  executionId: string
  /** Input data from the trigger */
  input: Record<string, unknown>
  /** Accumulated results from previous nodes */
  results: Record<string, unknown>
  /** Metadata about the execution */
  metadata: {
    startedAt: Date
    lastUpdatedAt: Date
    currentNodeId?: string
  }
}

/**
 * Workflow node execution result
 */
export interface NodeExecutionResult {
  success: boolean
  data?: unknown
  error?: string
  duration: number
  nodeId: string
}

/**
 * Workflow definition that can be saved and executed
 */
export interface WorkflowDefinition {
  id: string
  name: string
  description?: string
  version: string
  nodes: Node[]
  edges: Edge[]
  createdAt: Date
  updatedAt: Date
}

/**
 * ElevenLabs voice configuration
 */
export interface VoiceConfig {
  voiceId?: string
  stability?: number
  similarityBoost?: number
  style?: number
  useSpeakerBoost?: boolean
  model?: string
}

/**
 * AI generation configuration
 */
export interface AIGenerationConfig {
  model: string
  prompt: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

/**
 * Export configuration
 */
export interface ExportConfig {
  formats: Array<'unity' | 'unreal' | 'godot' | 'elizaos' | 'json'>
  includeVoice?: boolean
  includeAssets?: boolean
  outputPath?: string
}

/**
 * Workflow execution status
 */
export type WorkflowExecutionStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

/**
 * Workflow execution state (persisted by Workflow DevKit)
 */
export interface WorkflowExecutionState {
  executionId: string
  workflowId: string
  status: WorkflowExecutionStatus
  context: WorkflowContext
  currentNodeId?: string
  completedNodes: string[]
  failedNodes: string[]
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  error?: string
}
