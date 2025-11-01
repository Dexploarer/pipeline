"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Loader2, Save } from "lucide-react"
import { NPC_TEMPLATES } from "@/lib/script-templates"
import type { NPCScript } from "@/lib/npc-types"
import { useNPCStore } from "@/lib/stores/npc-store"
import { toast } from "sonner"
import { SelectModel } from "@/components/select-model"

export function NPCGenerator(): React.ReactElement {
  const [generating, setGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [template, setTemplate] = useState<string>("quest-giver-merchant")
  const [model, setModel] = useState<string>("openai/gpt-4o-mini")
  const [generatedScript, setGeneratedScript] = useState<NPCScript | null>(null)

  const addNPC = useNPCStore((state) => state.addNPC)

  const handleGenerate = async () => {
    setGenerating(true)

    try {
      const response = await fetch("/api/generate-npc-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, archetype: template, model }),
      })

      if (!response.ok) {
        // Parse error from API
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || "Failed to generate NPC"

        // Handle specific error codes with user-friendly messages
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment and try again.")
        } else if (response.status === 400) {
          toast.error(`Invalid request: ${errorMessage}`)
        } else if (response.status === 500) {
          toast.error("Server error. Using fallback template instead.")
        } else if (response.status === 413) {
          toast.error("Request too large. Please reduce the prompt length.")
        } else {
          toast.error(errorMessage)
        }

        throw new Error(errorMessage)
      }

      const script = await response.json()
      setGeneratedScript(script)

      // Show different message for cached vs fresh generation
      if (script.cached) {
        toast.success("NPC generated successfully (from cache)!")
      } else {
        toast.success("NPC generated successfully!")
      }
    } catch (error) {
      console.error("Generation error:", error)

      // Handle network errors specifically
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        toast.error("Network error. Using fallback template instead.")
      }

      const baseTemplate = NPC_TEMPLATES[template]

      if (!baseTemplate || !baseTemplate.personality || !baseTemplate.behavior || !baseTemplate.elizaOSConfig) {
        toast.error("Invalid template selected")
        return
      }

      // Generate collision-resistant IDs
      const generateUUID = (): string => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID()
        }
        // Fallback: composite ID with timestamp and random string
        return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      }

      const script: NPCScript = {
        id: `npc_${generateUUID()}`,
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        personality: {
          ...baseTemplate.personality,
          name: prompt || baseTemplate.personality.name,
        },
        dialogues: [
          {
            id: "greeting",
            text: `Greetings, traveler! I am ${prompt || "a merchant"}. How may I assist you today?`,
            responses: [
              { text: "Tell me about yourself", nextNodeId: "backstory" },
              { text: "Do you have any quests?", nextNodeId: "quest_offer" },
              { text: "Goodbye", nextNodeId: "farewell" },
            ],
          },
        ],
        quests: [
          {
            id: `quest_${generateUUID()}`,
            title: "A Simple Task",
            description: "Help the NPC with a task",
            questGiver: prompt || "NPC",
            objectives: [{ type: "fetch", description: "Collect 5 herbs", quantity: 5 }],
            rewards: {
              experience: 100,
              gold: 50,
            },
            loreTags: ["introduction", "tutorial"],
          },
        ],
        behavior: baseTemplate.behavior,
        elizaOSConfig: baseTemplate.elizaOSConfig,
        metadata: {
          tags: ["generated", template],
          author: "AI Generator",
          testStatus: "draft",
        },
      }
      setGeneratedScript(script)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (generatedScript) {
      addNPC(generatedScript)
      toast.success("NPC saved to library!")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border bg-card">
        <div className="space-y-4">
          <div>
            <Label htmlFor="template" className="text-foreground">
              NPC Template
            </Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger id="template" className="mt-2 w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="quest-giver-merchant">Quest Giver (Merchant)</SelectItem>
                <SelectItem value="warrior-companion">Warrior Companion</SelectItem>
                <SelectItem value="mystic-lorekeeper">Mystic Lorekeeper</SelectItem>
                <SelectItem value="rogue-informant">Rogue Informant</SelectItem>
                <SelectItem value="noble-diplomat">Noble Diplomat</SelectItem>
                <SelectItem value="scholar-researcher">Scholar Researcher</SelectItem>
                <SelectItem value="commoner-farmer">Commoner Farmer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="model" className="text-foreground">
              AI Model
            </Label>
            <SelectModel value={model} onValueChange={setModel} placeholder="Select AI model..." className="mt-2" />
          </div>

          <div>
            <Label htmlFor="prompt" className="text-foreground">
              Generation Prompt
            </Label>
            <Textarea
              id="prompt"
              placeholder="Describe the NPC you want to create... (e.g., 'A grumpy blacksmith who lost his apprentice to a dragon attack')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-2 min-h-[100px] bg-background border-border text-foreground"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating NPC Script...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate NPC Script
              </>
            )}
          </Button>
        </div>
      </Card>

      {generatedScript && (
        <Card className="p-6 border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Generated Script</h3>
            <Button onClick={handleSave} variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save to Library
            </Button>
          </div>
          <Tabs defaultValue="personality" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-secondary">
              <TabsTrigger value="personality">Personality</TabsTrigger>
              <TabsTrigger value="dialogues">Dialogues</TabsTrigger>
              <TabsTrigger value="quests">Quests</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
            </TabsList>

            <TabsContent value="personality" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="text-foreground font-medium">{generatedScript.personality.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Archetype</Label>
                  <p className="text-foreground font-medium capitalize">{generatedScript.personality.archetype}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Moral Alignment</Label>
                  <p className="text-foreground font-medium">{generatedScript.personality.moralAlignment}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Traits</Label>
                  <p className="text-foreground">{generatedScript.personality.traits.join(", ")}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dialogues" className="mt-4">
              <div className="space-y-3">
                {generatedScript.dialogues.map((dialogue) => (
                  <div key={dialogue.id} className="p-4 bg-secondary rounded-lg border border-border">
                    <p className="text-foreground mb-3">{dialogue.text}</p>
                    <div className="space-y-2">
                      {dialogue.responses.map((response, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground pl-4 border-l-2 border-primary">
                          → {response.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quests" className="mt-4">
              <div className="space-y-4">
                {generatedScript.quests.map((quest) => (
                  <div key={quest.id} className="p-4 bg-secondary rounded-lg border border-border">
                    <h4 className="font-semibold text-foreground mb-2">{quest.title}</h4>
                    <p className="text-muted-foreground text-sm mb-3">{quest.description}</p>
                    <div className="space-y-2">
                      {quest.objectives.map((obj, idx) => (
                        <div key={idx} className="text-sm text-foreground">
                          • {obj.description} {obj.quantity && `(${obj.quantity})`}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                      Rewards: {quest.rewards.experience} XP, {quest.rewards.gold} Gold
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground mb-2 block">Daily Schedule</Label>
                  <div className="space-y-2">
                    {generatedScript.behavior.schedule.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 bg-secondary rounded border border-border">
                        <span className="font-mono text-sm text-primary">{item.time}</span>
                        <span className="text-foreground">{item.location}</span>
                        <span className="text-muted-foreground text-sm">({item.activity})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  )
}
