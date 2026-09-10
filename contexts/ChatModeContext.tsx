"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ChatMode = "impersonation" | "interviewer";

interface ChatModeContextType {
  mode: ChatMode;
  activityId: string | undefined;
  lastActivityId: string | undefined;  // Remember the last activity used for toggle

  switchToImpersonation: () => void;
  switchToInterviewer: (activityId: string) => void;
}

const ChatModeContext = createContext<ChatModeContextType | undefined>(undefined);

export interface ChatModeProviderProps {
  children: React.ReactNode;
}

/**
 * Provider for ChatMode context
 * Manages the current chat mode (Impersonation vs Interviewer)
 * and activity context when in Interviewer mode
 * 
 * Note: lastActivityId is used to remember which activity was last used,
 * so when toggling from impersonation back to interviewer, we can restore it.
 */
export function ChatModeProvider({ children }: ChatModeProviderProps) {
  const [mode, setMode] = useState<ChatMode>("impersonation");
  const [activityId, setActivityId] = useState<string | undefined>(undefined);
  const [lastActivityId, setLastActivityId] = useState<string | undefined>(undefined);

  const switchToImpersonation = useCallback(() => {
    console.log("[ChatModeContext] Switching to Impersonation mode");
    setMode("impersonation");
    // Keep activityId as undefined in impersonation mode, but remember it
    setActivityId(undefined);
  }, []);

  const switchToInterviewer = useCallback((newActivityId: string) => {
    console.log("[ChatModeContext] Switching to Interviewer mode", { activityId: newActivityId });
    setMode("interviewer");
    setActivityId(newActivityId);
    setLastActivityId(newActivityId);  // Remember this activity for future toggle
  }, []);

  const value: ChatModeContextType = {
    mode,
    activityId,
    lastActivityId,
    switchToImpersonation,
    switchToInterviewer,
  };

  return (
    <ChatModeContext.Provider value={value}>
      {children}
    </ChatModeContext.Provider>
  );
}

/**
 * Hook to use ChatMode context
 * Must be used within ChatModeProvider
 */
export function useChatMode() {
  const context = useContext(ChatModeContext);
  if (!context) {
    throw new Error("useChatMode must be used within ChatModeProvider");
  }
  return context;
}
