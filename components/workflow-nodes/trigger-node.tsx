'use client'

import React from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Play, Zap } from 'lucide-react'

interface TriggerNodeData {
  label: string
  triggerType?: 'manual' | 'webhook' | 'schedule' | 'event'
}

export function TriggerNode({ data, selected }: NodeProps<TriggerNodeData>) {
  return (
    <Card
      className={`min-w-[250px] transition-all ${
        selected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Play className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{data.label}</h3>
            <Badge variant="secondary" className="text-xs mt-1">
              <Zap className="w-3 h-3 mr-1" />
              Trigger
            </Badge>
          </div>
        </div>

        {data.triggerType && (
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="font-medium text-foreground capitalize">{data.triggerType}</span>
            </div>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  )
}
