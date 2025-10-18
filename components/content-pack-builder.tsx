"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Package, Trash2, Code, Eye } from "lucide-react"
import { ContentPackCategory } from "@/lib/types/content-pack"

interface ContentPackBuilderProps {
  onExport?: (packData: unknown) => void
}

export function ContentPackBuilder({ onExport }: ContentPackBuilderProps): React.ReactElement {
  const [packName, setPackName] = useState("")
  const [packDescription, setPackDescription] = useState("")
  const [packAuthor, setPackAuthor] = useState("")
  const [packCategory, setPackCategory] = useState<ContentPackCategory>(ContentPackCategory.DIALOGUE)
  const [packVersion, setPackVersion] = useState("1.0.0")
  const [packTags, setPackTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")

  // Component lists
  const [actions, setActions] = useState<Array<{ name: string; description: string }>>([])
  const [providers, setProviders] = useState<Array<{ name: string; description: string }>>([])
  const [evaluators, setEvaluators] = useState<Array<{ name: string; description: string }>>([])
  const [systems, setSystems] = useState<Array<{ name: string; description: string }>>([])
  const [stateManagers, setStateManagers] = useState<Array<{ name: string; description: string }>>([])

  const [viewMode, setViewMode] = useState<"builder" | "preview">("builder")

  const categories: ContentPackCategory[] = [
    ContentPackCategory.COMBAT,
    ContentPackCategory.DIALOGUE,
    ContentPackCategory.QUEST,
    ContentPackCategory.ECONOMY,
    ContentPackCategory.SOCIAL,
    ContentPackCategory.EXPLORATION,
    ContentPackCategory.CRAFTING,
    ContentPackCategory.MAGIC,
    ContentPackCategory.COMPANION,
    ContentPackCategory.UTILITY,
  ]

  const addTag = (): void => {
    if (currentTag && !packTags.includes(currentTag)) {
      setPackTags([...packTags, currentTag])
      setCurrentTag("")
    }
  }

  const removeTag = (tag: string): void => {
    setPackTags(packTags.filter(t => t !== tag))
  }

  const addAction = (): void => {
    setActions([...actions, { name: "", description: "" }])
  }

  const removeAction = (index: number): void => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const updateAction = (index: number, field: "name" | "description", value: string): void => {
    const updated = [...actions]
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value }
      setActions(updated)
    }
  }

  const addProvider = (): void => {
    setProviders([...providers, { name: "", description: "" }])
  }

  const removeProvider = (index: number): void => {
    setProviders(providers.filter((_, i) => i !== index))
  }

  const updateProvider = (index: number, field: "name" | "description", value: string): void => {
    const updated = [...providers]
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value }
      setProviders(updated)
    }
  }

  const addEvaluator = (): void => {
    setEvaluators([...evaluators, { name: "", description: "" }])
  }

  const removeEvaluator = (index: number): void => {
    setEvaluators(evaluators.filter((_, i) => i !== index))
  }

  const updateEvaluator = (index: number, field: "name" | "description", value: string): void => {
    const updated = [...evaluators]
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value }
      setEvaluators(updated)
    }
  }

  const addSystem = (): void => {
    setSystems([...systems, { name: "", description: "" }])
  }

  const removeSystem = (index: number): void => {
    setSystems(systems.filter((_, i) => i !== index))
  }

  const updateSystem = (index: number, field: "name" | "description", value: string): void => {
    const updated = [...systems]
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value }
      setSystems(updated)
    }
  }

  const addStateManager = (): void => {
    setStateManagers([...stateManagers, { name: "", description: "" }])
  }

  const removeStateManager = (index: number): void => {
    setStateManagers(stateManagers.filter((_, i) => i !== index))
  }

  const updateStateManager = (index: number, field: "name" | "description", value: string): void => {
    const updated = [...stateManagers]
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value }
      setStateManagers(updated)
    }
  }

  const handleExport = (): void => {
    const packData = {
      metadata: {
        id: `pack_${Date.now()}`,
        name: packName,
        version: packVersion,
        description: packDescription,
        author: packAuthor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: packTags,
        category: packCategory,
        dependencies: [],
        compatibility: {
          elizaVersion: "^1.0.0",
          hyperscrapeVersion: "^1.0.0",
        },
      },
      actions,
      providers,
      evaluators,
      systems,
      stateManagers,
    }

    if (onExport) {
      onExport(packData)
    }

    // Download as JSON
    const blob = new Blob([JSON.stringify(packData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${packName.replace(/\s+/g, "-").toLowerCase()}-content-pack.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const totalComponents = actions.length + providers.length + evaluators.length + systems.length + stateManagers.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Pack Builder</h2>
          <p className="text-sm text-muted-foreground">Create ElizaOS content packs for Hyperscape</p>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "builder" ? "default" : "outline"} onClick={() => setViewMode("builder")}>
            <Code className="h-4 w-4 mr-2" />
            Builder
          </Button>
          <Button variant={viewMode === "preview" ? "default" : "outline"} onClick={() => setViewMode("preview")}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {viewMode === "builder" ? (
        <Tabs defaultValue="metadata" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="actions">
              Actions
              {actions.length > 0 && <Badge variant="secondary" className="ml-2">{actions.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="providers">
              Providers
              {providers.length > 0 && <Badge variant="secondary" className="ml-2">{providers.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="evaluators">
              Evaluators
              {evaluators.length > 0 && <Badge variant="secondary" className="ml-2">{evaluators.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="systems">
              Systems
              {systems.length > 0 && <Badge variant="secondary" className="ml-2">{systems.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="state">
              State
              {stateManagers.length > 0 && <Badge variant="secondary" className="ml-2">{stateManagers.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metadata" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Pack Metadata</CardTitle>
                <CardDescription>Define the basic information for your content pack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pack-name">Pack Name</Label>
                    <Input
                      id="pack-name"
                      placeholder="My Content Pack"
                      value={packName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPackName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pack-version">Version</Label>
                    <Input
                      id="pack-version"
                      placeholder="1.0.0"
                      value={packVersion}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPackVersion(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pack-author">Author</Label>
                  <Input
                    id="pack-author"
                    placeholder="Your Name"
                    value={packAuthor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPackAuthor(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pack-description">Description</Label>
                  <Textarea
                    id="pack-description"
                    placeholder="Describe what this content pack does..."
                    value={packDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPackDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pack-category">Category</Label>
                  <Select value={packCategory} onValueChange={(value) => setPackCategory(value as ContentPackCategory)}>
                    <SelectTrigger id="pack-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pack-tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pack-tags"
                      placeholder="Add a tag..."
                      value={currentTag}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                    />
                    <Button onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {packTags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-2 hover:text-destructive">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Executable behaviors for your NPCs</CardDescription>
                  </div>
                  <Button onClick={addAction} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Action
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {actions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No actions defined yet</p>
                ) : (
                  actions.map((action, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`action-name-${index}`}>Action Name</Label>
                              <Input
                                id={`action-name-${index}`}
                                placeholder="attack, trade, craft..."
                                value={action.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAction(index, "name", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`action-desc-${index}`}>Description</Label>
                              <Textarea
                                id={`action-desc-${index}`}
                                placeholder="What does this action do?"
                                value={action.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateAction(index, "description", e.target.value)}
                                rows={2}
                              />
                            </div>
                          </div>
                          <Button variant="destructive" size="sm" onClick={() => removeAction(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Providers</CardTitle>
                    <CardDescription>Context injection for NPC responses</CardDescription>
                  </div>
                  <Button onClick={addProvider} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Provider
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {providers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No providers defined yet</p>
                ) : (
                  providers.map((provider, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`provider-name-${index}`}>Provider Name</Label>
                              <Input
                                id={`provider-name-${index}`}
                                placeholder="worldState, playerInventory..."
                                value={provider.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProvider(index, "name", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`provider-desc-${index}`}>Description</Label>
                              <Textarea
                                id={`provider-desc-${index}`}
                                placeholder="What context does this provide?"
                                value={provider.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateProvider(index, "description", e.target.value)}
                                rows={2}
                              />
                            </div>
                          </div>
                          <Button variant="destructive" size="sm" onClick={() => removeProvider(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluators" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Evaluators</CardTitle>
                    <CardDescription>Post-conversation analysis components</CardDescription>
                  </div>
                  <Button onClick={addEvaluator} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Evaluator
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {evaluators.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No evaluators defined yet</p>
                ) : (
                  evaluators.map((evaluator, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`evaluator-name-${index}`}>Evaluator Name</Label>
                              <Input
                                id={`evaluator-name-${index}`}
                                placeholder="sentimentAnalysis, questTrigger..."
                                value={evaluator.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEvaluator(index, "name", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`evaluator-desc-${index}`}>Description</Label>
                              <Textarea
                                id={`evaluator-desc-${index}`}
                                placeholder="What does this evaluator analyze?"
                                value={evaluator.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateEvaluator(index, "description", e.target.value)}
                                rows={2}
                              />
                            </div>
                          </div>
                          <Button variant="destructive" size="sm" onClick={() => removeEvaluator(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="systems" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Game Systems</CardTitle>
                    <CardDescription>World bridge components</CardDescription>
                  </div>
                  <Button onClick={addSystem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add System
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {systems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No game systems defined yet</p>
                ) : (
                  systems.map((system, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`system-name-${index}`}>System Name</Label>
                              <Input
                                id={`system-name-${index}`}
                                placeholder="combatSystem, inventorySystem..."
                                value={system.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSystem(index, "name", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`system-desc-${index}`}>Description</Label>
                              <Textarea
                                id={`system-desc-${index}`}
                                placeholder="What does this system manage?"
                                value={system.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSystem(index, "description", e.target.value)}
                                rows={2}
                              />
                            </div>
                          </div>
                          <Button variant="destructive" size="sm" onClick={() => removeSystem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="state" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>State Managers</CardTitle>
                    <CardDescription>Per-player state management</CardDescription>
                  </div>
                  <Button onClick={addStateManager} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add State Manager
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {stateManagers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No state managers defined yet</p>
                ) : (
                  stateManagers.map((manager, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`state-name-${index}`}>Manager Name</Label>
                              <Input
                                id={`state-name-${index}`}
                                placeholder="playerProgressState, combatState..."
                                value={manager.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStateManager(index, "name", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`state-desc-${index}`}>Description</Label>
                              <Textarea
                                id={`state-desc-${index}`}
                                placeholder="What state does this manage?"
                                value={manager.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateStateManager(index, "description", e.target.value)}
                                rows={2}
                              />
                            </div>
                          </div>
                          <Button variant="destructive" size="sm" onClick={() => removeStateManager(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Content Pack Preview</CardTitle>
            <CardDescription>Review your content pack before exporting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">{packName || "Untitled Pack"}</h3>
              <p className="text-sm text-muted-foreground">{packDescription || "No description provided"}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{packCategory}</Badge>
                <Badge variant="outline">v{packVersion}</Badge>
                {packTags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium">Actions</p>
                <p className="text-2xl font-bold">{actions.length}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium">Providers</p>
                <p className="text-2xl font-bold">{providers.length}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium">Evaluators</p>
                <p className="text-2xl font-bold">{evaluators.length}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium">Systems</p>
                <p className="text-2xl font-bold">{systems.length}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Total Components</p>
              <p className="text-3xl font-bold">{totalComponents}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => {
          // Reset form
          setPackName("")
          setPackDescription("")
          setPackAuthor("")
          setPackVersion("1.0.0")
          setPackTags([])
          setActions([])
          setProviders([])
          setEvaluators([])
          setSystems([])
          setStateManagers([])
        }}>
          Reset
        </Button>
        <Button onClick={handleExport} disabled={!packName || totalComponents === 0}>
          <Package className="h-4 w-4 mr-2" />
          Export Content Pack
        </Button>
      </div>
    </div>
  )
}
