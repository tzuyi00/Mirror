"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { PanelLeftClose, Bot, User, Home, MessageSquare, BarChart3, Bell, Settings, HelpCircle, Book, LogOut, CheckSquare } from "lucide-react"

export interface SidebarProps {
  navSidebarOpen: boolean
  onToggleSidebar: () => void
  chatboxOpen: boolean
  onOpenChatbox: () => void
}

const navigationItems = [
  {
    key: "profile",
    icon: <User className="w-4 h-4" />,
    title: "Profile",
    href: "/profile",
    activeColor: "bg-[#E59D23] text-[#172A3A] hover:bg-[#FF9500]",
    defaultColor: "text-white hover:text-[#A1EFFF] hover:bg-[#A0EFFF]/10",
  },
  {
    key: "activities",
    icon: <CheckSquare className="w-4 h-4" />,
    title: "Sync Activities",
    href: "/activities",
    activeColor: "bg-[#E59D23] text-[#172A3A] hover:bg-[#FF9500]",
    defaultColor: "text-white hover:text-[#A1EFFF] hover:bg-[#A0EFFF]/10",
  },
  {
    key: "documentation",
    icon: <Book className="w-4 h-4" />,
    title: "Documentation",
    href: "/docs",
    activeColor: "bg-[#E59D23] text-[#172A3A] hover:bg-[#FF9500]",
    defaultColor: "text-white hover:text-[#A1EFFF] hover:bg-[#A0EFFF]/10",
  },
]

const Sidebar: React.FC<SidebarProps> = ({
  navSidebarOpen,
  onToggleSidebar,
  chatboxOpen,
  onOpenChatbox,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Link = require("next/link").default
  const pathname = usePathname()
  const { data: session } = useSession()

  // Collapsed Sidebar
  if (!navSidebarOpen) {
    return (
      <div
        onClick={onToggleSidebar}
        className="w-12 bg-[#455769] border-r border-[#A0EFFF]/20 flex flex-col items-center py-4 cursor-pointer hover:bg-[#455769]/90 transition-colors"
      >
        {/* Logo */}
        <Link href="/">
          <div className="w-8 h-8 rounded-lg overflow-hidden mb-4">
            <img src="/logo.png" alt="AI Townhall" className="w-full h-full object-cover" />
          </div>
        </Link>

        {/* Navigation Icons */}
        <div className="flex flex-col gap-3 flex-1">
          {navigationItems.map((item) => {
            const isActive = pathname.startsWith(item.href)

            return (
              <Link href={item.href} key={item.key} passHref legacyBehavior>
                <Button
                  size="sm"
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-8 h-8 p-0 ${isActive ? item.activeColor : item.defaultColor}`}
                  title={item.title}
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.icon}
                </Button>
              </Link>
            )
          })}
          {/* Collapsed Sidebar & Collapsed Chat Box*/}
          {!chatboxOpen && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onOpenChatbox()
              }}
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 text-[#A0EFFF] hover:text-white hover:bg-[#A0EFFF]/20 border border-[#A0EFFF]/40 rounded-lg"
              title="Open Chat"
            >
              <Bot className="w-4 h-4" />
            </Button>
          )}
        </div>
        {/* Bottom Icons */}
        <div className="flex flex-col gap-3 mt-4">
          <Button
            size="sm"
            variant="ghost"
            className="w-8 h-8 p-0 text-white hover:text-[#A1EFFF] hover:bg-[#A0EFFF]/10"
            title="Settings"
            onClick={(e) => e.stopPropagation()}
          >
            <Settings className="w-4 h-4" />
          </Button>

          {/* Logout Button */}
          <Button
            size="sm"
            variant="ghost"
            className="w-8 h-8 p-0 text-white hover:text-red-400 hover:bg-red-400/10"
            title="Logout"
            onClick={(e) => {
              e.stopPropagation()
              signOut({ callbackUrl: '/auth/signin' })
            }}
          >
            <LogOut className="w-4 h-4" />
          </Button>

          {/* User Avatar */}
          <Avatar className="h-8 w-8 border border-[#A0EFFF]/30 mt-2">
            {session?.user?.image ? (
              <AvatarImage src={session.user.image} alt={session?.user?.name || "User"} />
            ) : null}
            <AvatarFallback className="bg-[#A0EFFF] text-[#172A3A] font-semibold text-xs">
              {session?.user?.name ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    )
  }

  // Expanded Sidebar
  return (
    <div className="w-64 bg-[#455769] border-r border-[#A0EFFF]/20 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-[#A0EFFF]/20">
        <div className="flex items-center gap-3">
          <Link href="/">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img src="/logo.png" alt="AI Townhall" className="w-full h-full object-cover" />
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <span className="font-heading font-semibold text-[#F8F4E4]">AI Townhall</span>
          </div>

          <Button
            onClick={onToggleSidebar}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-[#D4FAFF] hover:bg-[#D4FAFF]/10 shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname.startsWith(item.href)

            return (
              <Link href={item.href} key={item.key} passHref legacyBehavior>
                <Button
                  size="sm"
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${isActive ? item.activeColor : item.defaultColor}`}
                  title={item.title}
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.icon}
                  <span className="ml-2">{item.title}</span>
                </Button>
              </Link>
            )
          })}
          {/* Expanded Sidebar & Collapsed Chat Box */}
          {!chatboxOpen && (
            <>
              <div className="w-full h-px bg-[#A0EFFF]/30 my-3"></div>
              <Button
                onClick={onOpenChatbox}
                size="sm"
                variant="ghost"
                className="w-full justify-start gap-3 text-[#A0EFFF] hover:text-white hover:bg-[#A0EFFF]/20 border border-[#A0EFFF]/40 rounded-lg"
              >
                <Bot className="w-4 h-4" />
                Open Chat
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[#A0EFFF]/20">
        <div className="space-y-2">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-3 text-white hover:text-[#A1EFFF] hover:bg-[#A0EFFF]/10"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-3 text-white hover:text-[#A1EFFF] hover:bg-[#A0EFFF]/10"
          >
            <HelpCircle className="w-4 h-4" />
            Help & Support
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-3 text-white hover:text-red-400 hover:bg-red-400/10"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#A0EFFF]/20">
          <Avatar className="h-8 w-8 border border-[#A0EFFF]/30">
            {session?.user?.image ? (
              <AvatarImage src={session.user.image} alt={session?.user?.name || "User"} />
            ) : null}
            <AvatarFallback className="bg-[#A0EFFF] text-[#172A3A] font-semibold">
              {session?.user?.name ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#F8F4E4] truncate">{session?.user?.name || "User"}</p>
            <p className="text-xs text-[#D4FAFF]/70 truncate">{session?.user?.email || "email@example.com"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar