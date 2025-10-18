"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw, User, Bot } from "lucide-react"
import type { SimulationEvent } from "@/lib/npc-types"

type Message = {
  id: string
  sender: "player" | "npc"
  text: string
  timestamp: number
}

export function NPCSimulator() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [events, setEvents] = useState<SimulationEvent[]>([])
  const [currentNPC, _setCurrentNPC] = useState({
    personality: {
      name: "Test Merchant",
      archetype: "merchant",
      traits: ["friendly", "helpful"],
      goals: ["sell goods"],
      moralAlignment: "neutral-good",
    },
    dialogues: [
      {
        id: "greeting",
        text: "Greetings, traveler! I am here to assist you. What brings you to my shop today?",
        responses: [],
      },
    ],
  })

  const handleStart = () => {
    setIsRunning(true)
    const welcomeMsg: Message = {
      id: crypto.randomUUID(),
      sender: "npc",
      text: currentNPC.dialogues.find((d) => d.id === "greeting")?.text || "Greetings, traveler!",
      timestamp: Date.now(),
    }
    setMessages([welcomeMsg])

    const event: SimulationEvent = {
      timestamp: Date.now(),
      type: "dialogue",
      npcId: "test_npc",
      playerId: "test_player",
      data: { action: "greeting" },
    }
    setEvents([event])
  }

  const handleReset = () => {
    setMessages([])
    setEvents([])
    setIsRunning(false)
    setInput("")
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const playerMsg: Message = {
      id: crypto.randomUUID(),
      sender: "player",
      text: input,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, playerMsg])
    const playerInput = input
    setInput("")

    try {
      const response = await fetch("/api/simulate-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npcScript: currentNPC, playerInput }),
      })

      if (!response.ok) {
        throw new Error("Simulation failed")
      }

      const data = await response.json()

      const npcMsg: Message = {
        id: crypto.randomUUID(),
        sender: "npc",
        text: data.response,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, npcMsg])

      const event: SimulationEvent = {
        timestamp: Date.now(),
        type: "dialogue",
        npcId: "test_npc",
        playerId: "test_player",
        data: { playerInput, npcResponse: npcMsg.text },
      }
      setEvents((prev) => [...prev, event])
    } catch (error) {
      console.error("Simulation error:", error)
      const npcMsg: Message = {
        id: crypto.randomUUID(),
        sender: "npc",
        text: "That's an interesting request! Let me think about how I can help you with that.",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, npcMsg])
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-6 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Simulation Console</h3>
          <div className="flex gap-2">
            <Button
              onClick={handleStart}
              disabled={isRunning}
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
            <Button
              onClick={handleReset}
              size="sm"
              variant="outline"
              className="border-border text-foreground bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px] rounded-lg border border-border bg-background p-4 mb-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">Click "Start" to begin the simulation</div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender === "player" ? "justify-end" : "justify-start"}`}>
                {msg.sender === "npc" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender === "player" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
                {msg.sender === "player" && (
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!isRunning}
            className="bg-background border-border text-foreground"
          />
          <Button
            onClick={handleSend}
            disabled={!isRunning || !input.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Send
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-border bg-card">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Event Log</h3>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {events.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No events yet</p>}
            {events.map((event, idx) => (
              <div key={idx} className="p-3 bg-secondary rounded border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs border-primary text-primary">
                    {event.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">NPC: {event.npcId}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}
