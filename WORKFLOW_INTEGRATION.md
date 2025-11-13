# Workflow Studio Integration

This document describes the integration of React Flow, Workflow DevKit, and ElevenLabs into the NPC Content Pipeline.

## Overview

The Workflow Studio provides a visual workflow builder for designing custom NPC generation pipelines with:
- **React Flow**: Visual node-based workflow editor
- **Workflow DevKit**: Durable, long-running workflow execution
- **ElevenLabs**: Voice generation and conversational AI agents

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Flow UI Layer                       │
│  • Visual Workflow Builder (/workflow-studio)               │
│  • Custom nodes: AI, Voice, Export, Trigger, Conditional    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                Workflow DevKit Layer                         │
│  • Durable workflow orchestration                           │
│  • State persistence & retry logic                          │
│  • Long-running process management                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┬────────────────┐
        ▼                   ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────────┐
│  Anthropic   │  │  ElevenLabs  │  │  Existing DB    │
│    Claude    │  │    Agents    │  │   & Cache       │
│  (Text Gen)  │  │  (Voice AI)  │  │  (PostgreSQL)   │
└──────────────┘  └──────────────┘  └─────────────────┘
```

## Components

### 1. React Flow Components

#### WorkflowBuilder (`components/workflow-builder.tsx`)
Main visual workflow builder component with drag-and-drop interface.

**Features:**
- Drag-and-drop node placement
- Visual connection editing
- Workflow save/load
- Real-time execution
- Export to JSON

#### Custom Nodes (`components/workflow-nodes/`)
- **AIGenerationNode**: AI-powered text generation with Claude
- **VoiceConfigNode**: ElevenLabs voice configuration
- **ExportNode**: Multi-format export (Unity, Unreal, Godot, ElizaOS)
- **TriggerNode**: Workflow entry points
- **ConditionalNode**: Branching logic

### 2. Workflow DevKit Integration

#### Durable Workflows (`lib/workflow/durable-workflow.ts`)

**npcGenerationWorkflow**: Main durable workflow for NPC generation
- Stages: Personality → Quest Hooks → Dialogue → Voice → Export
- Automatic retries on failure
- State persistence across deployments
- Rate limiting between stages

**batchNPCGenerationWorkflow**: Batch processing workflow
- Process multiple NPCs in sequence
- Pause/resume support
- Progress tracking

#### Workflow Executor (`lib/workflow/executor.ts`)
Orchestrates node execution for React Flow workflows.

**Features:**
- Topological execution order
- Result passing between nodes
- Error handling and recovery
- Execution state tracking

### 3. ElevenLabs Integration

#### ElevenLabs Client (`lib/elevenlabs/client.ts`)

**Voice Generation:**
- `generateSpeech()`: Text-to-speech generation
- `getVoices()`: List available voices
- `generateNPCVoicePreview()`: Generate sample NPC dialogue

**Agent Management:**
- `createAgent()`: Create conversational AI agent
- `createNPCAgent()`: Create NPC-specific agent
- `updateAgent()`: Update agent configuration
- `deleteAgent()`: Remove agent

### 4. API Routes

All workflow API routes are under `/api/workflow/`:

#### `/api/workflow/ai-generate`
AI text generation endpoint using Claude.

**Input:**
```json
{
  "model": "claude-sonnet-4-5",
  "prompt": "Create a mysterious tavern keeper",
  "temperature": 0.7,
  "systemPrompt": "You are an expert game writer",
  "context": {} // Previous workflow results
}
```

**Output:**
```json
{
  "success": true,
  "text": "Generated content...",
  "usage": { "promptTokens": 100, "completionTokens": 200 }
}
```

#### `/api/workflow/voice-config`
Configure ElevenLabs voice for an NPC.

**Input:**
```json
{
  "voiceConfig": {
    "voiceId": "voice_id_here",
    "stability": 0.5,
    "similarityBoost": 0.75
  },
  "npcData": {
    "name": "Tavern Keeper",
    "personality": "Gruff but kind",
    "backstory": "Former adventurer..."
  }
}
```

**Output:**
```json
{
  "success": true,
  "voiceId": "voice_id_here",
  "agent": {
    "agentId": "agent_id_here",
    "url": "https://elevenlabs.io/app/conversational-ai/agent/..."
  },
  "preview": {
    "sampleText": "Greetings, traveler...",
    "audioAvailable": true
  }
}
```

#### `/api/workflow/export`
Export NPC to multiple formats.

**Input:**
```json
{
  "exportConfig": {
    "formats": ["unity", "elizaos"],
    "includeVoice": true
  },
  "workflowResults": {
    // Complete NPC data
  }
}
```

**Output:**
```json
{
  "success": true,
  "exports": {
    "unity": { /* Unity-formatted data */ },
    "elizaos": { /* ElizaOS character data */ }
  }
}
```

#### `/api/workflow/execute`
Execute a complete workflow.

**Input:**
```json
{
  "nodes": [...], // React Flow nodes
  "edges": [...], // React Flow edges
  "input": {
    "prompt": "Create an NPC",
    "archetype": "merchant"
  }
}
```

**Output:**
```json
{
  "success": true,
  "executionId": "exec_123_abc",
  "status": "completed",
  "results": { /* All node results */ },
  "duration": 5000
}
```

## Usage

### 1. Access the Workflow Studio

Navigate to `/workflow-studio` to access the visual workflow builder.

### 2. Design a Workflow

1. Drag nodes from the panel onto the canvas
2. Connect nodes by dragging from output handles to input handles
3. Configure each node by selecting it
4. Save your workflow for reuse

### 3. Execute a Workflow

1. Click the "Execute" button in the workflow builder
2. Monitor execution progress in real-time
3. View results in the "Execution Results" tab

### 4. Export Workflows

Export workflows as JSON for:
- Version control
- Sharing with team members
- Importing into other projects

## Example Workflows

### Basic NPC Generation

```
Trigger → AI Generation → Voice Config → Export
```

Creates a single NPC with personality, voice, and exports to Unity/ElizaOS.

### Batch Processing

```
Trigger → Loop → [AI Gen → Voice → Export] → Collect Results
```

Processes multiple NPCs from a CSV file.

### Conditional Workflow

```
Trigger → AI Gen → Conditional
                   ├─ If Merchant → Add Trade Items → Export
                   └─ If Warrior → Add Combat Stats → Export
