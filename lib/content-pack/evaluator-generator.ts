/**
 * Evaluator Generator for ElizaOS Content Packs
 * Generates post-conversation analysis components for NPCs
 */

import type {
  Evaluator,
  EvaluatorDefinition,
} from "@/lib/types/content-pack"

export interface EvaluatorGeneratorParams {
  name: string
  similes?: string[]
  description: string
  alwaysRun?: boolean
  evaluationType: EvaluatorType
  context?: {
    npcId?: string
    archetype?: string
    triggerConditions?: string[]
    analysisTargets?: string[]
  }
  examples?: Array<Array<{
    user: string
    content: {
      text: string
      action?: string
    }
  }>>
  customLogic?: string
}

export enum EvaluatorType {
  SENTIMENT = "sentiment",
  GOAL_PROGRESS = "goal_progress",
  RELATIONSHIP_CHANGE = "relationship_change",
  QUEST_TRIGGER = "quest_trigger",
  LEARNING = "learning",
  MEMORY_EXTRACTION = "memory_extraction",
  EMOTION_TRACKING = "emotion_tracking",
  CUSTOM = "custom",
}

export interface GeneratedEvaluator {
  definition: EvaluatorDefinition
  compiled: Evaluator
  sourceCode: string
}

/**
 * Generate an Evaluator component from parameters
 */
export async function generateEvaluator(params: EvaluatorGeneratorParams): Promise<GeneratedEvaluator> {
  const {
    name,
    similes = [],
    description,
    alwaysRun = false,
    evaluationType,
    context = {},
    examples = [],
    customLogic,
  } = params

  // Generate examples if not provided
  const evaluatorExamples = examples.length > 0 ? examples : await generateEvaluatorExamples(name, description, evaluationType, context)

  // Generate handler code
  const handlerCode = customLogic ?? await generateEvaluatorHandlerCode(name, evaluationType, context)

  // Generate validator code
  const validateCode = await generateEvaluatorValidatorCode(name, evaluationType, context)

  // Create the definition
  const definition: EvaluatorDefinition = {
    name,
    similes,
    description,
    examples: evaluatorExamples,
    handlerCode,
    validateCode,
    alwaysRun,
  }

  // Compile to executable Evaluator
  const compiled = compileEvaluator(definition)

  // Generate source code for export
  const sourceCode = generateEvaluatorSourceCode(definition)

  return {
    definition,
    compiled,
    sourceCode,
  }
}

/**
 * Generate examples for an evaluator based on type
 */
async function generateEvaluatorExamples(
  name: string,
  _description: string,
  evaluationType: EvaluatorType,
  context: EvaluatorGeneratorParams["context"]
): Promise<Array<Array<{
  user: string
  content: {
    text: string
    action?: string
  }
}>>> {
  switch (evaluationType) {
    case EvaluatorType.SENTIMENT:
      return [
        [
          {
            user: "{{user1}}",
            content: { text: "This is amazing! Thank you so much!" },
          },
          {
            user: context?.npcId ?? "{{agentName}}",
            content: { text: "I'm glad I could help!", action: "EVALUATE_SENTIMENT" },
          },
        ],
        [
          {
            user: "{{user1}}",
            content: { text: "This is frustrating and not working at all." },
          },
          {
            user: context?.npcId ?? "{{agentName}}",
            content: { text: "I'm sorry to hear that. Let me try to help.", action: "EVALUATE_SENTIMENT" },
          },
        ],
      ]

    case EvaluatorType.RELATIONSHIP_CHANGE:
      return [
        [
          {
            user: "{{user1}}",
            content: { text: "You've been really helpful. I trust you." },
          },
          {
            user: context?.npcId ?? "{{agentName}}",
            content: { text: "Thank you. I'm here whenever you need me.", action: "EVALUATE_RELATIONSHIP" },
          },
        ],
      ]

    default:
      return [
        [
          {
            user: "{{user1}}",
            content: { text: "I need some help with this task." },
          },
          {
            user: context?.npcId ?? "{{agentName}}",
            content: { text: "Of course! Let me assist you.", action: `EVALUATE_${name.toUpperCase()}` },
          },
        ],
      ]
  }
}

