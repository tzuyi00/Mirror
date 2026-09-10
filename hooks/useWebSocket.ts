
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Default request timeout for AI responses (ms).
const DEFAULT_REQUEST_TIMEOUT_MS = 120000; // 2 minutes

type AIError = {
  code: string;
  message: string;
  retryable?: boolean;
  details?: unknown;
};

type AIMeta = {
  threadId: string;
  messageId?: string;
  createdAt: string;
  model?: string;
  latency_ms?: number;
};

type AICont = {
  type: "none" | "stream" | "paginate" | "followup_required";
  cursor?: string;
  hint?: string;
};

type MemoryOperationResult = {
  success: boolean;
  memoryId?: string;
  error?: string;
};

type MemoryOperation = {
  type: "create" | "update" | "delete";
  memoryId?: string;
  memContent?: string;
  categories?: string[];
};

// AI reply structure (main payload)
type AIReply = {
  ok: boolean;
  reply?: string;
  error?: AIError;
  meta: AIMeta;
  memoryOperations?: MemoryOperation[];
  operationResults?: MemoryOperationResult[];
  profileAutoUpdateTriggered?: boolean;
  profileAutoUpdateMessage?: string;
  profileData?: any;
};

// WebSocket server event types
type AckEvent = { type: "ack"; threadId: string };
type AIReplyEvent = { type: "ai_reply"; threadId: string } & AIReply;
type UpdateEvent = { type: "ai_update"; threadId: string } & AIReply;
type ErrorEvent = { type: "error"; code?: string; message: string };
type MemoryProcessedEvent = {
  type: "memory_processed";
  threadId: string;
  operationResults: MemoryOperationResult[];
  profileAutoUpdate?: {
    triggered: boolean;
    error?: string;
  };
};
type ProfileAutoUpdateEvent = { 
  type: "profile_auto_update"; 
  threadId: string;
  message: string;
  userId: string;
  timestamp: string;
  profileData?: any; // Complete profile data from backend
  // Include AI response fields (same as ai_update)
  reply?: string;
  ok: boolean;
  error?: AIError;
  meta: AIMeta;
  memoryOperations?: MemoryOperation[];
  operationResults?: MemoryOperationResult[];
};
type InterviewQuestionEvent = {
  type: "interview_question";
  threadId: string;
  question: string;
  questionMessageId: string;
};
type InterviewEndedEvent = {
  type: "interview_ended";
  threadId: string;
  userId?: string;
  activityId?: string;
};
type ServerEvent = AckEvent | AIReplyEvent | UpdateEvent | ErrorEvent | MemoryProcessedEvent | ProfileAutoUpdateEvent | InterviewQuestionEvent | InterviewEndedEvent;

// Options for customizing the WebSocket connection
export interface UseWebSocketOptions {
  url?: string; // Custom ws url
  initialThreadId?: string; // Use existing thread if available
  autoReconnect?: boolean; // Enable auto-reconnect (default: true)
  maxBackoffMs?: number; // Max backoff for reconnect (default: 15000)
  userId?: string;
  waitForAuth?: boolean; // If true, delay connection until userId is available (prevents anonymous threads)
  requestTimeoutMs?: number; // Timeout for AI response
}

