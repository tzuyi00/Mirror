"use client";

import React, { createContext, useContext } from "react";
import { useSession } from "next-auth/react";
import { useWebSocket } from "../hooks/useWebSocket";

interface WebSocketContextType {
  connected: boolean;
  reconnecting: boolean;
  showDisconnectIndicator: boolean;
  isOnline: boolean;
  threadId: string | undefined;
  thinking: boolean;
  lastReply: string | undefined;
  lastError: any;
  ai: any;
  isRequestTimedOut: boolean;
  lastInterviewQuestion: string | undefined;
  lastInterviewQuestionMsgId: string | undefined;
  interviewEnded: boolean;
  resetInterviewEnded: () => void;
  markInterviewEnded: () => void;
  sendUserMessage: (text: string) => boolean;
  sendInterviewMessage: (text: string, activityId?: string) => boolean;
  sendStartInterview: (resolvedThreadId: string, activityId: string) => boolean;
  cancelThinking: () => void;
  retryTimedOutRequest: (lastMessageText: string) => boolean;
  updateThreadId: (threadId: string | undefined) => void;
  close: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  // Get userId from NextAuth session
  const { data: session } = useSession();
  const userId = session?.user?.id;
  
  const wsHook = useWebSocket({ userId, waitForAuth: true });

  return (
    <WebSocketContext.Provider value={wsHook}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useSharedWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useSharedWebSocket must be used within WebSocketProvider");
  }
  return context;
}
