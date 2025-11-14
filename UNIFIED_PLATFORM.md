# AI Game Development Platform v3.0

## Overview

The **AI Game Development Platform** is a comprehensive, unified system that combines three powerful technologies into a single cohesive platform for game development:

1. **Visual Workflow Builder** - Design durable workflows with React Flow
2. **Event-Driven AI Agents** - Autonomous game-playing agents with ElizaOS-inspired architecture
3. **NPC Content Pipeline** - AI-powered content generation for NPCs, quests, and game worlds

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   AI Game Development Platform                   │
│                            (v3.0.0)                              │
└─────────────────────────────────────────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│  Workflow       │      │  AI Agents      │     │  NPC Content    │
│  Builder        │      │  (Event-Driven) │     │  Pipeline       │
└─────────────────┘      └─────────────────┘     └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│ • React Flow    │      │ • XML Events    │     │ • AI Generation │
│ • Workflow      │      │ • Providers     │     │ • Voice Synth   │
│   DevKit        │      │ • Evaluators    │     │ • Quest Builder │
│ • ElevenLabs    │      │ • Templates     │     │ • Lore Manager  │
└─────────────────┘      └─────────────────┘     └─────────────────┘
```

## System Integration

### How the Three Systems Work Together

1. **Workflows → Agents → NPCs**
   - Design workflows that orchestrate agent creation and NPC generation
   - Use workflow nodes to configure agent personalities and behaviors
   - Export agents and NPCs to multiple game engines

2. **Shared Event System**
   - All three systems use a unified event-driven architecture
   - XML-based event logging for complete auditability
   - Cross-system event subscriptions and messaging

3. **Unified API Gateway**
   - `/api/workflow/*` - Workflow execution and management
   - `/api/agents-v2/*` - Event-driven agent sessions
   - `/api/npc/*` - NPC generation and voice synthesis

## Core Technologies

### 1. Visual Workflow Builder

**Location**: `/workflow-studio`

**Technologies**:
- **React Flow** (@xyflow/react) - Visual node-based editor
- **Workflow DevKit** (@upstash/workflow) - Durable execution engine
- **ElevenLabs API** (elevenlabs) - Voice generation and synthesis

**Features**:
- Drag-and-drop workflow design
- 5 custom node types (AI Generation, Voice Config, Export, Trigger, Conditional)
- Durable execution with state persistence
- Multi-format export (Unity, Unreal, Godot, ElizaOS)

**Key Files**:
- `components/workflow-builder.tsx` - Main workflow editor
- `components/workflow-nodes/*.tsx` - Custom node implementations
- `lib/workflow/executor.ts` - Workflow execution engine
- `lib/elevenlabs/client.ts` - ElevenLabs API integration

**Documentation**: See `WORKFLOW_INTEGRATION.md`

### 2. Event-Driven AI Agents

**Location**: `/agents`

**Technologies**:
- **AI SDK 5** (ai) - Streaming text generation with tool calling
- **Claude Sonnet 4.5** (@ai-sdk/anthropic) - Advanced reasoning model
- **fast-xml-parser** - XML event logging

**Architecture Components**:

#### Event Logger (`lib/agents/event-logger.ts`)
- Logs 7 event types: game_state, action, thought, observation, reward, error, message
- XML-formatted structured logging
- Export capabilities for analysis

#### Providers (`lib/agents/providers.ts`)
5 providers inject context:
- **GameStateProvider** - Current game state
- **MemoryProvider** - Relevant memories
- **GoalProvider** - Current goals and objectives
- **PerformanceProvider** - Agent statistics
- **RecentEventsProvider** - Recent game events

#### Evaluators (`lib/agents/evaluators.ts`)
5 evaluators extract insights:
- **SuccessPatternEvaluator** - Identifies successful patterns
- **MistakeLearningEvaluator** - Learns from failures
- **GoalProgressEvaluator** - Tracks goal progress
- **RelationshipEvaluator** - Monitors NPC relationships
- **EfficiencyEvaluator** - Evaluates action efficiency

#### Prompt Templates (`lib/agents/prompt-templates.ts`)
6 templates for different scenarios:
- decision, exploration, combat, social, learning, goalPlanning

#### Event-Driven Engine (`lib/agents/event-driven-engine.ts`)
Core orchestrator with 12-step decision cycle:
1. Event occurs (game state change)
2. Event logged as XML
3. Providers gather context
4. Prompt compiled from template
5-6. LLM processes with streaming
7. Actions executed via tools
8. Evaluators extract insights
9-11. Learnings stored in memory
12. Providers updated

**Key Features**:
- XML event logging for complete auditability
- Provider context injection
- Evaluator-based learning
- Template-based prompt compilation
- Server-Sent Events (SSE) streaming
- 8 game action tools (move, interact, attack, use_item, speak, quest_action, inventory_action, wait)
- Memory system for knowledge retention

**Documentation**: See `EVENT_DRIVEN_AGENTS.md` and `AI_AGENTS.md`

### 3. NPC Content Pipeline

**Location**: `/` (main page with tabs)

**Features**:
- AI Script Generator
- Layered Quest Builder
- Lore Management
- Relationship Network
- Quest Flow Visualizer
- Dialogue Tree Editor
- Context Management
- NPC Simulator
- Script Library
- Analytics Dashboard
- World Map & Content Packs

**Key Components**:
- `components/npc-generator.tsx` - Main NPC generation interface
- `components/layered-quest-builder.tsx` - Multi-layer quest design
- `components/lore-manager.tsx` - Interconnected lore entries
- `components/relationship-graph.tsx` - NPC relationship visualization
- `components/quest-flow-visualizer.tsx` - Quest progression editor
- `components/dialogue-tree-editor.tsx` - Branching dialogue creation

**Voice Integration**:
- ElevenLabs API for static voice generation (no conversational streaming)
- NPCs receive voice-only generation
- For conversational AI, use the AI Agents system instead

## Navigation

The unified platform provides seamless navigation between all three systems:

### Main Homepage
- Navigate to different systems via sidebar navigation
- Hover on left edge to reveal navigation menu
- Default view: Workflow Builder

### System Routes
- `/` - Unified platform homepage with navigation
- `/workflow-studio` - Visual Workflow Builder
- `/agents` - AI Agent Dashboard
- All NPC tools accessible via sidebar tabs

## API Endpoints

### Workflow API (`/api/workflow/`)
- `POST /api/workflow/execute` - Execute a workflow
- `GET /api/workflow/status/:executionId` - Check workflow status
- `POST /api/workflow/voice-config` - Configure voice synthesis
- `POST /api/workflow/ai-generate` - Generate content with AI
- `POST /api/workflow/export` - Export workflow results

### Event-Driven Agents API (`/api/agents-v2/`)
- `POST /api/agents-v2/session` - Initialize agent session
- `GET /api/agents-v2/session?sessionId=...` - Get session status
- `PATCH /api/agents-v2/session` - Control session (pause/resume/end)
- `POST /api/agents-v2/stream` - Stream agent decision-making (SSE)
- `GET /api/agents-v2/logs?sessionId=...` - Download XML event logs

### Legacy Agents API (`/api/agents/`)
- `POST /api/agents/create` - Create agent configuration
- `POST /api/agents/session` - Create agent session
- `GET /api/agents/session?sessionId=...` - Get session status
- `POST /api/agents/stream` - Stream agent gameplay

### NPC API
- Various endpoints for NPC generation, voice synthesis, and content management

## Integration Examples

### Example 1: Workflow → Agent → NPC

```typescript
// 1. Create a workflow that generates an NPC with voice
const workflow = {
  nodes: [
    { type: 'ai-generation', config: { prompt: 'Create a tavern keeper NPC' } },
    { type: 'voice-config', config: { voiceId: 'john_doe', stability: 0.7 } },
    { type: 'export', config: { format: 'unity' } }
  ]
}

// 2. Execute workflow
const result = await executeWorkflow(workflow)

// 3. Create an AI agent to test the NPC
const agent = await createAgent({
  personality: { playStyle: 'explorer' }
})

// 4. Agent interacts with NPC in simulated environment
await startAgentSession(agent.id, {
  environment: 'Tavern',
  visibleEntities: [result.npc]
})
```

### Example 2: Event-Driven Agent with XML Logging

```typescript
// Initialize event-driven session
const session = await fetch('/api/agents-v2/session', {
  method: 'POST',
  body: JSON.stringify({ agentConfig, gameState })
})

// Stream agent decision-making
const eventSource = new EventSource(`/api/agents-v2/stream?sessionId=${sessionId}`)

eventSource.onmessage = (event) => {
  const chunk = JSON.parse(event.data)

  switch (chunk.type) {
    case 'thought':
      console.log('Agent thinking:', chunk.content)
      break
    case 'tool_call':
      console.log('Agent executing:', chunk.content)
      break
    case 'xml_logs':
      // Download complete XML event log
      console.log('XML logs:', chunk.data.xml)
      break
  }
}

// Download XML logs for analysis
const logs = await fetch(`/api/agents-v2/logs?sessionId=${sessionId}`)
const xmlContent = await logs.text()
```

### Example 3: Custom Provider and Evaluator

```typescript
// Create custom weather provider
class WeatherProvider implements Provider {
  name = 'weather'

  async get(sessionId: string): Promise<ProviderContext> {
    const weather = getCurrentWeather()

    return {
      providerName: this.name,
      xml: `<context type="weather">
        <condition>${weather.condition}</condition>
        <temperature>${weather.temp}</temperature>
      </context>`,
      priority: 6
    }
  }
}

// Create custom combat evaluator
class CombatEvaluator implements Evaluator {
  name = 'combatEfficiency'

  async evaluate(events: XMLEvent[], sessionId: string): Promise<EvaluationResult> {
    const combatEvents = events.filter(e =>
      e.type === 'action' && e.data.actionType === 'attack'
    )

    return {
      evaluatorName: this.name,
      insights: `<evaluation>
        <combatActions>${combatEvents.length}</combatActions>
      </evaluation>`,
      facts: [{
        type: 'combat_stats',
        content: `Engaged in ${combatEvents.length} combat actions`,
        confidence: 0.9
      }]
    }
  }
}

// Register with engine
engine.providers.register(new WeatherProvider())
engine.evaluators.register(new CombatEvaluator())
```

## Version History

### v3.0.0 (2025-11-13) - Unified Platform
- ✨ Integrated all three systems into single platform
- ✨ Unified navigation and homepage
- ✨ Consistent architecture across all systems
- 📝 Updated documentation for unified platform

### v2.0.0 - Event-Driven Agents
- ✨ Complete agent redesign with ElizaOS-inspired architecture
- ✨ XML event logging system
- ✨ Provider and evaluator patterns
- ✨ Template-based prompt compilation
- ✨ Memory system with learning

### v1.1.0 - Workflow Builder Integration
- ✨ React Flow visual workflow editor
- ✨ Workflow DevKit durable execution
- ✨ ElevenLabs voice synthesis integration
- ✨ Multi-format export capability

### v1.0.0 - Initial NPC Content Pipeline
- ✨ AI-powered NPC generation
- ✨ Quest builder and lore management
- ✨ Dialogue tree editor
- ✨ Relationship graph visualization

## Key Benefits

### 1. Unified Architecture
- Single platform for all game development AI needs
- Consistent event-driven design across systems
- Shared APIs and data models

### 2. Complete Auditability
- XML event logging throughout
- Full history of all agent decisions
- Export logs for external analysis

### 3. Modular & Extensible
- Plugin architecture for providers and evaluators
- Custom node types for workflows
- Template system for different scenarios

### 4. Production-Ready
- Durable execution with state persistence
- Error handling and recovery
- Streaming for responsive UX

### 5. Developer-Friendly
- Comprehensive documentation
- TypeScript throughout
- Clear API contracts

## Getting Started

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev
```

### Quick Start

1. **Explore the Platform**: Visit `/` to see the unified homepage
2. **Try Workflows**: Click "Open Workflow Studio" to design your first workflow
3. **Create an Agent**: Click "Open Agent Dashboard" to configure an AI agent
4. **Generate NPCs**: Use the sidebar to access NPC generation tools

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_anthropic_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Optional
UPSTASH_WORKFLOW_URL=your_upstash_url
UPSTASH_WORKFLOW_TOKEN=your_upstash_token
```

## Documentation

- **Main Platform**: `UNIFIED_PLATFORM.md` (this file)
- **Workflow Builder**: `WORKFLOW_INTEGRATION.md`
- **Event-Driven Agents**: `EVENT_DRIVEN_AGENTS.md`
- **AI Agents System**: `AI_AGENTS.md`
- **Integration Summary**: `INTEGRATION_SUMMARY.md`

## Architecture Diagrams

### Event Flow

```
User Action
    ↓
Event Logged (XML)
    ↓
Providers Gather Context
    ↓
Template Compiler
    ↓
LLM Decision (Streaming)
    ↓
Tool Execution
    ↓
Evaluators Extract Insights
    ↓
Memory Updated
    ↓
Result Returned
```

### Data Flow

```
┌──────────────┐
│  Game State  │ ──→ GameStateProvider ──→ Context
└──────────────┘

┌──────────────┐
│   Memories   │ ──→ MemoryProvider ──→ Context
└──────────────┘

┌──────────────┐
│    Goals     │ ──→ GoalProvider ──→ Context
└──────────────┘
                                ↓
                        PromptCompiler
                                ↓
                         LLM Decision
                                ↓
                         Tool Execution
                                ↓
                           Evaluators
                                ↓
                        Memory Storage
```

## Contributing

When adding new features to the unified platform:

1. Follow the event-driven architecture pattern
2. Use XML for structured data exchange
3. Create providers for context injection
4. Create evaluators for learning
5. Update all relevant documentation
6. Test integration with existing systems

## Support

For issues, questions, or feature requests:
- Check the documentation files
- Review the API endpoints
- Examine the example code
- Test with the provided workflows and agents

## License

Proprietary - Pipeline Development Team

---

**Version**: 3.0.0 (Unified Platform)
**Last Updated**: 2025-11-13
**Maintainer**: Pipeline Development Team
**Architecture**: Event-Driven, ElizaOS-Inspired
