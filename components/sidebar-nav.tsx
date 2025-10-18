"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  FlaskConical,
  Library,
  BarChart3,
  Layers,
  Database,
  BookOpen,
  Users,
  GitBranch,
  MessageSquare,
  Map,
  ChevronRight,
} from "lucide-react"

interface NavItem {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { value: "generator", label: "AI Generator", icon: Sparkles },
  { value: "quest-builder", label: "Quest Builder", icon: Layers },
  { value: "lore", label: "Lore Manager", icon: BookOpen },
  { value: "relationships", label: "Relationships", icon: Users },
  { value: "flow", label: "Quest Flow", icon: GitBranch },
  { value: "dialogue", label: "Dialogue Trees", icon: MessageSquare },
  { value: "context", label: "Context Tools", icon: Database },
  { value: "simulator", label: "NPC Simulator", icon: FlaskConical },
  { value: "library", label: "Script Library", icon: Library },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "world-map", label: "World Map", icon: Map },
]

interface SidebarNavProps {
  activeTab: string
  onTabChange: (value: string) => void
}

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-[73px] h-[calc(100vh-73px)] bg-card/40 backdrop-blur-xl z-40 transition-all duration-300 ease-in-out shadow-2xl",
          isHovered ? "w-64" : "w-0",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <nav className="flex flex-col gap-1.5 p-4 h-full overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.value

            return (
              <button
                key={item.value}
                onClick={() => onTabChange(item.value)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  "hover:bg-accent/10 hover:text-accent-foreground hover:scale-[1.02]",
                  isActive && "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Hover trigger area */}
      <div
        className="fixed left-0 top-[73px] w-1 h-[calc(100vh-73px)] z-50 cursor-pointer hover:bg-primary/20 transition-colors"
        onMouseEnter={() => setIsHovered(true)}
      />
    </>
  )
}
