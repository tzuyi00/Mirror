"use client"

import React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import ChatBox from "@/components/ChatBox"
import Sidebar from "@/components/Sidebar"
import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createThread, healthz } from '@/lib/api'
import {
  User,
  Send,
  Bot,
  Sparkles,
  CheckCircle,
  AlertCircle,
  PanelLeftClose,
  GripVertical,
  Home,
  Settings,
  Bell,
  MessageSquare,
  BarChart3,
  HelpCircle,
  Trash2,
  Plus,
  Clock,
  ChevronRight,
  Brain,
  TrendingUp,
  Target,
  Lightbulb,
  MessageCircle,
  Users,
  ArrowLeft,
  BookOpen,
} from "lucide-react"

// Fixed test user ID for development - all operations will use this same user
const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface Memory {
  id: string
  type: "user" | "ai"
  content: string
  source: string
  timestamp: Date
  confidence: number
  category: string
}

export default function ProfilePage() {
  // Auth hooks must be first
  const { data: session, status } = useSession()
  const router = useRouter()

  // Then all state hooks
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const [navSidebarOpen, setNavSidebarOpen] = useState(true)
  const [chatboxOpen, setChatboxOpen] = useState(true)
  const [memoryModalOpen, setMemoryModalOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [newMemoryContent, setNewMemoryContent] = useState("")
  const [sectionMemories, setSectionMemories] = useState<Memory[]>([])
  const [currentView, setCurrentView] = useState<"overview" | "detail">("overview")
  const [detailSection, setDetailSection] = useState<string>("")
  const [inputMessage, setInputMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Hi! I'm your Profile Assistant. I've been learning about you through our conversations. Would you like me to update any section of your profile?",
      timestamp: new Date(),
      suggestions: ["Update skills", "Add recent experience", "Review interests"],
    },
  ])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX
      if (newWidth >= 300 && newWidth <= 600) {
        setSidebarWidth(newWidth)
      }
    },
    [isResizing],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Then all effect hooks
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    } else {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // Now handle conditional renders AFTER all hooks
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userId = session.user.id

  return (
    <div className="min-h-screen bg-[#172A3A] flex">


      <Sidebar
        navSidebarOpen={navSidebarOpen}
        onToggleSidebar={() => setNavSidebarOpen(!navSidebarOpen)}
        chatboxOpen={chatboxOpen}
        onOpenChatbox={() => setChatboxOpen(true)}
      />

      {/* <ChatBox
        chatboxOpen={chatboxOpen}
        sidebarWidth={sidebarWidth}
        userId={TEST_USER_ID}
        onClose={handleCloseChatbox}
        onMouseDown={handleMouseDown}
      /> */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 overflow-auto leading-7">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Main Page</h1>
        </div>
      </div>
    </div>
  )
}