"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="text-base text-muted-foreground">
          Configure your platform preferences and API connections
        </p>
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            API keys are stored as environment variables on the server. The values below are placeholders showing connection status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anthropic-key">Anthropic API Key</Label>
            <Input
              id="anthropic-key"
              type="password"
              placeholder="sk-ant-..."
              disabled
              value="••••••••••••••••"
            />
            <p className="text-xs text-muted-foreground">Set via ANTHROPIC_API_KEY environment variable</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              disabled
              value="••••••••••••••••"
            />
            <p className="text-xs text-muted-foreground">Set via OPENAI_API_KEY environment variable</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="elevenlabs-key">ElevenLabs API Key</Label>
            <Input
              id="elevenlabs-key"
              type="password"
              placeholder="xi-..."
              disabled
              value="••••••••••••••••"
            />
            <p className="text-xs text-muted-foreground">Set via ELEVENLABS_API_KEY environment variable</p>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Preference</CardTitle>
          <CardDescription>Choose your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">Click to toggle between light, dark, and system theme</span>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Platform information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Version:</span>
            <Badge variant="secondary">v3.0.0</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Framework:</span>
            <span className="text-sm">Next.js 15 + React 19</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Runtime:</span>
            <span className="text-sm">Bun</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
