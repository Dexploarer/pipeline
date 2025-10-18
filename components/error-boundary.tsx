"use client"

import type React from "react"

import { Component, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[v0] Error caught by boundary:", error, errorInfo)
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="p-8 border-destructive bg-destructive/10">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
            </div>
            <Button onClick={() => this.setState({ hasError: false })} variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}
