import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { SentryInit } from "@/components/sentry-init"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist"
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono"
})

export const metadata: Metadata = {
  title: "NPC Content Pipeline",
  description: "AI-Powered Game Content Generation",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <SentryInit />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="npc-pipeline-theme">
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
