"use client";

import Sidebar from "@/components/Sidebar"
import ChatBox from "@/components/ChatBox"
import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ProfileUpdateProvider } from "@/contexts/ProfileUpdateContext"
import { Memory, ProfileData } from "@/components/profile/types"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  suggestions?: string[]
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const [navSidebarOpen, setNavSidebarOpen] = useState(true)
  const [chatboxOpen, setChatboxOpen] = useState(true)

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Responsive behavior for Sidebar and ChatBox
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    function handleResize() {
      const isMobile = window.innerWidth <= 768
      
      console.log(
        'Resize detected, isMobile:', isMobile,
        'navSidebarOpen:', navSidebarOpen,
        'chatboxOpen:', chatboxOpen
      )

      if (isMobile) {
        // On small screens: close both sidebar and chatbox
        setNavSidebarOpen(false)
        setChatboxOpen(false)
      } else {
        // On large screens: open both sidebar and chatbox
        setNavSidebarOpen(true)
        setChatboxOpen(true)
      }
    }
    
    window.addEventListener('resize', handleResize)
    // Initial check
    console.log('Initial responsive check')
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, []) // Remove dependencies to avoid infinite loop

  // Callbacks
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return
      const sidebarPixelWidth = navSidebarOpen ? 256 : 48
      const newWidth = e.clientX - sidebarPixelWidth
      if (newWidth >= 300 && newWidth <= 900) {
        setSidebarWidth(newWidth)
      }
    },
    [isResizing, navSidebarOpen],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Setup document-level mouse event listeners for resize
  useEffect(() => {
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
  }, [isResizing, navSidebarOpen, handleMouseMove, handleMouseUp])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Don't render content if not authenticated
  if (!session) {
    return null
  }

  const userId = session.user.id
  const handleCloseChatbox = () => setChatboxOpen(false)

  return (
    <ProfileUpdateProvider>
      <div className="h-screen bg-[#172A3A] flex overflow-hidden">
        <Sidebar
          navSidebarOpen={navSidebarOpen}
          onToggleSidebar={() => setNavSidebarOpen(!navSidebarOpen)}
          chatboxOpen={chatboxOpen}
          onOpenChatbox={() => setChatboxOpen(true)}
        />

        <ChatBox
          chatboxOpen={chatboxOpen}
          sidebarWidth={sidebarWidth}
          userId={userId}
          onClose={handleCloseChatbox}
          onMouseDown={handleMouseDown}
        />

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {children}
        </div>

      </div>
    </ProfileUpdateProvider>
  )
}
