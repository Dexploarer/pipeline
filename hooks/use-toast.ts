import { toast as sonnerToast } from "sonner"

export interface ToastOptions {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

export function toast({ title, description, variant, duration = 3000 }: ToastOptions): void {
  if (variant === "destructive") {
    sonnerToast.error(title ?? "Error", {
      description,
      duration,
    })
  } else {
    sonnerToast.success(title ?? "Success", {
      description,
      duration,
    })
  }
}
