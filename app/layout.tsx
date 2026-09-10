"use client";

import type React from "react"
import { Space_Grotesk } from "next/font/google"
import { DM_Sans } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"
import { WebSocketProvider } from "@/contexts/WebSocketContext"
import { ChatModeProvider } from "@/contexts/ChatModeContext"
import "../styles/globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <title>Me 2 - User Profile</title>
        <meta name="description" content="User profile dashboard for Me 2 project" />
        <meta name="generator" content="v0.app" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`font-sans ${dmSans.variable} ${spaceGrotesk.variable} ${GeistMono.variable}`}>
        <SessionProvider>
          <WebSocketProvider>
            <ChatModeProvider>
              <Suspense fallback={null}>{children}</Suspense>
              <Toaster />
              <Analytics />
            </ChatModeProvider>
          </WebSocketProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
