'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import {
  Bot,
  Play,
  Pause,
  Square,
  Zap,
  Brain,
  Target,
  Activity,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { AgentConfig, AgentStreamChunk } from '@/lib/agents/types'

export default function AgentsPage() {
  const [agentConfig, setAgentConfig] = useState<Partial<AgentConfig>>({
    personality: {
      name: 'Explorer',
      traits: ['Curious', 'Strategic', 'Brave'],
      playStyle: 'exploratory',
      goals: {
        primaryGoal: 'Discover all locations and complete quests',
        secondaryGoals: ['Collect rare items', 'Level up efficiently'],
      },
      preferences: {
        riskTolerance: 0.6,
        explorationVsExploitation: 0.7,
        socialInteraction: 0.5,
        completionismLevel: 0.8,
      },
      systemPrompt: '',
    },
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.7,
    streaming: true,
  })

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [streamMessages, setStreamMessages] = useState<AgentStreamChunk[]>([])
  const [sessionStats, setSessionStats] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [streamMessages])

  const handleCreateAgent = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentConfig.personality),
      })

      const data = await response.json()

      if (data.success) {
        setAgentConfig(data.agent)

        // Initialize session with demo game state
        const sessionResponse = await fetch('/api/agents/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentConfig: data.agent,
            gameState: createDemoGameState(),
          }),
        })

        const sessionData = await sessionResponse.json()

        if (sessionData.success) {
          setSessionId(sessionData.session.id)
        }
      }
    } catch (error) {
      console.error('Failed to create agent:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleStartPlay = async (mode: 'single' | 'autonomous' = 'single') => {
    if (!sessionId) return

    setIsPlaying(true)
    setStreamMessages([])

    try {
      const response = await fetch('/api/agents/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          mode,
        }),
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              setStreamMessages((prev) => [...prev, data])
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Refresh session stats
      await refreshSessionStats()
    } catch (error) {
      console.error('Streaming error:', error)
    } finally {
      setIsPlaying(false)
    }
  }

  const handlePausePlay = async () => {
    if (!sessionId) return

    await fetch('/api/agents/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        action: 'pause',
      }),
    })

    setIsPlaying(false)
  }

  const handleStopPlay = async () => {
    if (!sessionId) return

    await fetch('/api/agents/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        action: 'end',
      }),
    })

    setSessionId(null)
    setIsPlaying(false)
    setStreamMessages([])
  }

  const refreshSessionStats = async () => {
    if (!sessionId) return

    const response = await fetch(`/api/agents/session?sessionId=${sessionId}`)
    const data = await response.json()

    if (data.success) {
      setSessionStats(data.session.statistics)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">AI Game Playing Agents</h1>
            <p className="text-muted-foreground mt-2">
              Create autonomous AI agents that can play games using Claude with streaming
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Bot className="w-5 h-5 mr-2" />
            Powered by AI SDK 5
          </Badge>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="w-4 h-4 text-purple-500" />
              Streaming LLM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Real-time decision making with Claude Sonnet 4.5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-blue-500" />
              Tool Calling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              8 game action tools for complete control
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-green-500" />
              Autonomous Play
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Agents play games independently
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Learning Loop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Reward-based action optimization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Agent</TabsTrigger>
          <TabsTrigger value="play">Play Game</TabsTrigger>
          <TabsTrigger value="monitor">Monitor & Stats</TabsTrigger>
        </TabsList>

        {/* Create Agent Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configure Your Agent</CardTitle>
              <CardDescription>
                Design an AI agent personality and play style
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Agent Name</Label>
                  <Input
                    placeholder="Explorer"
                    value={agentConfig.personality?.name || ''}
                    onChange={(e) =>
                      setAgentConfig({
                        ...agentConfig,
                        personality: {
                          ...agentConfig.personality!,
                          name: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Play Style</Label>
                  <Select
                    value={agentConfig.personality?.playStyle}
                    onValueChange={(value) =>
                      setAgentConfig({
                        ...agentConfig,
                        personality: {
                          ...agentConfig.personality!,
                          playStyle: value as any,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aggressive">Aggressive - Attack first</SelectItem>
                      <SelectItem value="cautious">Cautious - Careful approach</SelectItem>
                      <SelectItem value="exploratory">Exploratory - Discover everything</SelectItem>
                      <SelectItem value="efficient">Efficient - Optimize actions</SelectItem>
                      <SelectItem value="social">Social - Focus on NPCs</SelectItem>
                      <SelectItem value="completionist">Completionist - 100% completion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Risk Tolerance: {(agentConfig.personality?.preferences.riskTolerance || 0.5) * 100}%</Label>
                  <Slider
                    value={[(agentConfig.personality?.preferences.riskTolerance || 0.5) * 100]}
                    onValueChange={([value]) =>
                      setAgentConfig({
                        ...agentConfig,
                        personality: {
                          ...agentConfig.personality!,
                          preferences: {
                            ...agentConfig.personality!.preferences,
                            riskTolerance: value / 100,
                          },
                        },
                      })
                    }
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Exploration: {(agentConfig.personality?.preferences.explorationVsExploitation || 0.5) * 100}%</Label>
                  <Slider
                    value={[(agentConfig.personality?.preferences.explorationVsExploitation || 0.5) * 100]}
                    onValueChange={([value]) =>
                      setAgentConfig({
                        ...agentConfig,
                        personality: {
                          ...agentConfig.personality!,
                          preferences: {
                            ...agentConfig.personality!.preferences,
                            explorationVsExploitation: value / 100,
                          },
                        },
                      })
                    }
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Social Interaction: {(agentConfig.personality?.preferences.socialInteraction || 0.5) * 100}%</Label>
                  <Slider
                    value={[(agentConfig.personality?.preferences.socialInteraction || 0.5) * 100]}
                    onValueChange={([value]) =>
                      setAgentConfig({
                        ...agentConfig,
                        personality: {
                          ...agentConfig.personality!,
                          preferences: {
                            ...agentConfig.personality!.preferences,
                            socialInteraction: value / 100,
                          },
                        },
                      })
                    }
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Completionism: {(agentConfig.personality?.preferences.completionismLevel || 0.5) * 100}%</Label>
                  <Slider
                    value={[(agentConfig.personality?.preferences.completionismLevel || 0.5) * 100]}
                    onValueChange={([value]) =>
                      setAgentConfig({
                        ...agentConfig,
                        personality: {
                          ...agentConfig.personality!,
                          preferences: {
                            ...agentConfig.personality!.preferences,
                            completionismLevel: value / 100,
                          },
                        },
                      })
                    }
                    max={100}
                    step={5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Primary Goal</Label>
                <Input
                  placeholder="Discover all locations and complete quests"
                  value={agentConfig.personality?.goals.primaryGoal || ''}
                  onChange={(e) =>
                    setAgentConfig({
                      ...agentConfig,
                      personality: {
                        ...agentConfig.personality!,
                        goals: {
                          ...agentConfig.personality!.goals,
                          primaryGoal: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>

              <Button
                onClick={handleCreateAgent}
                disabled={isCreating}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Agent...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Create & Initialize Agent
                  </>
                )}
              </Button>

              {sessionId && (
                <Alert>
                  <Zap className="w-4 h-4" />
                  <AlertTitle>Agent Ready!</AlertTitle>
                  <AlertDescription>
                    Session ID: {sessionId}. Go to the "Play Game" tab to start.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Play Game Tab */}
        <TabsContent value="play" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Control Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Controls</CardTitle>
                <CardDescription>Control gameplay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!sessionId ? (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertTitle>No Active Session</AlertTitle>
                    <AlertDescription>
                      Create an agent first in the "Create Agent" tab.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleStartPlay('single')}
                        disabled={isPlaying}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Take Single Action
                      </Button>

                      <Button
                        onClick={() => handleStartPlay('autonomous')}
                        disabled={isPlaying}
                        className="w-full"
                        variant="secondary"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Start Autonomous Play
                      </Button>

                      <Button
                        onClick={handlePausePlay}
                        disabled={!isPlaying}
                        className="w-full"
                        variant="outline"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>

                      <Button
                        onClick={handleStopPlay}
                        className="w-full"
                        variant="destructive"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop Session
                      </Button>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Agent:</span>
                        <span className="font-medium">{agentConfig.personality?.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Style:</span>
                        <span className="font-medium capitalize">{agentConfig.personality?.playStyle}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={isPlaying ? 'default' : 'secondary'}>
                          {isPlaying ? 'Playing' : 'Idle'}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Agent Stream */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Agent Thinking Stream</CardTitle>
                <CardDescription>Real-time decision making process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] overflow-y-auto space-y-2 border rounded-lg p-4 bg-muted/20">
                  {streamMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Agent output will appear here...</p>
                    </div>
                  ) : (
                    streamMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg text-sm ${
                          msg.type === 'thought'
                            ? 'bg-purple-500/10 border border-purple-500/20'
                            : msg.type === 'tool_call'
                            ? 'bg-blue-500/10 border border-blue-500/20'
                            : msg.type === 'tool_result'
                            ? 'bg-green-500/10 border border-green-500/20'
                            : msg.type === 'error'
                            ? 'bg-red-500/10 border border-red-500/20'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="text-xs">
                            {msg.type}
                          </Badge>
                          <span className="flex-1">{msg.content}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessionStats?.totalActions || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {sessionStats?.actionsPerMinute.toFixed(1) || 0} per minute
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Reward</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessionStats?.totalReward.toFixed(1) || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {sessionStats?.averageReward.toFixed(2) || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((sessionStats?.successRate || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successful actions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sessionStats ? Math.floor(sessionStats.duration / 1000 / 60) : 0}m
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {sessionStats ? Math.floor((sessionStats.duration / 1000) % 60) : 0}s elapsed
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionId ? (
                <Button onClick={refreshSessionStats} variant="outline">
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh Statistics
                </Button>
              ) : (
                <p className="text-muted-foreground">No active session</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Demo game state for testing
function createDemoGameState() {
  return {
    sessionId: 'demo-' + Date.now(),
    environment: 'Forest Clearing',
    position: { x: 0, y: 0, z: 0 },
    visibleEntities: [
      {
        id: 'npc_merchant',
        type: 'merchant',
        position: { x: 5, y: 0, z: 0 },
        properties: { name: 'Friendly Merchant', friendly: true },
      },
      {
        id: 'enemy_goblin',
        type: 'goblin',
        position: { x: -8, y: 3, z: 0 },
        properties: { name: 'Goblin Scout', hostile: true, health: 50 },
      },
      {
        id: 'chest_treasure',
        type: 'treasure_chest',
        position: { x: 10, y: -2, z: 0 },
        properties: { locked: false, loot: ['gold', 'potion'] },
      },
    ],
    inventory: [
      { id: 'sword_iron', name: 'Iron Sword', quantity: 1 },
      { id: 'potion_health', name: 'Health Potion', quantity: 3 },
    ],
    stats: {
      health: 100,
      mana: 50,
      level: 5,
      experience: 450,
      gold: 100,
    },
    activeQuests: [
      {
        id: 'quest_explore',
        title: 'Explore the Forest',
        description: 'Discover all locations in the forest',
        objectives: [
          { description: 'Find the merchant', completed: false },
          { description: 'Defeat 5 goblins', completed: false, progress: 0, target: 5 },
          { description: 'Open treasure chests', completed: false, progress: 0, target: 3 },
        ],
      },
    ],
    availableActions: ['move', 'interact', 'attack', 'use_item', 'speak'],
    recentEvents: [
      {
        timestamp: new Date(),
        type: 'spawn',
        description: 'Agent spawned in Forest Clearing',
      },
    ],
  }
}
