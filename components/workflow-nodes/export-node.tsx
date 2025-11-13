'use client'

import React from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Download, Package } from 'lucide-react'

interface ExportNodeData {
  label: string
  formats?: string[]
  includeVoice?: boolean
  includeAssets?: boolean
}

export function ExportNode({ data, selected }: NodeProps<ExportNodeData>) {
  return (
    <Card
      className={`min-w-[250px] transition-all ${
        selected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Download className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{data.label}</h3>
            <Badge variant="secondary" className="text-xs mt-1">
              <Package className="w-3 h-3 mr-1" />
              Export
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {data.formats && data.formats.length > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">Export Formats:</div>
              <div className="flex flex-wrap gap-1">
                {data.formats.map((format) => (
                  <Badge key={format} variant="outline" className="text-xs">
                    {format}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-2">
            {data.includeVoice && (
              <Badge variant="secondary" className="text-xs">
                <Mic className="w-3 h-3 mr-1" />
                Voice
              </Badge>
            )}
            {data.includeAssets && (
              <Badge variant="secondary" className="text-xs">
                <Package className="w-3 h-3 mr-1" />
                Assets
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  )
}
