"use client"

import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GitBranch, GitCommit, GitMerge, Clock, User } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Version {
  id: string
  version: string
  author: string
  timestamp: string
  changes: string
  status: "current" | "archived" | "draft"
}

export function VersionControl() {
  const [versions, setVersions] = useState<Version[]>([
    {
      id: "v1",
      version: "2.1.0",
      author: "AI Generator",
      timestamp: "2 hours ago",
      changes: "Added new dialogue branches for merchant NPCs",
      status: "current",
    },
    {
      id: "v2",
      version: "2.0.5",
      author: "Game Designer",
      timestamp: "1 day ago",
      changes: "Updated quest rewards and balancing",
      status: "archived",
    },
    {
      id: "v3",
      version: "2.0.0",
      author: "AI Generator",
      timestamp: "3 days ago",
      changes: "Major overhaul of NPC personality system",
      status: "archived",
    },
  ])

  const handleCommit = () => {
    const buildNumber = versions.length + 1
    const newVersion: Version = {
      id: uuidv4(),
      version: `2.${buildNumber}.0`,
      author: "Game Designer",
      timestamp: "Just now",
      changes: "Manual commit of current changes",
      status: "current",
    }

    setVersions((prev) => [newVersion, ...prev.map((v) => ({ ...v, status: "archived" as const }))])

    toast({
      title: "Changes Committed",
      description: `Version ${newVersion.version} created successfully`,
    })
  }

  const handleCreateBranch = () => {
    toast({
      title: "Branch Created",
      description: "New experimental branch created from current version",
    })
  }

  const handleRestore = (version: Version) => {
    setVersions((prev) =>
      prev.map((v) => ({
        ...v,
        status: v.id === version.id ? "current" : "archived",
      })),
    )

    toast({
      title: "Version Restored",
      description: `Restored to version ${version.version}`,
    })
  }

  const handleCompare = (version: Version) => {
    toast({
      title: "Comparing Versions",
      description: `Showing differences between current and ${version.version}`,
    })
  }

  return (
    <Card className="p-6 border-border bg-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Version History</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCommit}>
            <GitCommit className="mr-2 h-4 w-4" />
            Commit Changes
          </Button>
          <Button variant="outline" size="sm" onClick={handleCreateBranch}>
            <GitMerge className="mr-2 h-4 w-4" />
            Create Branch
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {versions.map((version) => (
          <div
            key={version.id}
            className="p-4 rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-primary">{version.version}</span>
                <Badge variant={version.status === "current" ? "default" : "secondary"}>{version.status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRestore(version)}
                  disabled={version.status === "current"}
                >
                  Restore
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleCompare(version)}>
                  Compare
                </Button>
              </div>
            </div>
            <p className="text-sm text-foreground mb-3">{version.changes}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {version.author}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {version.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
