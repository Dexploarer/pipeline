"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sparkles, Layers, Workflow, Bot, Key, User, Compass, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const quickActions = [
  {
    href: "/generator",
    title: "Generate NPC",
    description: "Create AI-powered NPCs with personalities and dialogues",
    icon: Sparkles,
  },
  {
    href: "/quests",
    title: "Create Quest",
    description: "Build layered quests with branching objectives",
    icon: Layers,
  },
  {
    href: "/workflows",
    title: "Start Workflow",
    description: "Design visual pipelines for content generation",
    icon: Workflow,
  },
  {
    href: "/agents",
    title: "Launch Agent",
    description: "Deploy autonomous AI agents to play your game",
    icon: Bot,
  },
]

const gettingStartedSteps = [
  {
    title: "Connect your API key",
    description: "Add your Anthropic or OpenAI key in settings to enable AI generation",
    icon: Key,
  },
  {
    title: "Generate your first NPC",
    description: "Use the AI Generator to create a character with personality and dialogue",
    icon: User,
  },
  {
    title: "Create a quest",
    description: "Build a multi-layered quest with the Quest Builder",
    icon: Compass,
  },
  {
    title: "Launch an agent",
    description: "Deploy an AI agent to autonomously test your game content",
    icon: Zap,
  },
]

export default function DashboardHomePage() {
  const [healthStatus, setHealthStatus] = useState<"loading" | "online" | "offline">("loading")

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (res.ok) setHealthStatus("online")
        else setHealthStatus("offline")
      })
      .catch(() => setHealthStatus("offline"))
  }, [])

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground">
          Build, generate, and orchestrate game content with AI-powered tools.
        </p>
      </div>

      {/* System Status */}
      <div className="flex items-center gap-2">
        <Badge
          variant={healthStatus === "online" ? "default" : "secondary"}
          className="gap-1.5"
        >
          <span
            className={
              healthStatus === "online"
                ? "w-2 h-2 rounded-full bg-green-400 inline-block"
                : healthStatus === "offline"
                  ? "w-2 h-2 rounded-full bg-red-400 inline-block"
                  : "w-2 h-2 rounded-full bg-yellow-400 inline-block animate-pulse"
            }
          />
          {healthStatus === "online"
            ? "System Online"
            : healthStatus === "offline"
              ? "System Offline"
              : "Checking..."}
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{action.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Getting Started */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Getting Started</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {gettingStartedSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="font-medium text-sm">{step.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
