/**
 * ContentPack Bundler/Exporter for ElizaOS
 * Bundles all components into a complete content pack
 */

import type {
  IContentPack,
  ContentPackDefinition,
  ContentPackMetadata,
  ContentPackCategory,
} from "@/lib/types/content-pack"

import type { GeneratedAction } from "./action-generator"
import type { GeneratedProvider } from "./provider-generator"
import type { GeneratedEvaluator } from "./evaluator-generator"
import type { GeneratedGameSystem } from "./game-system-generator"
import type { GeneratedStateManager } from "./state-manager-generator"

export interface ContentPackBundlerParams {
  metadata: ContentPackMetadata
  actions?: GeneratedAction[]
  providers?: GeneratedProvider[]
  evaluators?: GeneratedEvaluator[]
  systems?: GeneratedGameSystem[]
  stateManagers?: GeneratedStateManager[]
  initializeCode?: string
  cleanupCode?: string
}

export interface BundledContentPack {
  definition: ContentPackDefinition
  compiled: IContentPack
  sourceCode: string
  packageJson: string
  readme: string
}

/**
 * Validate that code string is from a trusted source
 *
 * SECURITY: This function provides basic validation to detect obviously malicious code.
 * However, it CANNOT guarantee safety. Only use content packs from trusted sources.
 *
 * @param code - The code string to validate
 * @param codeType - The type of code (for error messages)
 * @param metadata - Content pack metadata (for logging/auditing)
 */
