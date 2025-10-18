"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertTriangle, Play, Loader2 } from "lucide-react"

interface ValidationResult {
  category: string
  passed: number
  failed: number
  warnings: number
  tests: {
    name: string
    status: "pass" | "fail" | "warning"
    message: string
  }[]
}

export function ValidationSuite() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<ValidationResult[]>([])

  const runValidation = async () => {
    setRunning(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setResults([
      {
        category: "NPC Scripts",
        passed: 45,
        failed: 2,
        warnings: 3,
        tests: [
          { name: "Dialogue coherence", status: "pass", message: "All dialogues are coherent" },
          { name: "Quest availability", status: "fail", message: "2 quests have missing prerequisites" },
          { name: "Personality consistency", status: "warning", message: "3 NPCs have conflicting traits" },
        ],
      },
      {
        category: "Quest Logic",
        passed: 38,
        failed: 0,
        warnings: 1,
        tests: [
          { name: "Objective completability", status: "pass", message: "All objectives can be completed" },
          { name: "Reward balance", status: "warning", message: "Some rewards may be too generous" },
          { name: "Quest chain integrity", status: "pass", message: "All quest chains are valid" },
        ],
      },
      {
        category: "Lore Consistency",
        passed: 52,
        failed: 1,
        warnings: 0,
        tests: [
          { name: "Timeline consistency", status: "pass", message: "No timeline conflicts detected" },
          { name: "Faction relationships", status: "fail", message: "Conflicting faction allegiances found" },
          { name: "Historical accuracy", status: "pass", message: "All historical references are valid" },
        ],
      },
    ])
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Content Validation</h3>
          <Button onClick={runValidation} disabled={running}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Validation Suite
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{result.category}</h4>
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-500">
                      {result.passed} passed
                    </Badge>
                    {result.failed > 0 && <Badge variant="destructive">{result.failed} failed</Badge>}
                    {result.warnings > 0 && (
                      <Badge variant="secondary" className="bg-yellow-500">
                        {result.warnings} warnings
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress
                  value={(() => {
                    const total = result.passed + result.failed + result.warnings
                    return total === 0 ? 0 : (result.passed / total) * 100
                  })()}
                  className="mb-3"
                />
                <div className="space-y-2">
                  {result.tests.map((test, testIdx) => (
                    <div key={testIdx} className="flex items-start gap-2 text-sm">
                      {test.status === "pass" && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />}
                      {test.status === "fail" && <XCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                      {test.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-muted-foreground text-xs">{test.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
