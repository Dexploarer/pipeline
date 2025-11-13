# AI Game Development Platform v3.0

A comprehensive unified platform combining visual workflow design, event-driven AI agents, and NPC content generation for game development.

## 🚀 Features

### 1. Visual Workflow Builder
- **React Flow** node-based visual editor
- **Durable execution** with state persistence
- **ElevenLabs** voice synthesis integration
- Multi-format export (Unity, Unreal, Godot, ElizaOS)

### 2. Event-Driven AI Agents (ElizaOS-Inspired)
- **XML event logging** for complete auditability
- **5 Providers** for context injection (game state, memory, goals, performance, events)
- **5 Evaluators** for learning (success patterns, mistakes, goals, relationships, efficiency)
- **6 Prompt templates** for different scenarios (decision, exploration, combat, social, learning, planning)
- **8 Game action tools** (move, interact, attack, use_item, speak, quest_action, inventory_action, wait)
- **Streaming decision-making** with Server-Sent Events
- **Memory system** for knowledge retention

### 3. NPC Content Pipeline
- AI-powered NPC script generation
- Layered quest builder
- Lore management system
- Relationship graph visualization
- Quest flow visualizer
- Dialogue tree editor
- Context management tools
- NPC simulator
- Analytics dashboard
- World map & content packs

## 📋 Quick Start

### Prerequisites

```bash
# Node.js 18+ required
node --version

# Environment variables
cp .env.example .env
```

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the unified platform.

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_anthropic_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Optional (for durable workflows)
UPSTASH_WORKFLOW_URL=your_upstash_url
UPSTASH_WORKFLOW_TOKEN=your_upstash_token
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│         AI Game Development Platform v3.0           │
└─────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Workflow    │  │  AI Agents   │  │  NPC Content │
│  Builder     │  │  (Event)     │  │  Pipeline    │
└──────────────┘  └──────────────┘  └──────────────┘
```

## 📚 Documentation

- **[UNIFIED_PLATFORM.md](./UNIFIED_PLATFORM.md)** - Complete platform overview and integration guide
- **[EVENT_DRIVEN_AGENTS.md](./EVENT_DRIVEN_AGENTS.md)** - Event-driven agent architecture
- **[WORKFLOW_INTEGRATION.md](./WORKFLOW_INTEGRATION.md)** - Workflow builder documentation
- **[AI_AGENTS.md](./AI_AGENTS.md)** - AI agents system details
- **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)** - Integration overview

## 🎯 Key Routes

- `/` - Unified platform homepage with navigation
- `/workflow-studio` - Visual workflow builder
- `/agents` - AI agent dashboard
- Sidebar navigation for all NPC tools

## 🔧 API Endpoints

### Workflows
- `POST /api/workflow/execute` - Execute workflow
- `POST /api/workflow/voice-config` - Configure voice
- `POST /api/workflow/export` - Export results

### Event-Driven Agents (v2)
- `POST /api/agents-v2/session` - Initialize session
- `POST /api/agents-v2/stream` - Stream decision-making
- `GET /api/agents-v2/logs` - Download XML logs

### Legacy Agents (v1)
- `POST /api/agents/create` - Create agent config
- `POST /api/agents/session` - Create session
- `POST /api/agents/stream` - Stream gameplay

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript
- **UI**: React 19, TailwindCSS, Radix UI
- **AI**: Anthropic Claude (Sonnet 4.5), AI SDK 5
- **Workflow**: React Flow, Workflow DevKit
- **Voice**: ElevenLabs API
- **Data**: XML (fast-xml-parser), Zod validation

## 📦 Project Structure

```
/app
  /api
    /workflow       # Workflow execution API
    /agents-v2      # Event-driven agents API
    /agents         # Legacy agents API
  /workflow-studio  # Workflow builder page
  /agents           # AI agents dashboard
  page.tsx          # Unified platform homepage

/lib
  /agents
    event-driven-engine.ts  # Core agent engine
    event-logger.ts         # XML event logging
    providers.ts            # Context providers
    evaluators.ts           # Learning evaluators
    prompt-templates.ts     # Template system
    tools.ts                # Game action tools
  /workflow
    executor.ts             # Workflow executor
    types.ts                # Type definitions
  /elevenlabs
    client.ts               # ElevenLabs integration

/components
  /workflow-nodes           # Custom workflow nodes
  /ui                       # Shared UI components
  npc-generator.tsx         # NPC generation
  layered-quest-builder.tsx # Quest builder
  [other NPC tools...]      # Various tools
```

## 🎮 Example Usage

### Create Event-Driven Agent

```typescript
// Initialize session
const response = await fetch('/api/agents-v2/session', {
  method: 'POST',
  body: JSON.stringify({
    agentConfig: {
      id: 'agent_1',
      model: 'claude-sonnet-4.5',
      personality: {
        name: 'Explorer',
        playStyle: 'explorer',
        riskTolerance: 0.7
      }
    },
    gameState: { /* initial state */ }
  })
})

const { sessionId } = await response.json()

// Stream decision-making
const eventSource = new EventSource(`/api/agents-v2/stream?sessionId=${sessionId}`)

eventSource.onmessage = (event) => {
  const chunk = JSON.parse(event.data)
  console.log(chunk.type, chunk.content)
}
```

### Design Workflow

```typescript
const workflow = {
  nodes: [
    { type: 'ai-generation', config: { prompt: 'Create merchant NPC' } },
    { type: 'voice-config', config: { voiceId: 'john_doe' } },
    { type: 'export', config: { format: 'unity' } }
  ],
  edges: [/* connections */]
}

await executeWorkflow(workflow)
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📈 Version History

- **v3.0.0** (2025-11-13) - Unified platform with all three systems integrated
- **v2.0.0** - Event-driven agents with ElizaOS-inspired architecture
- **v1.1.0** - Workflow builder integration
- **v1.0.0** - Initial NPC content pipeline

## 🤝 Contributing

See [UNIFIED_PLATFORM.md](./UNIFIED_PLATFORM.md) for contribution guidelines.

## 📄 License

Proprietary - Pipeline Development Team

---

**Built with** ❤️ **by the Pipeline Development Team**
