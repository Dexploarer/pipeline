import { createOpenAI } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import type { LanguageModel } from "ai"

export type NpcDialogue = "npc_dialogue";
export type QuestGeneration = "quest_generation";
export type LoreWriting = "lore_writing";
export type DialogueTree = "dialogue_tree";
export type BatchProcessing = "batch_processing";

export type TaskType =
  | NpcDialogue
  | QuestGeneration
  | LoreWriting
  | DialogueTree
  | BatchProcessing;

export type CostPriority = "cost";
export type QualityPriority = "quality";
export type SpeedPriority = "speed";

export type Priority = CostPriority | QualityPriority | SpeedPriority;

interface ModelConfig {
  cost: string
  quality: string
  speed: string
}

const MODEL_MATRIX: Record<TaskType, ModelConfig> = {
  npc_dialogue: {
    cost: "openai/gpt-4o-mini",
    quality: "anthropic/claude-sonnet-4",
    speed: "xai/grok-2-fast",
  },
  quest_generation: {
    cost: "openai/gpt-4o-mini",
    quality: "anthropic/claude-sonnet-4",
    speed: "openai/gpt-4o",
  },
  lore_writing: {
    cost: "openai/gpt-4o",
    quality: "anthropic/claude-opus-4",
    speed: "openai/gpt-4o",
  },
  dialogue_tree: {
    cost: "openai/gpt-4o-mini",
    quality: "anthropic/claude-sonnet-4",
    speed: "xai/grok-2-fast",
  },
  batch_processing: {
    cost: "xai/grok-2-fast",
    quality: "openai/gpt-4o",
    speed: "xai/grok-2-fast",
  },
}

// Lazy initialization to avoid build-time errors
let openrouterClient: ReturnType<typeof createOpenAI> | null = null
let openaiClient: ReturnType<typeof createOpenAI> | null = null

// Check which API provider is configured
function getConfiguredProvider(): "openrouter" | "openai" | "anthropic" | null {
  if (process.env["OPENROUTER_API_KEY"]) return "openrouter"
  if (process.env["OPENAI_API_KEY"]) return "openai"
  if (process.env["ANTHROPIC_API_KEY"]) return "anthropic"
  return null
}

function getOpenRouterClient(): ReturnType<typeof createOpenAI> {
  if (openrouterClient) {
    return openrouterClient
  }

  const OPENROUTER_API_KEY = process.env["OPENROUTER_API_KEY"]
  if (!OPENROUTER_API_KEY) {
    const errorMessage =
      "OPENROUTER_API_KEY environment variable is not set. " +
      "Please set it in your .env.local file or environment variables. " +
      "Get your API key from https://openrouter.ai/keys"
    console.error(errorMessage)
    throw new Error(errorMessage)
  }

  openrouterClient = createOpenAI({
    apiKey: OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  })

  return openrouterClient
}

function getOpenAIClient(): ReturnType<typeof createOpenAI> {
  if (openaiClient) {
    return openaiClient
  }

  const OPENAI_API_KEY = process.env["OPENAI_API_KEY"]
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set")
  }

  openaiClient = createOpenAI({
    apiKey: OPENAI_API_KEY,
  })

  return openaiClient
}

export function selectModel(task: TaskType, priority: Priority = "cost"): string {
  return MODEL_MATRIX[task]?.[priority] || "openai/gpt-4o-mini"
}

export function selectModelId(task: TaskType, priority: Priority = "cost"): string {
  return MODEL_MATRIX[task]?.[priority] || "openai/gpt-4o-mini"
}

export function getModelForTask(task: TaskType, customModel?: string, priority: Priority = "cost"): LanguageModel {
  // Select model ID
  const modelId = customModel ?? selectModel(task, priority)

  // Determine which provider to use
  const provider = getConfiguredProvider()

  if (!provider) {
    throw new Error(
      "No AI provider configured. Please set one of: OPENROUTER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY"
    )
  }

  // If using OpenRouter, use it for all models
  if (provider === "openrouter") {
    const openrouter = getOpenRouterClient()
    return openrouter(modelId)
  }

  // If using direct OpenAI and model is OpenAI, use direct client
  if (provider === "openai" && modelId.startsWith("openai/")) {
    const openai = getOpenAIClient()
    // Remove the "openai/" prefix for direct API
    const directModelId = modelId.replace("openai/", "")
    return openai(directModelId)
  }

  // If using Anthropic and model is Anthropic
  if (provider === "anthropic" && modelId.startsWith("anthropic/")) {
    const ANTHROPIC_API_KEY = process.env["ANTHROPIC_API_KEY"]
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set")
    }
    // Remove the "anthropic/" prefix
    const directModelId = modelId.replace("anthropic/", "")
    return anthropic(directModelId, { apiKey: ANTHROPIC_API_KEY })
  }

  // Fallback: if we have OpenAI key but model is not OpenAI, warn and use default
  if (provider === "openai") {
    console.warn(
      `Model ${modelId} requested but only OpenAI is configured. Falling back to gpt-4o-mini. ` +
        `For full model support, set OPENROUTER_API_KEY.`
    )
    const openai = getOpenAIClient()
    return openai("gpt-4o-mini")
  }

  // Should not reach here, but fallback to OpenRouter
  const openrouter = getOpenRouterClient()
  return openrouter(modelId)
}