```

Dynamic workflow with branching based on NPC type.

## Environment Variables

Add these to your `.env.local`:

```bash
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_api_key_here

# Workflow DevKit (uses existing Upstash Redis)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Database (already configured)
DATABASE_URL=your_database_url

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000 # or your production URL
```

## Database Schema

Optional table for storing workflow executions:

```sql
CREATE TABLE workflow_executions (
  id SERIAL PRIMARY KEY,
  workflow_run_id TEXT UNIQUE NOT NULL,
  npc_data JSONB NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_run_id ON workflow_executions(workflow_run_id);
CREATE INDEX idx_status ON workflow_executions(status);
CREATE INDEX idx_created_at ON workflow_executions(created_at DESC);
```

## Best Practices

### 1. Workflow Design
- Keep workflows focused on a single responsibility
- Use conditional nodes for dynamic branching
- Add appropriate wait times between AI calls
- Handle errors gracefully with try-catch nodes

### 2. Voice Configuration
- Test different voice IDs to find the best match
- Adjust stability (0-1) for consistency vs. expressiveness
- Use similarity_boost (0-1) to maintain voice characteristics
- Generate preview samples before committing

### 3. Performance
- Use batch processing for multiple NPCs
- Implement rate limiting between API calls
- Cache frequently used voice configurations
- Monitor workflow execution times

### 4. Error Handling
- Always include error nodes in critical paths
- Log failures for debugging
- Implement retry logic for transient failures
- Provide user feedback on errors

## Troubleshooting

### Workflow Fails to Execute
- Check API route availability
- Verify environment variables are set
- Review browser console for errors
- Check network tab for failed requests

### Voice Generation Issues
- Verify ELEVENLABS_API_KEY is valid
- Check voice ID exists
- Ensure API quota is not exceeded
- Review ElevenLabs API status

### Export Failures
- Verify export format is supported
- Check NPC data is complete
- Review export configuration
- Ensure storage permissions

## Future Enhancements

### Planned Features
- [ ] Workflow templates library
- [ ] Real-time collaboration
- [ ] Workflow versioning system
- [ ] Advanced analytics dashboard
- [ ] Custom node SDK
- [ ] Workflow marketplace
- [ ] Integration tests
- [ ] Performance monitoring

### Integration Opportunities
- Unity WebGL preview
- Voice conversation testing
- A/B testing for NPCs
- Player feedback integration
- Analytics and metrics
- Multi-language support

## Resources

- [React Flow Documentation](https://reactflow.dev/learn)
- [Workflow DevKit Documentation](https://useworkflow.dev)
- [ElevenLabs API Reference](https://elevenlabs.io/docs/api-reference/agents)
- [Anthropic Claude SDK](https://docs.anthropic.com/en/docs/welcome)

## Support

For issues or questions:
1. Check this documentation
2. Review the example workflows
3. Check browser console for errors
4. Review API route logs
5. Contact the development team

---

**Version:** 1.0.0
**Last Updated:** 2025-11-13
**Maintainer:** Pipeline Development Team