/**
 * Generate handler code for an evaluator based on type
 */
async function generateEvaluatorHandlerCode(
  name: string,
  evaluationType: EvaluatorType,
  context: EvaluatorGeneratorParams["context"]
): Promise<string> {
  switch (evaluationType) {
    case EvaluatorType.SENTIMENT:
      return generateSentimentEvaluatorCode(name, context)

    case EvaluatorType.GOAL_PROGRESS:
      return generateGoalProgressEvaluatorCode(name, context)

    case EvaluatorType.RELATIONSHIP_CHANGE:
      return generateRelationshipChangeEvaluatorCode(name, context)

    case EvaluatorType.QUEST_TRIGGER:
      return generateQuestTriggerEvaluatorCode(name, context)

    case EvaluatorType.LEARNING:
      return generateLearningEvaluatorCode(name, context)

    case EvaluatorType.MEMORY_EXTRACTION:
      return generateMemoryExtractionEvaluatorCode(name, context)

    case EvaluatorType.EMOTION_TRACKING:
      return generateEmotionTrackingEvaluatorCode(name, context)

    case EvaluatorType.CUSTOM:
    default:
      return generateCustomEvaluatorCode(name, context)
  }
}

/**
 * Generate sentiment analysis evaluator code
 */
function generateSentimentEvaluatorCode(
  name: string,
  _context: EvaluatorGeneratorParams["context"]
): string {
  return `async (runtime, message, state, didRespond, callback) => {
  try {
    const messageText = message.content.text.toLowerCase()

    // Simple sentiment analysis
    const positiveWords = ["thank", "great", "amazing", "love", "excellent", "wonderful", "good"]
    const negativeWords = ["hate", "terrible", "awful", "bad", "frustrating", "annoying", "worst"]

    let sentimentScore = 0
    positiveWords.forEach(word => {
      if (messageText.includes(word)) sentimentScore += 1
    })
    negativeWords.forEach(word => {
      if (messageText.includes(word)) sentimentScore -= 1
    })

    // Store sentiment in state or relationship manager
    const relationshipManager = runtime.getService("relationshipManager")
    if (relationshipManager && sentimentScore !== 0) {
      await relationshipManager.updateAffinity(
        runtime.agentId,
        message.userId,
        sentimentScore * 5
      )
    }

    console.log(\`[${name}] Sentiment score: \${sentimentScore} for user \${message.userId}\`)

    return [\`SENTIMENT_\${sentimentScore > 0 ? "POSITIVE" : sentimentScore < 0 ? "NEGATIVE" : "NEUTRAL"}\`]
  } catch (error) {
    console.error("[${name}] Sentiment evaluator error:", error)
    return []
  }
}`
}

/**
 * Generate goal progress evaluator code
 */
function generateGoalProgressEvaluatorCode(
  name: string,
  _context: EvaluatorGeneratorParams["context"]
): string {
  return `async (runtime, message, state, didRespond, callback) => {
  try {
    const goals = state?.goalsData ?? []

    if (goals.length === 0) {
      return []
    }

    const updatedGoals = []

    // Check each goal's objectives against the conversation
    for (const goal of goals) {
      let progressMade = false

      for (const objective of goal.objectives) {
        if (!objective.completed) {
          // Simple keyword matching for objective completion
          const keywords = objective.description.toLowerCase().split(" ")
          const messageText = message.content.text.toLowerCase()

          const matchCount = keywords.filter(k => messageText.includes(k)).length
          if (matchCount >= keywords.length / 2) {
            objective.completed = true
            progressMade = true
          }
        }
      }

      if (progressMade) {
        updatedGoals.push(goal.name)
      }
    }

    if (updatedGoals.length > 0) {
      console.log(\`[${name}] Progress made on goals: \${updatedGoals.join(", ")}\`)
      return updatedGoals.map(g => \`GOAL_PROGRESS_\${g.toUpperCase().replace(/\\s+/g, "_")}\`)
    }

    return []
  } catch (error) {
    console.error("[${name}] Goal progress evaluator error:", error)
    return []
  }
}`
}

