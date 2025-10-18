import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // field-sizing-content is progressive enhancement - fallback to height: auto with vertical resize
        "supports-[field-sizing:content]:field-sizing-content [&:not(supports-[field-sizing:content])]:h-auto [&:not(supports-[field-sizing:content])]:resize-y [&:not(supports-[field-sizing:content])]:overflow-auto",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
