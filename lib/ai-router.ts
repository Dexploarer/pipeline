import { createOpenAI } from "@ai-sdk/openai"
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

// Validate and retrieve OpenRouter API key at startup
const OPENROUTER_API_KEY = process.env["OPENROUTER_API_KEY"]
if (!OPENROUTER_API_KEY) {
  const errorMessage =
    "OPENROUTER_API_KEY environment variable is not set. " +
    "Please set it in your .env.local file or environment variables. " +
    "Get your API key from https://openrouter.ai/keys"
  console.error(errorMessage)
  throw new Error(errorMessage)
}

// Create OpenAI-compatible client configured for OpenRouter
const openrouter = createOpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
})

export function selectModel(task: TaskType, priority: Priority = "cost"): string {
  return MODEL_MATRIX[task]?.[priority] || "openai/gpt-4o-mini"
}

export function selectModelId(task: TaskType, priority: Priority = "cost"): string {
  return MODEL_MATRIX[task]?.[priority] || "openai/gpt-4o-mini"
}

export function getModelForTask(task: TaskType, customModel?: string, priority: Priority = "cost"): LanguageModel {
  // Select model ID
  const modelId = customModel ?? selectModel(task, priority)

  // Return LanguageModel object
  return openrouter(modelId)
}