/**
 * Generate relationship change evaluator code
 */
function generateRelationshipChangeEvaluatorCode(
  name: string,
  _context: EvaluatorGeneratorParams["context"]
): string {
  return `async (runtime, message, state, didRespond, callback) => {
  try {
    const relationshipManager = runtime.getService("relationshipManager")

    if (!relationshipManager) {
      return []
    }

    // Get current relationship
    const relationship = await relationshipManager.getRelationship(
      runtime.agentId,
      message.userId
    )

    const previousLevel = relationship?.level ?? 0

    // Analyze conversation for relationship indicators
    const messageText = message.content.text.toLowerCase()
    const trustWords = ["trust", "believe", "depend", "rely", "friend"]
    const distrustWords = ["doubt", "suspicious", "distrust", "deceive", "lie"]

    let affinityChange = 0
    trustWords.forEach(word => {
      if (messageText.includes(word)) affinityChange += 3
    })
    distrustWords.forEach(word => {
      if (messageText.includes(word)) affinityChange -= 3
    })

    if (affinityChange !== 0) {
      await relationshipManager.updateAffinity(
        runtime.agentId,
        message.userId,
        affinityChange
      )

      const updatedRelationship = await relationshipManager.getRelationship(
        runtime.agentId,
        message.userId
      )

      if (updatedRelationship && updatedRelationship.level !== previousLevel) {
        console.log(\`[${name}] Relationship level changed: \${previousLevel} -> \${updatedRelationship.level}\`)
        return [\`RELATIONSHIP_LEVEL_\${updatedRelationship.level}\`]
      }
    }

    return []
  } catch (error) {
    console.error("[${name}] Relationship change evaluator error:", error)
    return []
  }
}`
}

/**
 * Generate quest trigger evaluator code
 */
function generateQuestTriggerEvaluatorCode(
  name: string,
  context: EvaluatorGeneratorParams["context"]
): string {
  return `async (runtime, message, state, didRespond, callback) => {
  try {
    const questManager = runtime.getService("questManager")

    if (!questManager) {
      return []
    }

    const messageText = message.content.text.toLowerCase()
    const triggers = []

    // Check for quest trigger keywords
    ${context?.triggerConditions?.map(cond => `
    if (messageText.includes("${cond.toLowerCase()}")) {
      triggers.push("QUEST_TRIGGER_${cond.toUpperCase().replace(/\s+/g, "_")}")
    }`).join("") ?? '// Add quest trigger conditions here'}

    // Example: Check for help requests that might trigger tutorial quests
    if (messageText.includes("help") || messageText.includes("guide") || messageText.includes("how")) {
      const hasActiveQuests = await questManager.getActiveQuests(message.userId)
      if (!hasActiveQuests || hasActiveQuests.length === 0) {
        triggers.push("QUEST_TRIGGER_TUTORIAL")
      }
    }

    if (triggers.length > 0) {
      console.log(\`[${name}] Quest triggers detected: \${triggers.join(", ")}\`)
    }

    return triggers
  } catch (error) {
    console.error("[${name}] Quest trigger evaluator error:", error)
    return []
  }
}`
}

/**
 * Generate learning evaluator code
 */
function generateLearningEvaluatorCode(
  name: string,
  _context: EvaluatorGeneratorParams["context"]
): string {
  return `async (runtime, message, state, didRespond, callback) => {
  try {
    const knowledgeManager = runtime.knowledgeManager

    // Extract potential facts or information from the conversation
    const messageText = message.content.text

    // Look for declarative statements (simple heuristic)
    const statements = messageText.split(/[.!?]/).filter(s => s.trim().length > 10)

    const learnings = []

    for (const statement of statements) {
      // Check if this is new information (not already in knowledge base)
      const existing = await knowledgeManager.searchKnowledge(statement, {
        threshold: 0.9,
        limit: 1,
      })

      if (!existing || existing.length === 0) {
        // Store new knowledge
        await knowledgeManager.addKnowledge({
          content: statement.trim(),
          source: "conversation",
          userId: message.userId,
          timestamp: Date.now(),
        })

        learnings.push("LEARNED_NEW_INFORMATION")
      }
    }

    if (learnings.length > 0) {
      console.log(\`[${name}] Learned \${learnings.length} new facts from conversation\`)
    }

    return learnings
  } catch (error) {
    console.error("[${name}] Learning evaluator error:", error)
    return []
  }
}`
}

