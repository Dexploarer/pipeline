'use client'

import React from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { GitBranch, Code } from 'lucide-react'

interface ConditionalNodeData {
  label: string
  condition?: string
  operator?: 'equals' | 'contains' | 'greaterThan' | 'lessThan'
}

export function ConditionalNode({ data, selected }: NodeProps<ConditionalNodeData>) {
  return (
    <Card
      className={`min-w-[250px] transition-all ${
        selected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <GitBranch className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{data.label}</h3>
            <Badge variant="secondary" className="text-xs mt-1">
              <Code className="w-3 h-3 mr-1" />
              Conditional
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          {data.operator && (
            <div className="flex justify-between">
              <span>Operator:</span>
              <span className="font-medium text-foreground">{data.operator}</span>
            </div>
          )}
          {data.condition && (
            <div className="mt-2 p-2 bg-muted rounded text-xs">
              <div className="font-medium mb-1">Condition:</div>
              <code className="text-[10px]">{data.condition}</code>
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="true" className="w-3 h-3" style={{ left: '33%' }} />
      <Handle type="source" position={Position.Bottom} id="false" className="w-3 h-3" style={{ left: '66%' }} />
    </Card>
  )
}
