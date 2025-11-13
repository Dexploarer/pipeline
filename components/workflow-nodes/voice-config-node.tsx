'use client'

import React from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Mic, Volume2 } from 'lucide-react'

interface VoiceConfigNodeData {
  label: string
  voiceId?: string
  stability?: number
  similarityBoost?: number
  model?: string
}

export function VoiceConfigNode({ data, selected }: NodeProps<VoiceConfigNodeData>) {
  return (
    <Card
      className={`min-w-[250px] transition-all ${
        selected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Mic className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{data.label}</h3>
            <Badge variant="secondary" className="text-xs mt-1">
              <Volume2 className="w-3 h-3 mr-1" />
              ElevenLabs Voice
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          {data.voiceId && (
            <div className="flex justify-between">
              <span>Voice ID:</span>
              <span className="font-medium text-foreground font-mono text-[10px]">
                {data.voiceId.slice(0, 8)}...
              </span>
            </div>
          )}
          {data.stability !== undefined && (
            <div className="flex justify-between">
              <span>Stability:</span>
              <span className="font-medium text-foreground">{data.stability}</span>
            </div>
          )}
          {data.similarityBoost !== undefined && (
            <div className="flex justify-between">
              <span>Similarity:</span>
              <span className="font-medium text-foreground">{data.similarityBoost}</span>
            </div>
          )}
          {data.model && (
            <div className="flex justify-between">
              <span>Model:</span>
              <span className="font-medium text-foreground">{data.model}</span>
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  )
}