/**
 * Generate memory extraction evaluator code
 */
function generateMemoryExtractionEvaluatorCode(
  name: string,
  _context: EvaluatorGeneratorParams["context"]
): string {
  return `async (runtime, message, state, didRespond, callback) => {
  try {
    const messageManager = runtime.messageManager

    // Extract important information to remember
    const messageText = message.content.text.toLowerCase()

    const extractedMemories = []

    // Check for personal information sharing
    if (messageText.includes("my name is") || messageText.includes("i am")) {
      extractedMemories.push("MEMORY_PERSONAL_INFO")
    }

    // Check for preferences
    if (messageText.includes("i like") || messageText.includes("i prefer") || messageText.includes("i love")) {
      extractedMemories.push("MEMORY_PREFERENCE")
    }

    // Check for goals or intentions
    if (messageText.includes("i want to") || messageText.includes("i need to") || messageText.includes("my goal")) {
      extractedMemories.push("MEMORY_GOAL")
    }

    // Store extracted memories with high importance
    if (extractedMemories.length > 0) {
      await messageManager.createMemory({
        userId: message.userId,
        agentId: runtime.agentId,
        roomId: message.roomId,
        content: {
          text: messageText,
          source: "memory_extraction",
        },
        importance: 0.9, // High importance for extracted memories
      })

      console.log(\`[${name}] Extracted memories: \${extractedMemories.join(", ")}\`)
    }

    return extractedMemories
  } catch (error) {
    console.error("[${name}] Memory extraction evaluator error:", error)
    return []
  }
}`
}

/**
 * Generate emotion tracking evaluator code
 */
function generateEmotionTrackingEvaluatorCode(
  name: string,
  _context: EvaluatorGeneratorParams["context"]
): string {
  return `async (runtime, message, state, didRespond, callback) => {
  try {
    const messageText = message.content.text.toLowerCase()

    // Simple emotion detection
    const emotions = {
      joy: ["happy", "excited", "thrilled", "delighted", "glad"],
      sadness: ["sad", "unhappy", "depressed", "disappointed", "down"],
      anger: ["angry", "furious", "mad", "frustrated", "annoyed"],
      fear: ["scared", "afraid", "worried", "anxious", "nervous"],
      surprise: ["surprised", "shocked", "amazed", "astonished"],
    }

    const detectedEmotions = []

    for (const [emotion, keywords] of Object.entries(emotions)) {
      const matches = keywords.filter(keyword => messageText.includes(keyword))
      if (matches.length > 0) {
        detectedEmotions.push(\`EMOTION_\${emotion.toUpperCase()}\`)

        // Store emotion in player state
        const stateManager = runtime.getService("playerStateManager")
        if (stateManager) {
          await stateManager.updateState(message.userId, {
            lastEmotion: emotion,
            lastEmotionTime: Date.now(),
          })
        }
      }
    }

    if (detectedEmotions.length > 0) {
      console.log(\`[${name}] Detected emotions: \${detectedEmotions.join(", ")}\`)
    }

    return detectedEmotions
  } catch (error) {
    console.error("[${name}] Emotion tracking evaluator error:", error)
    return []
  }
}`
}

/**
 * Generate custom evaluator code
 */
