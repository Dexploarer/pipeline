"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  FlaskConical,
  Library,
  BarChart3,
  Layers,
  BookOpen,
  Users,
  MessageSquare,
  Map,
  Workflow,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  Settings,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/workflows", label: "Workflow Builder", icon: Workflow },
  { href: "/agents", label: "AI Agents", icon: Bot },
  { href: "/generator", label: "AI Generator", icon: Sparkles },
  { href: "/quests", label: "Quest Builder", icon: Layers },
  { href: "/lore", label: "Lore Manager", icon: BookOpen },
  { href: "/relationships", label: "Relationships", icon: Users },
  { href: "/dialogue", label: "Dialogue Trees", icon: MessageSquare },
  { href: "/simulator", label: "NPC Simulator", icon: FlaskConical },
  { href: "/library", label: "Script Library", icon: Library },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/world", label: "World Map", icon: Map },
  { href: "/settings", label: "Settings", icon: Settings },
]

export { navItems }

interface DashboardSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-card/60 backdrop-blur-xl border-r border-border z-40 transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-accent/10 hover:text-accent-foreground",
                isActive && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn("w-full", collapsed ? "px-2" : "justify-start")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
