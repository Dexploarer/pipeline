import type React from "react"
import type { Metadata } from "next"
// Temporarily commented out for build environments without network access
// Uncomment these lines when deploying to production with network access
// import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { SentryInit } from "@/components/sentry-init"
import "./globals.css"

// const geist = Geist({
//   subsets: ["latin"],
//   variable: "--font-geist"
// })
// const geistMono = Geist_Mono({
//   subsets: ["latin"],
//   variable: "--font-geist-mono"
// })

export const metadata: Metadata = {
  title: "AI Game Development Platform",
  description: "Unified platform for workflows, AI agents, and game content generation",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SentryInit />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="npc-pipeline-theme">
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
