"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type ModelOption = {
  value: string
  label: string
  provider: string
  cost: "$" | "$$" | "$$$"
  speed: "Fast" | "Medium" | "Slow"
  quality: "Good" | "Excellent" | "Best"
}

export const AI_MODELS: ModelOption[] = [
  {
    value: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "OpenAI",
    cost: "$",
    speed: "Fast",
    quality: "Good",
  },
  {
    value: "openai/gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    cost: "$$",
    speed: "Medium",
    quality: "Excellent",
  },
  {
    value: "anthropic/claude-sonnet-4",
    label: "Claude Sonnet 4",
    provider: "Anthropic",
    cost: "$$",
    speed: "Medium",
    quality: "Excellent",
  },
  {
    value: "anthropic/claude-opus-4",
    label: "Claude Opus 4",
    provider: "Anthropic",
    cost: "$$$",
    speed: "Slow",
    quality: "Best",
  },
  {
    value: "xai/grok-2-fast",
    label: "Grok 2 Fast",
    provider: "xAI",
    cost: "$",
    speed: "Fast",
    quality: "Good",
  },
]

interface SelectModelProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function SelectModel({ value, onValueChange, placeholder = "Select model...", className }: SelectModelProps) {
  const [open, setOpen] = React.useState(false)

  const selectedModel = AI_MODELS.find((model) => model.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedModel ? (
            <div className="flex items-center gap-2">
              <span>{selectedModel.label}</span>
              <span className="text-xs text-muted-foreground">
                {selectedModel.cost} • {selectedModel.speed} • {selectedModel.quality}
              </span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-card border-border">
        <Command className="bg-card">
          <CommandInput placeholder="Search models..." className="bg-background" />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {AI_MODELS.map((model) => (
                <CommandItem
                  key={model.value}
                  value={model.value}
                  onSelect={(currentValue: string) => {
                    onValueChange?.(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === model.value ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{model.label}</span>
                      <span className="text-xs text-muted-foreground">{model.provider}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Cost: {model.cost}</span>
                      <span>Speed: {model.speed}</span>
                      <span>Quality: {model.quality}</span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
