'use client'

import React from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Brain, Sparkles } from 'lucide-react'

interface AIGenerationNodeData {
  label: string
  model?: string
  prompt?: string
  temperature?: number
}

export function AIGenerationNode({ data, selected }: NodeProps<AIGenerationNodeData>) {
  return (
    <Card
      className={`min-w-[250px] transition-all ${
        selected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Brain className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{data.label}</h3>
            <Badge variant="secondary" className="text-xs mt-1">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Generation
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          {data.model && (
            <div className="flex justify-between">
              <span>Model:</span>
              <span className="font-medium text-foreground">{data.model}</span>
            </div>
          )}
          {data.temperature !== undefined && (
            <div className="flex justify-between">
              <span>Temperature:</span>
              <span className="font-medium text-foreground">{data.temperature}</span>
            </div>
          )}
          {data.prompt && (
            <div className="mt-2 p-2 bg-muted rounded text-xs">
              <div className="font-medium mb-1">Prompt:</div>
              <div className="line-clamp-2">{data.prompt}</div>
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  )
}