export function useWebSocket(opts: UseWebSocketOptions = {}) {
  // Build WebSocket URL base from env or default
  const httpBase =
    process.env.NEXT_PUBLIC_SERVER_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3001";
  const baseWsUrl = (opts.url ?? (httpBase.replace(/^http/i, "ws") + "/ws"));

  // State for connection, thread, AI reply, errors, etc.
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [showDisconnectIndicator, setShowDisconnectIndicator] = useState(false); // Only show after persistent attempts
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true); // Network connection state
  const [threadId, setThreadId] = useState<string | undefined>(opts.initialThreadId);
  const [thinking, setThinking] = useState(false);
  const [lastReply, setLastReply] = useState<string | undefined>();
  const [lastError, setLastError] = useState<ErrorEvent | undefined>();
  const [ai, setAi] = useState<AIReply | undefined>(undefined);
  const [isRequestTimedOut, setIsRequestTimedOut] = useState(false); // Track if current request timed out
  const [lastInterviewQuestion, setLastInterviewQuestion] = useState<string | undefined>();
  const [lastInterviewQuestionMsgId, setLastInterviewQuestionMsgId] = useState<string | undefined>();
  const [interviewEnded, setInterviewEnded] = useState(false);

  // Refs for WebSocket instance and reconnect backoff
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(0);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout timer for pending request
  const pendingRequestIdRef = useRef<string>(''); // Track current request to prevent race conditions
  const testDisableReconnectRef = useRef(false); // TEST: Independent flag for testing
  const threadIdRef = useRef<string | undefined>(threadId); // Keep threadId in ref to avoid recreating connect()
  const prevUserIdRef = useRef<string | undefined>(undefined); // Track userId changes for reconnection
  // Always-current refs for waitForAuth guard — read inside connect() at call time
  const waitForAuthRef = useRef(opts.waitForAuth ?? false);
  const currentUserIdRef = useRef(opts.userId);

  // Sync always-current refs every render
  useEffect(() => {
    waitForAuthRef.current = opts.waitForAuth ?? false;
    currentUserIdRef.current = opts.userId;
  });
  
  // Sync threadId state to ref
  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);

  // Close the WebSocket connection
  const close = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
    
    // Clean up disconnect timer
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
    
    // Clean up request timeout timer
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }
  }, []);

  const handleRequestTimeout = useCallback(() => {
    console.log("[ws] Request timeout: AI server did not respond within timeout period");
    setThinking(false);
    setIsRequestTimedOut(true);
    setLastError({
      type: "error",
      code: "request_timeout",
      message: "AI server is not responding (over 2 minutes). Please retry your request.",
    } as ErrorEvent);
  }, []);

  const clearRequestTimeout = useCallback(() => {
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }
  }, []);

  const setRequestTimeout = useCallback((timeoutMs?: number) => {
    clearRequestTimeout();
  
    const timeout = timeoutMs ?? opts.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    console.log(`[ws] ⏱️ Setting request timeout to ${timeout}ms`);
    
    requestTimeoutRef.current = setTimeout(() => {
      handleRequestTimeout();
    }, timeout);
  }, [opts.requestTimeoutMs, clearRequestTimeout, handleRequestTimeout]);

  // Cancel the current pending AI response or cleanup stale request
  const cancelThinking = useCallback((requestType: 'cancel_request' | 'cleanup_stale_request' = 'cancel_request') => {
    // Clear timeout timer
    clearRequestTimeout();
    
    // Send cancel/cleanup message to backend
    const currentThreadId = threadIdRef.current;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentThreadId) {
      const cancelPayload = {
        type: requestType,
        threadId: currentThreadId,
      };
      console.log(`[ws] Sending ${requestType} to backend:`, cancelPayload);
      wsRef.current.send(JSON.stringify(cancelPayload));
    }
    
    setThinking(false);
    
    if (requestType === 'cancel_request') {
      // User-initiated cancel: reset timeout state and show cancelled error
      setIsRequestTimedOut(false);
      setLastError({
        type: "error",
        code: "user_cancelled",
        message: "Request cancelled by user",
      });
    }
    // For cleanup_stale_request (auto-triggered on timeout):
    // - Do NOT reset isRequestTimedOut → keeps Retry Banner visible
    // - Do NOT override lastError → handleRequestTimeout already set code='request_timeout'
    // - Only job here is to notify backend to delete the stale message from DB
  }, [clearRequestTimeout]);

  // Retry a timed-out request
  const retryTimedOutRequest = useCallback((lastMessageText: string) => {
    console.log("[ws] Retrying timed-out request with message:", lastMessageText);
    
    // Check if we're in a timed-out state
    if (!isRequestTimedOut) {
      console.warn("[ws] retryTimedOutRequest called but not in timeout state");
      return false;
    }
    
    // Check if WebSocket is connected
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("[ws] Cannot retry: WebSocket is not connected");
      setLastError({
        type: "error",
        code: "ws_not_connected",
        message: "WebSocket is not connected. Please wait for reconnection.",
      });
      return false;
    }
    
    // Reset timeout state and error
    setIsRequestTimedOut(false);
    setLastError(undefined);
    pendingRequestIdRef.current = '';
    
    // Clear any pending timeout
    clearRequestTimeout();
    
    console.log("[ws] Cleared timeout state, ready to resend message");
    
    // Reset thinking state
    setThinking(true);
    
    // Set new timeout for the retry
    setRequestTimeout();
    
    // Check if userId is available
    if (!opts.userId) {
      setLastError({
        type: "error",
        code: "missing_userId",
        message: "userId is required",
      });
      console.log("[ws] retryTimedOutRequest error: missing userId");
      return false;
    }
    
    // Send the message again
    const currentThreadId = threadIdRef.current;
    const payload = currentThreadId
      ? { type: "user_message" as const, threadId: currentThreadId, message: lastMessageText, userId: opts.userId }
      : { type: "user_message" as const, message: lastMessageText, userId: opts.userId };
    console.log("[ws] Resending message payload:", payload);
    wsRef.current.send(JSON.stringify(payload));
    
    return true;
  }, [isRequestTimedOut, clearRequestTimeout, setRequestTimeout, opts.userId]);

  // Auto-cleanup for timed-out requests: trigger cleanup_stale_request when timeout occurs
  useEffect(() => {
    if (isRequestTimedOut && connected) {
      console.log("[ws] Request timed out, triggering auto-cleanup on backend");
      // Call cancelThinking with cleanup_stale_request type for backend cleanup
      cancelThinking('cleanup_stale_request');
    }
  }, [isRequestTimedOut, connected, cancelThinking]);

  // Open the WebSocket connection and set up event handlers
  const connect = useCallback(() => {
    if (waitForAuthRef.current && !currentUserIdRef.current) {
      console.log('[ws] waitForAuth: userId not yet available, skipping connection');
      return;
    }

    // Prevent duplicate connections
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    // Build WebSocket URL dynamically with current threadId and userId (for reconnection)
    const currentThreadId = threadIdRef.current;
    const userId = opts.userId;
    const params = new URLSearchParams();
    if (currentThreadId) params.set("threadId", currentThreadId);
    if (userId) params.set("userId", userId);
    const queryString = params.toString();
    const wsUrl = baseWsUrl + (queryString ? `?${queryString}` : "");
    console.log("[ws] Attempting to connect...", { wsUrl, threadId: currentThreadId, userId, baseWsUrl });

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setReconnecting(false);
      setLastError(undefined);

      // On successful connection
      ws.onopen = () => {
        console.log("[ws] WebSocket connected successfully");
        setConnected(true);
        setReconnecting(false);
        setShowDisconnectIndicator(false);
        backoffRef.current = 0;
        
        // Clear disconnect timer if it was set
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
        }
      };

    // Handle incoming messages from server
    ws.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data as string) as ServerEvent;
        console.log("[ws] recv:", evt);

        if (evt.type === "ack") {
          setThreadId(evt.threadId); // Server assigned threadId
          console.log("[ws] ack received, threadId:", evt.threadId);
          return;
        }
        if (evt.type === "ai_reply") {
          console.log("$ [use ws] ai_reply from BE (immediate display):", evt);
          // Clear the timeout since we got a response
          clearRequestTimeout();
          setIsRequestTimedOut(false);
          
          // Update threadId if changed
          if (evt.threadId && evt.threadId !== threadId)
            setThreadId(evt.threadId);
          setThinking(false);
          
          setAi({
            ok: evt.ok,
            reply: evt.reply,
            error: evt.error,
            meta: evt.meta,
            memoryOperations: (evt as any).memoryOperations,
            operationResults: (evt as any).operationResults,
            profileAutoUpdateTriggered: false,
          });
          setLastReply(evt.reply);
          // If error, update lastError
          if (evt.ok === false && evt.error) {
            setLastError({
              type: "error",
              code: evt.error.code,
              message: evt.error.message,
            });
          }
          return;
        }
        if (evt.type === "ai_update") {
          console.log("$ [use ws] ai_update from BE", evt);
          // Clear the timeout since we got a response
          clearRequestTimeout();
          setIsRequestTimedOut(false);
          
          // Update threadId if changed
          if (evt.threadId && evt.threadId !== threadId)
            setThreadId(evt.threadId);
          setThinking(false);
          
          setAi({
            ok: evt.ok,
            reply: evt.reply,
            error: evt.error,
            meta: evt.meta,
            memoryOperations: (evt as any).memoryOperations,
            operationResults: (evt as any).operationResults,
            profileAutoUpdateTriggered: false,
          });
          setLastReply(evt.reply);
          // If error, update lastError
          if (evt.ok === false && evt.error) {
            setLastError({
              type: "error",
              code: evt.error.code,
              message: evt.error.message,
            });
          }
          return;
        }
        if (evt.type === "memory_processed") {
          console.log("$ [use ws] memory_processed from BE:", evt);
          // Clear the timeout since we got a response
          clearRequestTimeout();
          setIsRequestTimedOut(false);
          
          // Memory operations completed in background, update operationResults
          setAi(prev => prev ? {
            ...prev,
            operationResults: evt.operationResults
          } : undefined);
          return;
        }
        if (evt.type === "profile_auto_update") {
          console.log("$ [use ws] profile_auto_update from BE", evt);
          // Clear the timeout since we got a response
          clearRequestTimeout();
          setIsRequestTimedOut(false);
          
          // Update threadId if provided
          if (evt.threadId && evt.threadId !== threadId)
            setThreadId(evt.threadId);
          
          setThinking(false);
          
          // Set complete AI state with profile update flag
          const newAiState: AIReply = {
            ok: evt.ok,
            reply: evt.reply,
            error: evt.error,
            meta: evt.meta,
            memoryOperations: evt.memoryOperations,
            operationResults: evt.operationResults,
            profileAutoUpdateTriggered: true,
            profileAutoUpdateMessage: evt.message,
            profileData: evt.profileData,
          };
          
          console.log("$ [use ws] profile_auto_update back to profilePage", newAiState);
          setAi(newAiState);
          
          // Also update lastReply for ChatBox
          if (evt.reply) {
            setLastReply(evt.reply);
          }
          
          return;
        }
        if (evt.type === "interview_question") {
          console.log("[ws] interview_question received:", evt);
          // Clear the timeout since we got a response
          clearRequestTimeout();
          setIsRequestTimedOut(false);
          setThinking(false);

          // Update threadId if changed
          if (evt.threadId && evt.threadId !== threadId)
            setThreadId(evt.threadId);

          setLastInterviewQuestion(evt.question);
          setLastInterviewQuestionMsgId(evt.questionMessageId);
          return;
        }
        if (evt.type === "interview_ended") {
          console.log("[ws] interview_ended received:", evt);
          // Clear the timeout and thinking state
          clearRequestTimeout();
          setIsRequestTimedOut(false);
          setThinking(false);
          setInterviewEnded(true);
          return;
        }
        if (evt.type === "error") {
          // Clear the timeout since we got a response (even though it's an error)
          clearRequestTimeout();
          
          // request_timeout_cleanup is a silent backend ACK for auto-cleanup.
          // Do NOT clear isRequestTimedOut here — the Retry Banner must stay visible.
          // All other errors reset the timeout state normally.
          if (evt.code !== 'request_timeout_cleanup') {
            setIsRequestTimedOut(false);
            setThinking(false);
          }
          
          setLastError(evt);
          return;
        }
      } catch (err) {
        // Ignore non-JSON messages
        console.log("[ws] failed to parse message", e.data, err);
      }
    };

    // On connection close, optionally auto-reconnect
    ws.onclose = () => {
      console.log("[ws] WebSocket closed, attempting to reconnect...");
      setConnected(false);
      wsRef.current = null;
      
      // TEST: Check if testing disabled reconnect, otherwise use opts.autoReconnect
      const shouldReconnect = !testDisableReconnectRef.current && (opts.autoReconnect ?? true);
      if (shouldReconnect) {
        const max = opts.maxBackoffMs ?? 15000;
        backoffRef.current = backoffRef.current
          ? Math.min(backoffRef.current * 2, max)
          : 1000;
        
        setReconnecting(true);
        
        // Only show disconnect indicator after 3 seconds of failed reconnection
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
        }
        disconnectTimerRef.current = setTimeout(() => {
          console.log("[ws] Connection failed for 3+ seconds, showing disconnect indicator");
          setShowDisconnectIndicator(true);
        }, 3000);
        
        console.log(`[ws] Scheduling reconnect in ${backoffRef.current}ms`);
        setTimeout(() => connect(), backoffRef.current);
      }
    };

    // On error, set error state and stop thinking
    ws.onerror = (error) => {
      console.log("[ws] WebSocket error occurred", error);
      setThinking(false);
      setLastError({
        type: "error",
        code: "ws_error",
        message: "WebSocket error",
      });
    };
    } catch (error) {
      console.error("[ws] Failed to create WebSocket:", error);
      setLastError({
        type: "error",
        code: "ws_connection_failed",
        message: error instanceof Error ? error.message : "Failed to create WebSocket connection",
      });
    }
  }, [opts.autoReconnect, opts.maxBackoffMs, baseWsUrl, opts.userId]); // Removed threadId from dependencies

  // Connect on mount; cleanup on unmount
  // Note: We don't reconnect when threadId changes - the existing connection
  // will send the threadId with each message, and server will handle it
  useEffect(() => {
    connect();
    return () => close();
  }, [baseWsUrl]); // Only reconnect if the base URL changes

  // Reconnect when userId becomes available (session finishes loading)
  // This handles the case where WS connected before NextAuth session was ready
  useEffect(() => {
    const currentUserId = opts.userId;
    if (currentUserId && currentUserId !== prevUserIdRef.current) {
      prevUserIdRef.current = currentUserId;
      console.log('[ws] userId became available, reconnecting with userId:', currentUserId);
      // Close existing anonymous connection and reconnect with userId
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
      connect();
    }
  }, [opts.userId, connect]);

  // Network connection state monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('[ws] Network reconnected');
      setIsOnline(true);
      // Clear any existing error related to network
      setLastError(undefined);
      // Try to reconnect WebSocket
      if (!connected && !reconnecting) {
        console.log('[ws] Network restored, attempting to reconnect WebSocket...');
        connect();
      }
    };

    const handleOffline = () => {
      console.log('[ws] Network disconnected');
      setIsOnline(false);
      setLastError({
        type: "error",
        code: "network_offline",
        message: "Network disconnected. Please check your internet connection.",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connected, reconnecting, connect]);

  // TEST: Expose WebSocket instance for manual testing in DevTools
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__testWs = {
        close: () => {
          console.log('[TEST] Manually closing WebSocket connection...');
          wsRef.current?.close();
        },
        getState: () => {
          const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
          const state = wsRef.current?.readyState ?? -1;
          console.log(`[TEST] WebSocket state: ${state >= 0 ? states[state] : 'NOT_CREATED'}`);
          return state;
        },
        reconnect: () => {
          console.log('[TEST] Manually reconnecting...');
          connect();
        },
        disableAutoReconnect: () => {
          console.log('[TEST] 🔴 Auto-reconnect DISABLED (testing only)');
          testDisableReconnectRef.current = true;
        },
        enableAutoReconnect: () => {
          console.log('[TEST] 🟢 Auto-reconnect ENABLED');
          testDisableReconnectRef.current = false;
        },
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__testWs;
      }
    };
  }, [connect]);

  // Send a user message to the server (returns true if sent)
  const sendUserMessage = useCallback(
    (text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
        return false;
      if (!opts.userId) {
        setLastError({
          type: "error",
          code: "missing_userId",
          message: "userId is required",
        });
        console.log("[ws] sendUserMessage error: missing userId", { text, opts });
        return false;
      }
      
      // Reset timeout state for new request
      setIsRequestTimedOut(false);
      setThinking(true);
      
      // Set the timeout for this request
      setRequestTimeout();
      
      const currentThreadId = threadIdRef.current;
      const payload = currentThreadId
        ? { type: "user_message" as const, threadId: currentThreadId, message: text, userId: opts.userId }
        : { type: "user_message" as const, message: text, userId: opts.userId }; // no threadId -> server will ensure/ack
      console.log("[ws] sendUserMessage payload:", payload);
      wsRef.current.send(JSON.stringify(payload));
      return true;
    },
    [opts.userId, setRequestTimeout]
  );

  // Send an interview message to the server (Interviewer mode) - returns true if sent
  const sendInterviewMessage = useCallback(
    (text: string, activityId?: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
        return false;
      if (!opts.userId) {
        setLastError({
          type: "error",
          code: "missing_userId",
          message: "userId is required",
        });
        console.log("[ws] sendInterviewMessage error: missing userId", { text, opts });
        return false;
      }
      
      // Reset timeout state for new request
      setIsRequestTimedOut(false);
      setThinking(true);
      
      // Set the timeout for this request
      setRequestTimeout();
      
      const currentThreadId = threadIdRef.current;
      const payload = {
        type: "interview_message" as const,
        threadId: currentThreadId,
        message: text,
        userId: opts.userId,
        activityId,
      };
      console.log("[ws] sendInterviewMessage payload:", payload);
      wsRef.current.send(JSON.stringify(payload));
      return true;
    },
    [opts.userId, setRequestTimeout]
  );

  // Send a start_interview event to the server - frontend pre-resolves threadId via HTTP
  const sendStartInterview = useCallback(
    (resolvedThreadId: string, activityId: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
        return false;
      if (!opts.userId) {
        setLastError({
          type: "error",
          code: "missing_userId",
          message: "userId is required",
        });
        console.log("[ws] sendStartInterview error: missing userId", { resolvedThreadId, activityId });
        return false;
      }
      const payload = {
        type: "start_interview" as const,
        threadId: resolvedThreadId,
        userId: opts.userId,
        activityId,
      };
      console.log("[ws] sendStartInterview payload:", payload);
      wsRef.current.send(JSON.stringify(payload));
      return true;
    },
    [opts.userId]
  );

  // Expose connection state, AI reply, error, and send/close functions
  return {
    connected,
    reconnecting,
    showDisconnectIndicator,
    isOnline,
    threadId,
    thinking,
    lastReply,
    lastError,
    ai,
    isRequestTimedOut,
    lastInterviewQuestion,
    lastInterviewQuestionMsgId,
    interviewEnded,
    resetInterviewEnded: () => setInterviewEnded(false),
    markInterviewEnded: () => setInterviewEnded(true),
    sendUserMessage,
    sendInterviewMessage,
    sendStartInterview,
    cancelThinking,
    retryTimedOutRequest,
    updateThreadId: setThreadId, // Allow external threadId updates
    close,
  };
}
