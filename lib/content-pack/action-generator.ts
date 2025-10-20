/**
 * Action Generator for ElizaOS Content Packs
 * Generates executable behavior components for NPCs
 */

import type {
  Action,
  ActionDefinition,
} from "@/lib/types/content-pack"

export interface ActionGeneratorParams {
  name: string
  similes?: string[]
  description: string
  context?: {
    npcName?: string
    archetype?: string
    personality?: Record<string, unknown>
    worldContext?: string
    relatedActions?: string[]
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

export interface GeneratedAction {
  definition: ActionDefinition
  compiled: Action
  sourceCode: string
}

/**
 * Generate an Action component from parameters
 */
export async function generateAction(params: ActionGeneratorParams): Promise<GeneratedAction> {
  const {
    name,
    similes = [],
    description,
    context = {},
    examples = [],
    customLogic,
  } = params

  // Generate examples if not provided
  const actionExamples = examples.length > 0 ? examples : await generateActionExamples(name, description, context)

  // Generate handler code
  const handlerCode = customLogic ?? await generateHandlerCode(name, description, context)

  // Generate validator code
  const validateCode = await generateValidatorCode(name, description, context)

  // Create the definition
  const definition: ActionDefinition = {
    name,
    similes,
    description,
    examples: actionExamples,
    handlerCode,
    validateCode,
  }

  // Compile to executable Action
  const compiled = compileAction(definition)

  // Generate source code for export
  const sourceCode = generateActionSourceCode(definition)

  return {
    definition,
    compiled,
    sourceCode,
  }
}

/**
 * Generate examples for an action based on context
 */
async function generateActionExamples(
  name: string,
  _description: string,
  context: ActionGeneratorParams["context"]
): Promise<Array<Array<{
  user: string
  content: {
    text: string
    action?: string
  }
}>>> {
  // Default examples structure
  return [
    [
      {
        user: "{{user1}}",
        content: {
          text: `I'd like to ${name.toLowerCase()}`,
        },
      },
      {
        user: context?.npcName ?? "{{agentName}}",
        content: {
          text: `Sure, I can help you with that.`,
          action: name.toUpperCase(),
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: `Can you ${name.toLowerCase()}?`,
        },
      },
      {
        user: context?.npcName ?? "{{agentName}}",
        content: {
          text: `Of course! Let me ${name.toLowerCase()} for you.`,
          action: name.toUpperCase(),
        },
      },
    ],
  ]
}

/**
 * Generate handler code for an action
 */
async function generateHandlerCode(
  name: string,
  _description: string,
  context: ActionGeneratorParams["context"]
): Promise<string> {
  return `async (runtime, message, state, options, callback) => {
  try {
    // Extract relevant information from the message
    const userId = message.userId
    const roomId = message.roomId
    const messageText = message.content.text

    // Log action execution
    console.log(\`[${name}] Executing for user \${userId} in room \${roomId}\`)

    // Perform action logic
    ${context?.worldContext ? `// World context: ${context.worldContext}` : '// Add your action logic here'}

    // Example: Query world state if needed
    // const worldState = await runtime.getService('worldSystem')?.queryWorld('player_location', runtime)

    // Generate response
    const responseText = \`Action "${name}" completed successfully.\`

    // Call callback with response
    if (callback) {
      await callback({
        text: responseText,
        action: "${name.toUpperCase()}",
      })
    }

    return {
      success: true,
      message: responseText,
    }
  } catch (error) {
    console.error(\`[${name}] Error:\`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}`
}

/**
 * Generate validator code for an action
 */
async function generateValidatorCode(
  name: string,
  _description: string,
  context: ActionGeneratorParams["context"]
): Promise<string> {
  return `async (runtime, message, state) => {
  try {
    const messageText = message.content.text.toLowerCase()

    // Check if message indicates intent for this action
    const keywords = ["${name.toLowerCase()}", ${context?.relatedActions?.map(a => `"${a.toLowerCase()}"`).join(", ") ?? ''}]
    const hasKeyword = keywords.some(keyword => messageText.includes(keyword))

    if (!hasKeyword) {
      return false
    }

    // Additional validation logic
    ${context?.archetype ? `// Archetype-specific validation for ${context.archetype}` : '// Add custom validation logic here'}

    return true
  } catch (error) {
    console.error(\`[${name}] Validation error:\`, error)
    return false
  }
}`
}

/**
 * Compile ActionDefinition to executable Action
 */
function compileAction(definition: ActionDefinition): Action {
  // Use Function constructor to compile code strings
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const handler = new Function(
    "runtime",
    "message",
    "state",
    "options",
    "callback",
    `return (${definition.handlerCode})(runtime, message, state, options, callback)`
  ) as Action["handler"]

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const validate = new Function(
    "runtime",
    "message",
    "state",
    `return (${definition.validateCode})(runtime, message, state)`
  ) as Action["validate"]

  return {
    name: definition.name,
    similes: definition.similes,
    description: definition.description,
    examples: definition.examples,
    handler,
    validate,
  }
}

/**
 * Generate TypeScript source code for an Action
 */
function generateActionSourceCode(definition: ActionDefinition): string {
  return `import type { Action } from "@elizaos/core"

export const ${toCamelCase(definition.name)}Action: Action = {
  name: "${definition.name}",
  similes: ${JSON.stringify(definition.similes, null, 2)},
  description: "${definition.description}",
  examples: ${JSON.stringify(definition.examples, null, 2)},

  handler: ${definition.handlerCode},

  validate: ${definition.validateCode},
}
`
}

/**
 * Generate multiple actions from a template
 */
export async function generateActionsFromTemplate(
  template: {
    archetype: string
    actions: Array<{
      name: string
      description: string
      similes?: string[]
    }>
  },
  context?: ActionGeneratorParams["context"]
): Promise<GeneratedAction[]> {
  const results: GeneratedAction[] = []

  for (const actionConfig of template.actions) {
    const generated = await generateAction({
      name: actionConfig.name,
      similes: actionConfig.similes ?? [],
      description: actionConfig.description,
      context: {
        ...context,
        archetype: template.archetype,
      },
    })
    results.push(generated)
  }

  return results
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
 * Export actions as a plugin module
 */
export function exportActionsAsPlugin(
  actions: GeneratedAction[],
  pluginName: string,
  description: string
): string {
  const actionImports = actions
    .map((a, i) => `const action${i} = ${a.sourceCode}`)
    .join("\n\n")

  return `/**
 * ${pluginName}
 * ${description}
 */

${actionImports}

export const ${toCamelCase(pluginName)}Plugin = {
  name: "${pluginName}",
  description: "${description}",
  actions: [
    ${actions.map((_, i) => `action${i}`).join(",\n    ")}
  ],
}
`
}