function validateTrustedCodeString(
  code: string,
  codeType: string,
  metadata: ContentPackMetadata
): void {
  // Log all code compilation attempts for security auditing
  console.log(`[ContentPack Security] Compiling ${codeType} code for pack: ${metadata.name} v${metadata.version} by ${metadata.author}`)

  // Basic validation: check for suspicious patterns
  const suspiciousPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /require\s*\(\s*['"]child_process['"]\s*\)/,
    /import\s*\(\s*['"]child_process['"]\s*\)/,
    /process\.env/,
    /\bexec\b/,
    /\bspawn\b/,
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(code)) {
      const error = new Error(
        `[ContentPack Security] Suspicious code pattern detected in ${codeType} code from pack "${metadata.name}" by ${metadata.author}. ` +
        `Pattern: ${pattern}. This content pack should only be used if from a TRUSTED source.`
      )
      console.error(error.message)
      throw error
    }
  }

  // Validate code is properly formatted as an async function
  const asyncFunctionPattern = /^\s*async\s+\(/
  if (!asyncFunctionPattern.test(code)) {
    console.warn(
      `[ContentPack Security] Code in ${codeType} from pack "${metadata.name}" does not appear to be an async function. ` +
      `Ensure this content pack is from a trusted source.`
    )
  }
}

/**
 * Bundle all components into a complete content pack
 */
export async function bundleContentPack(params: ContentPackBundlerParams): Promise<BundledContentPack> {
  const {
    metadata,
    actions = [],
    providers = [],
    evaluators = [],
    systems = [],
    stateManagers = [],
    initializeCode,
    cleanupCode,
  } = params

  // Create the definition
  const definition: ContentPackDefinition = {
    metadata,
    actions: actions.map(a => a.definition),
    providers: providers.map(p => p.definition),
    evaluators: evaluators.map(e => e.definition),
    systems: systems.map(s => s.definition),
    stateManagers: stateManagers.map(sm => sm.definition),
    initializeCode,
    cleanupCode,
  }

  // Compile to executable ContentPack
  const compiled = compileContentPack(params)

  // Generate source code
  const sourceCode = generateContentPackSourceCode(params)

  // Generate package.json
  const packageJson = generatePackageJson(metadata)

  // Generate README.md
  const readme = generateReadme(params)

  return {
    definition,
    compiled,
    sourceCode,
    packageJson,
    readme,
  }
}

/**
 * Compile all components into executable IContentPack
 */
function compileContentPack(params: ContentPackBundlerParams): IContentPack {
  const {
    metadata,
    actions = [],
    providers = [],
    evaluators = [],
    systems = [],
    stateManagers = [],
    initializeCode,
    cleanupCode,
  } = params

  // Compile initialization if provided
  // SECURITY: initializeCode and cleanupCode must come from TRUSTED sources only.
  // These code strings are compiled using Function constructor which can execute arbitrary code.
  // Only use content packs from verified, trusted authors or your own codebase.
  let initialize: IContentPack["initialize"]
  if (initializeCode) {
    // Validate that the code string is from a trusted source
    validateTrustedCodeString(initializeCode, "initialize", metadata)

    // Compile the trusted code
    initialize = new Function(
      "runtime",
      `return (${initializeCode})(runtime)`
    ) as IContentPack["initialize"]
  }

  // Compile cleanup if provided
  let cleanup: IContentPack["cleanup"]
  if (cleanupCode) {
    // Validate that the code string is from a trusted source
    validateTrustedCodeString(cleanupCode, "cleanup", metadata)

    // Compile the trusted code
    cleanup = new Function(
      `return (${cleanupCode})()`
    ) as IContentPack["cleanup"]
  }

  // Create state managers map
  const stateManagersMap = new Map()
  stateManagers.forEach(sm => {
    stateManagersMap.set(sm.definition.name, sm.compiled)
  })

  return {
    name: metadata.name,
    version: metadata.version,
    description: metadata.description,
    author: metadata.author,
    actions: actions.map(a => a.compiled),
    providers: providers.map(p => p.compiled),
    evaluators: evaluators.map(e => e.compiled),
    systems: systems.map(s => s.compiled),
    stateManagers: stateManagersMap,
    dependencies: metadata.dependencies,
    initialize,
    cleanup,
  }
}

/**
 * Generate complete TypeScript source code for the content pack
 */
function generateContentPackSourceCode(params: ContentPackBundlerParams): string {
  const {
    metadata,
    actions = [],
    providers = [],
    evaluators = [],
    systems = [],
    stateManagers = [],
    initializeCode,
    cleanupCode,
  } = params

  const packageName = toCamelCase(metadata.name)

  // Generate imports
  const imports = `import type { IContentPack, IAgentRuntime } from "@elizaos/core"

// Action imports
${actions.map((a) => a.sourceCode).join("\n\n")}

// Provider imports
${providers.map((p) => p.sourceCode).join("\n\n")}

// Evaluator imports
${evaluators.map((e) => e.sourceCode).join("\n\n")}

// Game System imports
${systems.map((s) => s.sourceCode).join("\n\n")}

// State Manager imports
${stateManagers.map((sm) => sm.sourceCode).join("\n\n")}
`

  // Generate content pack object
  const contentPackCode = `
/**
 * ${metadata.name} Content Pack
 * ${metadata.description}
 *
 * @author ${metadata.author}
 * @version ${metadata.version}
 * @category ${metadata.category}
 */
export const ${packageName}ContentPack: IContentPack = {
  name: "${metadata.name}",
  version: "${metadata.version}",
  description: "${metadata.description}",
  author: "${metadata.author}",

  ${actions.length > 0 ? `actions: [
    ${actions.map(a => `${toCamelCase(a.definition.name)}Action`).join(",\n    ")}
  ],` : ''}

  ${providers.length > 0 ? `providers: [
    ${providers.map(p => `${toCamelCase(p.definition.name)}Provider`).join(",\n    ")}
  ],` : ''}

  ${evaluators.length > 0 ? `evaluators: [
    ${evaluators.map(e => `${toCamelCase(e.definition.name)}Evaluator`).join(",\n    ")}
  ],` : ''}

  ${systems.length > 0 ? `systems: [
    ${systems.map(s => `${toCamelCase(s.definition.name)}System`).join(",\n    ")}
  ],` : ''}

  ${stateManagers.length > 0 ? `stateManagers: new Map([
    ${stateManagers.map(sm => `["${sm.definition.name}", new ${toPascalCase(sm.definition.name)}StateManager()]`).join(",\n    ")}
  ]),` : ''}

  dependencies: ${JSON.stringify(metadata.dependencies ?? [], null, 2)},

  ${initializeCode ? `initialize: ${initializeCode},` : ''}

  ${cleanupCode ? `cleanup: ${cleanupCode},` : ''}
}

export default ${packageName}ContentPack
`

  return imports + contentPackCode
}

/**
 * Generate package.json for the content pack
 */
function generatePackageJson(metadata: ContentPackMetadata): string {
  const packageName = `@hyperscape/${toKebabCase(metadata.name)}`

  const packageObj = {
    name: packageName,
    version: metadata.version,
    description: metadata.description,
    author: metadata.author,
    license: "MIT",
    main: "./dist/index.js",
    types: "./dist/index.d.ts",
    scripts: {
      build: "tsc",
      dev: "tsc --watch",
      lint: "eslint . --ext .ts",
      test: "jest",
    },
    keywords: [
      "elizaos",
      "hyperscape",
      "content-pack",
      "npc",
      metadata.category,
      ...metadata.tags,
    ],
    dependencies: {
      "@elizaos/core": metadata.compatibility.elizaVersion,
      ...(metadata.dependencies ?? []).reduce((acc, dep) => {
        // Parse dependency string to extract package name and version
        // Supports formats: "pkg@1.2.3", "pkg@^1.2.3", or "pkg" (will error)
        const match = dep.match(/^(@?[^@]+)(?:@(.+))?$/)
        if (!match) {
          throw new Error(
            `Invalid dependency format: "${dep}". Expected format: "package@version" (e.g., "lodash@^4.17.21")`
          )
        }

        const [, pkgName, version] = match

        if (!version || version === "latest") {
          throw new Error(
            `Dependency "${pkgName}" must specify an explicit version (e.g., "^1.0.0", "~2.3.4", "1.2.3"). ` +
            `Using "latest" breaks reproducible builds.`
          )
        }

        acc[pkgName] = version
        return acc
      }, {} as Record<string, string>),
    },
    devDependencies: {
      typescript: "^5.3.0",
      "@types/node": "^20.0.0",
      eslint: "^8.0.0",
      "@typescript-eslint/eslint-plugin": "^6.0.0",
      "@typescript-eslint/parser": "^6.0.0",
      jest: "^29.0.0",
      "@types/jest": "^29.0.0",
    },
    peerDependencies: {
      "@elizaos/core": metadata.compatibility.elizaVersion,
    },
  }

  return JSON.stringify(packageObj, null, 2)
}

/**
 * Generate README.md for the content pack
 */
function generateReadme(params: ContentPackBundlerParams): string {
  const {
    metadata,
    actions = [],
    providers = [],
    evaluators = [],
    systems = [],
    stateManagers = [],
  } = params

  return `# ${metadata.name}

${metadata.description}

**Version:** ${metadata.version}
**Author:** ${metadata.author}
**Category:** ${metadata.category}

## Installation

\`\`\`bash
npm install @hyperscape/${toKebabCase(metadata.name)}
\`\`\`

## Usage

\`\`\`typescript
import { ${toCamelCase(metadata.name)}ContentPack } from "@hyperscape/${toKebabCase(metadata.name)}"
import { Agent } from "@elizaos/core"

// Create agent with content pack
const agent = new Agent({
  character: myCharacter,
  plugins: [${toCamelCase(metadata.name)}ContentPack],
})
\`\`\`

## Components

### Actions (${actions.length})

${actions.length > 0 ? actions.map(a => `- **${a.definition.name}**: ${a.definition.description}`).join("\n") : "*No actions defined*"}

### Providers (${providers.length})

${providers.length > 0 ? providers.map(p => `- **${p.definition.name}**: ${p.definition.description}`).join("\n") : "*No providers defined*"}

### Evaluators (${evaluators.length})

${evaluators.length > 0 ? evaluators.map(e => `- **${e.definition.name}**: ${e.definition.description}`).join("\n") : "*No evaluators defined*"}

### Game Systems (${systems.length})

${systems.length > 0 ? systems.map(s => `- **${s.definition.name}**: ${s.definition.description}`).join("\n") : "*No game systems defined*"}

### State Managers (${stateManagers.length})

${stateManagers.length > 0 ? stateManagers.map(sm => `- **${sm.definition.name}**: Manages per-player state`).join("\n") : "*No state managers defined*"}

## Dependencies

${metadata.dependencies && metadata.dependencies.length > 0 ? metadata.dependencies.map(dep => `- ${dep}`).join("\n") : "*No dependencies*"}

## Compatibility

- **ElizaOS Version:** ${metadata.compatibility.elizaVersion}
${metadata.compatibility.hyperscrapeVersion ? `- **Hyperscape Version:** ${metadata.compatibility.hyperscrapeVersion}` : ''}

## Tags

${metadata.tags.map(tag => `\`${tag}\``).join(", ")}

## License

MIT

---

*Generated with [NPC Content Pipeline](https://github.com/hyperscape/npc-pipeline)*
`
}

/**
 * Export content pack as a complete NPM package
 */
export async function exportContentPackAsPackage(
  bundled: BundledContentPack,
  _outputDir: string
): Promise<{ files: Map<string, string>; size: number }> {
  const files = new Map<string, string>()

  // Main source file
  files.set("src/index.ts", bundled.sourceCode)

  // Package.json
  files.set("package.json", bundled.packageJson)

  // README.md
  files.set("README.md", bundled.readme)

  // tsconfig.json
  files.set("tsconfig.json", generateTsConfig())

  // .gitignore
  files.set(".gitignore", generateGitIgnore())

  // eslint.config.js
  files.set("eslint.config.js", generateEslintConfig())

  // Calculate total size
  let totalSize = 0
  files.forEach(content => {
    totalSize += new Blob([content]).size
  })

  return {
    files,
    size: totalSize,
  }
}

/**
 * Generate tsconfig.json
 */
function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        lib: ["ES2020"],
        declaration: true,
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        moduleResolution: "node",
        resolveJsonModule: true,
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    },
    null,
    2
  )
}

/**
 * Generate .gitignore
 */
function generateGitIgnore(): string {
  return `node_modules/
dist/
*.log
.env
.DS_Store
coverage/
.vscode/
.idea/
`
}

/**
 * Generate eslint.config.js
 */
function generateEslintConfig(): string {
  return `module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
  },
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
    .replace(/[^a-zA-Z0-9]/g, "")
}

/**
 * Helper: Convert string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
}

/**
 * Helper: Convert string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
}

/**
 * Validate content pack definition
 */
export function validateContentPack(definition: ContentPackDefinition): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate metadata
  if (!definition.metadata.name) {
    errors.push("Content pack name is required")
  }
  if (!definition.metadata.version) {
    errors.push("Content pack version is required")
  }
  if (!definition.metadata.description) {
    errors.push("Content pack description is required")
  }

  // Validate at least one component exists
  const hasComponents =
    definition.actions.length > 0 ||
    definition.providers.length > 0 ||
    definition.evaluators.length > 0 ||
    definition.systems.length > 0 ||
    definition.stateManagers.length > 0

  if (!hasComponents) {
    errors.push("Content pack must have at least one component")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Create a content pack template for a specific category
 */
export function createContentPackTemplate(
  category: ContentPackCategory,
  name: string,
  author: string
): ContentPackBundlerParams {
  const metadata: ContentPackMetadata = {
    id: `pack_${Date.now()}`,
    name,
    version: "1.0.0",
    description: `${category} content pack for Hyperscape`,
    author,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [category],
    category,
    dependencies: [],
    compatibility: {
      elizaVersion: "^1.0.0",
      hyperscrapeVersion: "^1.0.0",
    },
  }

  return {
    metadata,
    actions: [],
    providers: [],
    evaluators: [],
    systems: [],
    stateManagers: [],
  }
}