function generateCustomEvaluatorCode(
  name: string,
  context: EvaluatorGeneratorParams["context"]
): string {
  return `async (runtime, message, state, didRespond, callback) => {
  try {
    // Custom evaluator logic
    ${context?.analysisTargets?.map(target => `// Analyze: ${target}`).join("\n    ") ?? '// Add your custom evaluation logic here'}

    const results = []

    // Example: Custom analysis
    // const customService = runtime.getService("myCustomService")
    // const analysis = await customService.analyze(message.content.text)
    // if (analysis.shouldTrigger) {
    //   results.push("CUSTOM_TRIGGER")
    // }

    return results
  } catch (error) {
    console.error("[${name}] Custom evaluator error:", error)
    return []
  }
}`
}

/**
 * Generate validator code for an evaluator
 */
async function generateEvaluatorValidatorCode(
  name: string,
  _evaluationType: EvaluatorType,
  context: EvaluatorGeneratorParams["context"]
): Promise<string> {
  return `async (runtime, message, state) => {
  try {
    // Evaluators typically run on most messages
    // Add specific validation logic if needed
    ${context?.triggerConditions ? `
    const messageText = message.content.text.toLowerCase()
    const triggers = [${context.triggerConditions.map(c => `"${c.toLowerCase()}"`).join(", ")}]
    return triggers.some(trigger => messageText.includes(trigger))
    ` : '// Run on all messages by default\n    return true'}
  } catch (error) {
    console.error("[${name}] Validator error:", error)
    return false
  }
}`
}

/**
 * Compile EvaluatorDefinition to executable Evaluator
 */
function compileEvaluator(definition: EvaluatorDefinition): Evaluator {
  // Use Function constructor to compile code strings
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const handler = new Function(
    "runtime",
    "message",
    "state",
    "didRespond",
    "callback",
    `return (${definition.handlerCode})(runtime, message, state, didRespond, callback)`
  ) as Evaluator["handler"]

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const validate = new Function(
    "runtime",
    "message",
    "state",
    `return (${definition.validateCode})(runtime, message, state)`
  ) as Evaluator["validate"]

  return {
    name: definition.name,
    similes: definition.similes,
    description: definition.description,
    examples: definition.examples,
    handler,
    validate,
    alwaysRun: definition.alwaysRun,
  }
}

/**
 * Generate TypeScript source code for an Evaluator
 */
function generateEvaluatorSourceCode(definition: EvaluatorDefinition): string {
  return `import type { Evaluator } from "@elizaos/core"

export const ${toCamelCase(definition.name)}Evaluator: Evaluator = {
  name: "${definition.name}",
  similes: ${JSON.stringify(definition.similes, null, 2)},
  description: "${definition.description}",
  examples: ${JSON.stringify(definition.examples, null, 2)},
  ${definition.alwaysRun ? 'alwaysRun: true,' : ''}

  handler: ${definition.handlerCode},

  validate: ${definition.validateCode},
}
`
}

/**
 * Helper: Convert string to camelCase
 */
function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, "")
}

/**
 * Generate multiple evaluators from a template
 */
export async function generateEvaluatorsFromTemplate(
  template: {
    archetype: string
    evaluators: Array<{
      name: string
      description: string
      type: EvaluatorType
      alwaysRun?: boolean
    }>
  },
  context?: EvaluatorGeneratorParams["context"]
): Promise<GeneratedEvaluator[]> {
  const results: GeneratedEvaluator[] = []

  for (const evaluatorConfig of template.evaluators) {
    const generated = await generateEvaluator({
      name: evaluatorConfig.name,
      description: evaluatorConfig.description,
      evaluationType: evaluatorConfig.type,
      alwaysRun: evaluatorConfig.alwaysRun ?? false,
      context,
    })
    results.push(generated)
  }

  return results
}

/**
 * Export evaluators as a module
 */
export function exportEvaluatorsAsModule(
  evaluators: GeneratedEvaluator[],
  moduleName: string
): string {
  const evaluatorExports = evaluators
    .map(e => e.sourceCode)
    .join("\n\n")

  return `/**
 * ${moduleName} Evaluators
 */

${evaluatorExports}

export const ${toCamelCase(moduleName)}Evaluators = [
  ${evaluators.map(e => `${toCamelCase(e.definition.name)}Evaluator`).join(",\n  ")}
]
`
}
