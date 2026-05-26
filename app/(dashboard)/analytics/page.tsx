"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Database,
  Server,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react"

type HealthData = {
  status: string
  timestamp: string
  version: string
  checks: {
    database: boolean
    cache: boolean
  }
}

export default function AnalyticsPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: HealthData) => {
        setHealth(data)
        setLoading(false)
      })
      .catch(() => {
        setError("Could not reach health endpoint")
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-base text-muted-foreground">
          System health, service status, and content generation metrics
        </p>
      </div>

      {/* System Health */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="w-4 h-4 text-green-500" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              ) : error ? (
                <Badge variant="destructive">Unreachable</Badge>
              ) : (
                <Badge variant={health?.status === "ok" ? "default" : "secondary"}>
                  {health?.status === "ok" ? "Healthy" : "Degraded"}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Database className="w-4 h-4 text-blue-500" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              ) : error ? (
                <Badge variant="destructive">Unknown</Badge>
              ) : (
                <Badge variant={health?.checks.database ? "default" : "secondary"}>
                  {health?.checks.database ? "Connected" : "Disconnected"}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Server className="w-4 h-4 text-purple-500" />
                Cache
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              ) : error ? (
                <Badge variant="destructive">Unknown</Badge>
              ) : (
                <Badge variant={health?.checks.cache ? "default" : "secondary"}>
                  {health?.checks.cache ? "Connected" : "Disconnected"}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4 text-orange-500" />
                Version
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              ) : error ? (
                <p className="text-sm text-muted-foreground">--</p>
              ) : (
                <p className="text-lg font-semibold">{health?.version ?? "unknown"}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Generation Metrics - Empty States */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Content Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                NPCs Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No data yet - generate some NPCs to see stats here
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="w-4 h-4 text-primary" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No data yet - run some generations to track response times
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="w-4 h-4 text-primary" />
                Quality Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No data yet - validation results will appear after content review
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Last Checked */}
      {health?.timestamp && (
        <p className="text-xs text-muted-foreground">
          Last checked: {new Date(health.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  )
}
