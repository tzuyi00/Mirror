import { useEffect, useRef, useState } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSharedWebSocket } from '@/contexts/WebSocketContext';
import { useChatMode } from '@/contexts/ChatModeContext';
import { useProfileUpdate } from '@/contexts/ProfileUpdateContext';
import { postChatReply, postInterviewMessage, postStartInterview, postProcessMemory, getThreadMessages, getOrCreateUserThread } from "@/lib/api"
import {
  Send,
  Bot,
  PanelLeftClose,
  GripVertical,
  X,
  MessageCircle,
  Mic,
} from "lucide-react"

type Role = 'user' | 'ai' | 'system';
type ChatMsg = {
  role: Role;
  data?: any; // user: {text}; ai: {reply} | {error}
};
export interface ChatBoxProps {
  chatboxOpen: boolean;
  sidebarWidth: number;
  userId: string;
  onClose: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  chatboxOpen,
  sidebarWidth,
  userId,
  onClose,
  onMouseDown,
}) => {
  const { connected, reconnecting, thinking, lastReply, lastError, sendUserMessage, sendInterviewMessage, sendStartInterview, cancelThinking, ai, threadId: wsThreadId, updateThreadId, showDisconnectIndicator, isOnline, isRequestTimedOut, retryTimedOutRequest, lastInterviewQuestion, lastInterviewQuestionMsgId, interviewEnded, resetInterviewEnded, markInterviewEnded } = useSharedWebSocket();
  
  // Get ChatMode context for Impersonation vs Interviewer mode
  const { mode: chatMode, activityId, lastActivityId, switchToImpersonation, switchToInterviewer } = useChatMode();
  
  // Try to use ProfileUpdate context, but don't fail if it's not available
  let triggerProfileUpdate: ((profileData: any, showLoading?: boolean) => void) | undefined;
  try {
    const profileUpdate = useProfileUpdate();
    triggerProfileUpdate = profileUpdate.triggerProfileUpdate;
  } catch (e) {
    // Context not available, that's ok - profile update won't work but chat will
    console.warn('[ChatBox] ProfileUpdateContext not available, profile auto-update disabled');
  }
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [displayError, setDisplayError] = useState<typeof lastError>(null);
  const [httpThinking, setHttpThinking] = useState(false); // Local thinking state for HTTP fallback
  const [httpThreadId, setHttpThreadId] = useState<string | undefined>(undefined); // Local threadId for HTTP fallback
  const lastPushedReply = useRef<string | undefined>(undefined);
  const lastPushedInterviewQuestion = useRef<string | undefined>(undefined);
  const interviewEndedPushedRef = useRef(false); // de-dupe: prevent double system bubble
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const httpAbortController = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Unified threadId: prefer WebSocket threadId, fall back to HTTP threadId
  const threadId = wsThreadId || httpThreadId;
  
  // Sync threadId between WebSocket and HTTP modes
  useEffect(() => {
    if (wsThreadId && !httpThreadId) {
      // WebSocket established threadId → sync to HTTP
      setHttpThreadId(wsThreadId);
      console.log('[ChatBox] Synced WebSocket threadId to HTTP:', wsThreadId);
    } else if (!wsThreadId && httpThreadId && connected) {
      // HTTP has threadId but WebSocket doesn't → update WebSocket to use HTTP's threadId
      console.log('[ChatBox] WebSocket reconnected, syncing HTTP threadId to WebSocket:', httpThreadId);
      updateThreadId(httpThreadId);
    } else if (wsThreadId && httpThreadId && wsThreadId !== httpThreadId) {
      console.warn('[ChatBox] ThreadId mismatch detected!');
      console.warn('  WebSocket threadId:', wsThreadId);
      console.warn('  HTTP threadId:', httpThreadId);
    }
  }, [wsThreadId, httpThreadId, connected, updateThreadId]);

  // Unified thread initialization and mode switching
  // This handles both:
  // 1. Initial thread fetch on mount (with 500ms delay to let WS connect first)
  // 2. Mode/activity switching (when user changes mode or selects activity)
  useEffect(() => {
    if (!userId) return;
    
    // Use timeout to delay initialization slightly:
    // - On mount: gives WebSocket time to connect first
    // - On mode switch: avoids rapid re-fetches if dependencies change frequently
    const timeout = setTimeout(() => {
      const initializeThread = async () => {
        try {
          // Reset interview ended state when switching mode or activity
          resetInterviewEnded();
          interviewEndedPushedRef.current = false;

          if (chatMode === 'interviewer' && activityId) {
            console.log('[ChatBox] Initializing Interviewer mode thread for activity:', activityId);
            
            // Get or create activity-specific thread
            const result = await getOrCreateUserThread(userId, activityId);
            console.log('[ChatBox] Got activity thread:', result.threadId);
            setHttpThreadId(result.threadId);
            
            // Reset message history so it reloads from the new thread
            setMessages([]);
            setHistoryLoaded(false);
            
            // Also update WebSocket context if available
            updateThreadId(result.threadId);

            const sent = sendStartInterview(result.threadId, activityId);
            if (!sent) {
              console.log('[ChatBox] WS not ready, falling back to HTTP start-interview');
              setHistoryLoaded(true);
              try {
                setHttpThinking(true);
                const startRes = await postStartInterview(result.threadId, userId, activityId);
                console.log('[ChatBox HTTP] start-interview response:', startRes);
                if (startRes.interviewEnded) {
                  // Activity already completed on re-entry
                  markInterviewEnded();
                } else if (startRes.ok && startRes.replyQuestion) {
                  const historyRes = await getThreadMessages(result.threadId);
                  const historyMessages: ChatMsg[] = [];
                  for (const msg of historyRes.messages) {
                    if (msg.role === 'user') {
                      historyMessages.push({ role: 'user', data: { text: (msg.data as any)?.content || '' } });
                    } else if (msg.role === 'ai') {
                      historyMessages.push({ role: 'ai', data: { reply: (msg.data as any)?.content || '' } });
                    }
                  }
                  setMessages(historyMessages);
                  console.log(`[ChatBox HTTP] Loaded ${historyMessages.length} messages after start-interview`);
                } else if (!startRes.ok) {
                  console.warn('[ChatBox HTTP] start-interview failed:', startRes.error);
                }
              } catch (httpErr) {
                console.error('[ChatBox HTTP] start-interview error:', httpErr);
              } finally {
                setHttpThinking(false);
              }
            }
          } else if (chatMode === 'impersonation') {
            console.log('[ChatBox] Initializing Impersonation mode thread');
            
            // Get or create impersonation thread (no activityId)
            const result = await getOrCreateUserThread(userId);
            console.log('[ChatBox] Got impersonation thread:', result.threadId);
            setHttpThreadId(result.threadId);
            
            // Reset message history so it reloads from the new thread
            setMessages([]);
            setHistoryLoaded(false);
            
            // Also update WebSocket context if available
            updateThreadId(result.threadId);
          }
        } catch (err) {
          console.error('[ChatBox] Failed to initialize thread:', err);
          setDisplayError({
            type: "error",
            code: 'thread_init_error',
            message: 'Failed to initialize chat thread',
          });
        }
      };
      
      initializeThread();
    }, 500); // 500ms delay to avoid competing with WebSocket initialization
    
    return () => clearTimeout(timeout);
  }, [chatMode, activityId, userId, updateThreadId, sendStartInterview]);

  // Auto-scroll to the bottom when a new message is added
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Clear connection-related errors when WebSocket successfully connects
  useEffect(() => {
    if (connected && displayError && displayError.code === 'ws_error') {
      // Only clear WebSocket connection errors, not application errors
      setDisplayError(null);
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
    }
  }, [connected, displayError]);

  // Handle error display with auto-dismiss after 5 seconds
  useEffect(() => {
    if (lastError) {
      // Don't add system message - we'll show resend/modify options instead
      if (lastError.code === 'user_cancelled' || lastError.code === 'request_cancelled' || lastError.code === 'request_timeout_cleanup') {
        return;
      }
      
      setDisplayError(lastError);
      
      // Clear any existing timer
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
      
      const isWebSocketError = lastError.code === 'ws_error' || lastError.code === 'ws_connection_failed' || lastError.code === 'internal_error';
      const isTimeoutError = lastError.code === 'request_timeout';
      console.log('$ [ChatBox] Received error:', lastError, 'isWebSocketError:', isWebSocketError, 'isTimeoutError:', isTimeoutError);
      
      if (!isWebSocketError && !isTimeoutError) {
        // Set new timer to clear error after 5 seconds for other errors
        errorTimerRef.current = setTimeout(() => {
          setDisplayError(null);
        }, 5000);
      }
    }
    
    // Cleanup timer on unmount
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, [lastError]);

  // Append every AI reply into the timeline (no history / no HTTP fallback)
  useEffect(() => {
    if (!lastReply) return;
    if (lastPushedReply.current === lastReply) return; // de-dupe
    lastPushedReply.current = lastReply;
    console.log('$ [chatBox] WebSocket AIReply:', ai);
    
    setMessages((prev) => [
      ...prev,
      {
        role: 'ai',
        data: { reply: lastReply, error: ai?.error },
      }
    ]);
    console.log('$ [chatBox] lastReply from WebSocket:', lastReply);
  }, [lastReply, ai]);

  // Append interview questions pushed by the server (interview_question WS event)
  useEffect(() => {
    if (!lastInterviewQuestion) return;
    if (lastPushedInterviewQuestion.current === lastInterviewQuestion) return; // de-dupe
    lastPushedInterviewQuestion.current = lastInterviewQuestion;
    console.log('[ChatBox] Received interview_question:', lastInterviewQuestion, 'msgId:', lastInterviewQuestionMsgId);

    setMessages((prev) => [
      ...prev,
      {
        role: 'ai',
        data: { reply: lastInterviewQuestion },
      },
    ]);
  }, [lastInterviewQuestion, lastInterviewQuestionMsgId]);

  // Push "activity completed" system bubble when interview ends (WS path)
  useEffect(() => {
    if (!interviewEnded) return;
    if (chatMode !== 'interviewer') return;
    if (interviewEndedPushedRef.current) return; // de-dupe
    interviewEndedPushedRef.current = true;
    console.log('[ChatBox] Interview ended, pushing system bubble');
    setMessages((prev) => [
      ...prev,
      { role: 'system', data: { text: '🎉 This activity has been completed! Thank you for your participation.' } },
    ]);
  }, [interviewEnded, chatMode]);

  // Load conversation history when threadId is available and history not yet loaded
  useEffect(() => {
    if (threadId && !historyLoaded) {
      const modeLabel = chatMode === 'interviewer' ? `Interviewer (Activity: ${activityId})` : 'Impersonation';
      console.log(`[ChatBox] Loading conversation history for ${modeLabel} thread:`, threadId);
      
      getThreadMessages(threadId)
        .then((response) => {
          const historyMessages: ChatMsg[] = [];

          for (const msg of response.messages) {
            if (msg.role === 'user') {
              historyMessages.push({
                role: 'user',
                data: { text: (msg.data as any)?.content || '' }
              });
            } else if (msg.role === 'ai') {
              historyMessages.push({
                role: 'ai',
                data: { reply: (msg.data as any)?.content || '' }
              });
            }
          }

          setMessages(historyMessages);
          setHistoryLoaded(true);
          console.log(`[ChatBox] Loaded ${historyMessages.length} historical messages for ${modeLabel}`);
        })
        .catch((error) => {
          console.error(`[ChatBox] Failed to load conversation history for ${modeLabel}:`, error);
          setHistoryLoaded(true);
        });
    }
  }, [threadId, historyLoaded, chatMode, activityId]);

  useEffect(() => {
    if (isRequestTimedOut) {
      console.log('[ChatBox] Timeout triggered, resetting lastPushedReply');
      lastPushedReply.current = undefined;
    }
  }, [isRequestTimedOut]);

  // Handle input change event
  function onInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    updateTextareaHeight();
  }

  // Update textarea height based on scrollHeight (pure DOM, no React state)
  // Using pure DOM avoids React's bail-out optimization when state value is unchanged,
  // which would leave 'height: auto' stuck on the DOM element.
  function updateTextareaHeight() {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }

  // Reset textarea height when input is cleared (e.g. after sending a message)
  useEffect(() => {
    if (input === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input]);

  // Handle textarea key press (Shift+Enter for new line, Enter to send)
  function onTextareaKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: allow new line, then update height on next tick
        setTimeout(updateTextareaHeight, 0);
      } else {
        // Enter: send message
        if (!isThinking && isOnline && !isRequestTimedOut && !isInterviewEnded) {
          e.preventDefault();
          onSendMessage();
        }
      }
    }
  }

  // Helper: Remove the last user message from chat history
  const removeLastUserMessage = (prev: ChatMsg[]): ChatMsg[] => {
    return prev.filter((m, i) => {
      if (m.role !== 'user') return true;
      const isLastUser = prev.slice(i + 1).filter(msg => msg.role === 'user').length === 0;
      return !isLastUser;
    });
  };
  
  // Handle stop button click
  async function onStopGeneration() {
    console.log('[ChatBox] Stop generation clicked');
    
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage?.data?.text) {
      // Put the message back into the input field
      setInput(lastUserMessage.data.text);
      
      // Remove the last user message from the chat
      setMessages(removeLastUserMessage);
      
      console.log('[ChatBox] Removed user message');
    }
    
    // Cancel the AI request
    if (connected) {
      // WebSocket: send cancel_request to backend
      cancelThinking();
    } else {
      // HTTP: Backend will detect signal.aborted
      if (httpAbortController.current) {
        console.log('[ChatBox HTTP] Aborting HTTP request');
        httpAbortController.current.abort();
        setHttpThinking(false);
      }
    }
  }

  // Handle retry timeout request
  function onRetryTimedOutRequest() {
    console.log('[ChatBox] Retry timed-out request clicked');
    
    // Get the last user message
    const lastUserMsg = [...messages]
      .reverse()
      .find(m => m.role === 'user');
    
    if (lastUserMsg?.data?.text) {
      const messageText = lastUserMsg.data.text;
      
      // Remove the timed-out user message from history BEFORE retrying
      setMessages(removeLastUserMessage);
      
      // Clear the last pushed reply to allow re-display if needed
      lastPushedReply.current = undefined;
      
      // Now retry the request
      const success = retryTimedOutRequest(messageText);
      
      if (success) {
        // Re-add the user message to UI so it's visible while waiting for AI response
        setMessages(prev => [...prev, { role: 'user', data: { text: messageText } }]);
        setDisplayError(null);
        console.log('[ChatBox] Retry sent successfully, message re-added to history');
      } else {
        console.warn('[ChatBox] Retry failed');
        setDisplayError({
          type: "error",
          code: 'retry_failed',
          message: 'Failed to retry. Please check your connection.',
        });
      }
    }
  }

  // Send message handler: uses WebSocket if connected, otherwise falls back to HTTP
  async function onSendMessage() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    
    // Clear error when user sends a new message
    setDisplayError(null);
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    
    lastPushedReply.current = undefined;
    
    setMessages((prev) => [...prev, { role: 'user', data: { text } }]);

    if (connected) {
      // Send via WebSocket
      if (chatMode === 'interviewer' && activityId) {
        sendInterviewMessage(text, activityId);
      } else {
        sendUserMessage(text); // Impersonation mode
      }
    } else {
      // HTTP fallback
      setHttpThinking(true);
      httpAbortController.current = new AbortController();
      
      try {
        if (chatMode === 'interviewer' && activityId) {
          // ── Interviewer mode HTTP fallback ────────────────────────────
          // save user answer, AI generates next question.
          if (!threadId) {
            throw new Error('threadId is required for interview mode');
          }
          const replyRes = await postInterviewMessage(threadId, text, userId, activityId, httpAbortController.current.signal);
          console.log('$ HTTP Interview Response:', replyRes);

          if (replyRes.interviewEnded) {
            // Interview ended: no more questions
            markInterviewEnded();
          } else if (!replyRes.ok || !replyRes.replyQuestion) {
            setDisplayError({
              type: "error",
              code: replyRes.error?.code ?? 'interview_error',
              message: replyRes.error?.message ?? 'AI failed to generate next question',
            });
          } else {
            // Display AI next-question
            setMessages((prev) => [
              ...prev,
              { role: 'ai', data: { reply: replyRes.replyQuestion } },
            ]);
          }
        } else {
          // ── Impersonation mode HTTP fallback ────────────────────────────
          // step 1: Get reply text
          const replyRes = await postChatReply(threadId, text, userId, httpAbortController.current.signal);
          console.log('$ HTTP Reply Response:', replyRes);

          // Save the threadId from response if we don't have one yet
          if (replyRes.meta?.threadId && !threadId) {
            setHttpThreadId(replyRes.meta.threadId);
            console.log('[ChatBox HTTP] Saved threadId:', replyRes.meta.threadId);
          }

          // Immediately display the AI reply
          setMessages((prev) => [
            ...prev,
            { role: 'ai', data: { reply: replyRes.reply, error: replyRes.error } },
          ]);

          // step 2: Process memory operations (non-blocking, impersonation only)
          if (replyRes.ok && replyRes.reply && replyRes.meta?.threadId) {
            postProcessMemory(replyRes.meta.threadId, userId, replyRes.reply, text, "conversation")
              .then((memoryRes) => {
                console.log('$ HTTP Memory Processing Result:', memoryRes);
              
                // Handle profile auto-update if triggered
              // if (memoryRes.profileAutoUpdate?.triggered && triggerProfileUpdate) {
              //   triggerProfileUpdate(memoryRes.profileAutoUpdate.profileData, false);
              // }
              })
              .catch((memoryErr) => {
                console.error('$ HTTP Memory Processing Error:', memoryErr);
                setDisplayError({
                  type: "error",
                  code: 'memory_processing_error',
                  message: 'Memory processing failed, but chat continues',
                });
                if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
                errorTimerRef.current = setTimeout(() => setDisplayError(null), 5000);
              });
          }
        }

        setHttpThinking(false);
        console.log('[ChatBox HTTP] Reply displayed');
      } catch (err: any) {
        setHttpThinking(false);
        
        // Don't show error if it was aborted by user
        if (err?.name === 'AbortError' || httpAbortController.current?.signal.aborted) {
          console.log('$ HTTP request cancelled by user');
          return;
        }
        
        // Show error in display banner instead of in messages
        setDisplayError({
          type: "error",
          code: 'http_error',
          message: err?.message || 'Failed to send message',
        });
        
        // Clear error after 5 seconds
        if (errorTimerRef.current) {
          clearTimeout(errorTimerRef.current);
        }
        errorTimerRef.current = setTimeout(() => {
          setDisplayError(null);
        }, 5000);
      } finally {
        httpAbortController.current = null;
      }
    }
  }

  // Handle interviewer mode toggle button click
  async function onInterviewerModeToggle() {
    if (chatMode === 'impersonation') {
      // Try to switch to the last used activity
      if (lastActivityId) {
        console.log('[ChatBox] Toggling to Interviewer mode with last activity:', lastActivityId);
        switchToInterviewer(lastActivityId);
      } else {
        // No lastActivityId in memory – fetch the last interviewer thread from the server
        console.log('[ChatBox] No lastActivityId in memory, fetching last activity thread from server...');
        try {
          // activityId: 'any' → read-only lookup for latest interviewer thread (no creation)
          const result = await getOrCreateUserThread(userId, 'any');
          if (result.activityId) {
            console.log('[ChatBox] Found last activity thread, switching to Interviewer mode with activityId:', result.activityId);
            switchToInterviewer(result.activityId);
          } else {
            console.warn('[ChatBox] No interviewer thread found for this user. Please use the Activities page first.');
          }
        } catch (err) {
          console.error('[ChatBox] Failed to fetch last activity thread:', err);
        }
      }
    } else if (chatMode === 'interviewer') {
      console.log('[ChatBox] Toggling to Impersonation mode');
      switchToImpersonation();
    }
  }
  
  // Combined thinking state (WebSocket or HTTP)
  const isThinking = thinking || httpThinking;
  // Disable input when interview is ended in interviewer mode
  const isInterviewEnded = interviewEnded && chatMode === 'interviewer';
  
  if (!chatboxOpen) return null

  return (
    <div
      className="h-screen max-h-screen flex flex-col bg-[#455769] border-r border-[#D4FAFF]/20 relative"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Chat Header */}
      <div className={`p-4 border-b flex-shrink-0 flex items-center transition-colors ${
        !isOnline
          ? 'border-orange-500/50 bg-orange-900/20'
          : showDisconnectIndicator
          ? 'border-red-500/50 bg-red-900/20' 
          : 'border-[#D4FAFF]/20 bg-[#455769]'
      }`}>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#E49D23] flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#172A3A]" />
            </div>
            {!isOnline ? (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-[#455769] animate-pulse"></div>
            ) : showDisconnectIndicator ? (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#455769] animate-pulse"></div>
            ) : (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#D4FAFF] rounded-full border-2 border-[#455769]"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-[#F8F4E4]">
              {chatMode === 'interviewer' ? 'Profile Interviewer' : 'Chat Assistant'}
            </h3>
              {!isOnline ? (
                <p className="text-xs text-orange-400 animate-pulse font-medium">
                  📡 Network Disconnected
                </p>
              ) : showDisconnectIndicator ? (
                <p className="text-xs text-red-400 animate-pulse font-medium">
                  🔄 Reconnecting...
                </p>
              ) : (
                <p className="text-xs text-[#D4FAFF]/70">
                  {connected ? 'Connected' : 'Disconnected'}
                  {isThinking && <span className="animate-pulse"> · thinking…</span>}
                </p>
              )}
          </div>
        </div>

        {/* Mode Toggle & Close Button - Always on the right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mode Toggle: Impersonation vs Interviewer */}
          <div className="flex gap-1 bg-[#172A3A]/40 rounded p-1">
            {/* Impersonation Mode Button */}
            <button
              onClick={onInterviewerModeToggle}
              className={`p-1.5 rounded transition-colors ${
                chatMode === 'impersonation'
                  ? 'bg-[#E49D23] text-[#172A3A]'
                  : 'text-[#D4FAFF]/60 hover:text-[#D4FAFF] hover:bg-[#D4FAFF]/10'
              }`}
              title="Impersonation Mode: General chat"
            >
              <MessageCircle className="w-4 h-4" />
            </button>

            {/* Interviewer Mode Button */}
            <button
              onClick={onInterviewerModeToggle}
              className={`p-1.5 rounded transition-colors ${
                chatMode === 'interviewer'
                  ? 'bg-[#E49D23] text-[#172A3A]'
                  : 'text-[#D4FAFF]/60 hover:text-[#D4FAFF] hover:bg-[#D4FAFF]/10'
              }`}
              title="Interviewer Mode: Activity-based interview (select from Sync Activities page)"
              disabled={!activityId && chatMode === 'interviewer'}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={onClose}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-[#D4FAFF] hover:bg-[#D4FAFF]/10"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat box */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto min-h-0">
        <div className="space-y-4">
          {messages.map((message, idx) => (
            <div key={idx} className={`flex ${
              message.role === "user" ? "justify-end" : 
              message.role === "system" ? "justify-center" : 
              "justify-start"
            }`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-[#E49D23] text-[#172A3A] ml-4"
                    : message.role === "system"
                    ? "bg-[#A0EFFF]/10 text-[#A0EFFF] border border-[#A0EFFF]/30 text-center"
                    : "bg-[#172A3A] text-[#F8F4E4] mr-4 border border-[#D4FAFF]/20"
                }`}
              >
                <p className="text-sm leading-relaxed break-words break-all whitespace-pre-wrap">
                  {message.role === 'user'
                    ? message.data?.text
                    : message.role === 'system'
                    ? message.data?.text
                    : message.data?.reply}
                </p>
              </div>
            </div>
          ))}

          {/* AI typing loading indicator */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-lg p-3 mr-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Network Offline Banner */}
      {!isOnline && (
        <div className="px-4 py-3 bg-orange-900/30 border-t border-orange-500/40">
          <div className="flex items-start gap-2 text-sm text-orange-200">
            <span className="text-lg mt-0.5">📡</span>
            <div className="flex-1">
                <p className="font-semibold">Network Disconnected</p>
                <p className="text-xs text-orange-300 mt-0.5">
                  Please check your internet connection. The system will reconnect automatically when the connection is restored.
                </p>
            </div>
          </div>
        </div>
      )}

      {/* Request Timeout Banner */}
      {isRequestTimedOut && (
        <div className="px-4 py-3 bg-red-900/40 border-b border-red-500/50">
          <div className="flex items-start gap-2 text-sm text-red-200">
            <span className="text-lg mt-0.5">⏱️</span>
            <div className="flex-1">
              <p className="font-semibold">Request Timeout</p>
              <p className="text-xs text-red-300 mt-0.5">
                The AI server is not responding. You can retry your request.
              </p>
              <div className="flex justify-center mt-2">
                <button
                  onClick={onRetryTimedOutRequest}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                >
                  🔄 Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Error Banner */}
      {displayError && displayError.code !== 'request_timeout' && (
        <div className="px-4 py-3 bg-red-900/30 border-b border-red-500/40">
          <div className="flex items-start gap-2 text-sm text-red-200">
            <span className="text-lg mt-0.5">❌</span>
            <div className="flex-1">
              <p className="font-semibold text-red-300">Error</p>
              <p className="text-xs text-red-300 mt-0.5">
                {displayError.message || 'An error occurred'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="p-4 border-t border-[#D4FAFF]/20 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={onInputChange}
            onKeyPress={onTextareaKeyPress}
            placeholder={
              isInterviewEnded
                ? 'This activity has been completed and input is disabled'
                : chatMode === 'interviewer' 
                ? 'Share your thoughts on this question...' 
                : 'Hello! How can I assist you today?'
            }
            disabled={isThinking || !isOnline || isRequestTimedOut || isInterviewEnded}
            className="flex-1 bg-[#172A3A] border border-[#D4FAFF]/30 text-[#F8F4E4] placeholder:text-[#D4FAFF]/50 disabled:opacity-50 disabled:cursor-not-allowed rounded px-3 py-2 resize-none overflow-y-auto max-h-[200px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          />
          {!isThinking ? (
            <Button
              onClick={onSendMessage}
              size="sm"
              disabled={!isOnline || isRequestTimedOut || isInterviewEnded}
              className="px-3 bg-[#E49D23] text-[#172A3A] hover:bg-[#E49D23]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onStopGeneration}
              size="sm"
              className="px-3 bg-red-600 text-white hover:bg-red-700"
              title="Stop and edit the message"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {isThinking && (
          <p className="text-xs text-[#D4FAFF]/60 mt-2">
            AI is thinking... Click X to stop and edit your message.
          </p>
        )}
      </div>

      {/* Resize Handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-[#D4FAFF]/20 hover:bg-[#E49D23] transition-colors group"
        onMouseDown={onMouseDown}
      >
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatBox