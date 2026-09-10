import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import {
  MessageRole,
  MessageMode,
} from './generated/product/index.js'
import { generateChatReply, generateInterviewReply, ExistingMemory, MemoryOperationResult, feedbackOperationResultsToAI, extractMemoryOperations } from "./aiService.js";
import { createMemory, updateMemory, deleteMemory } from "./services/memoryService.js";
import { createThread, appendMessage, threadExists, deleteMessage, getLatestThreadForUser, getLastInterviewerAiMessage, productPrisma } from "./services/chatService.js";
import { getActivityCompletionStatus } from "./services/activityService.js";
import { handleMemoryOperationUpdateProfile } from "./services/profileAutoUpdateService.js";
import { createConversationEvent, deleteConversationEventByRefMessageId } from "./services/conversationEventService.js";
import { z } from "zod";

/** Utility: safe JSON send */
function send(ws: WebSocket, data: unknown) {
  ws.send(JSON.stringify(data));
}

/** Utility: unified error envelope */
function sendError(ws: WebSocket, code: string, message: string) {
  send(ws, { type: "error", code, message });
}

/** UUID validator (RFC 4122 variants 1–5) */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


/**
 * Ensure we have a valid, existing thread id.
 * - If `candidate` is a valid UUID and exists in DB → use it.
 * - If `userId` is provided → find the user's latest thread, or create a new one with userId.
 * - Otherwise create a new anonymous thread and return its id.
 */
async function ensureThreadId(candidate?: string, userId?: string): Promise<string> {
  if (candidate && UUID_RE.test(candidate)) {
    const exists = await threadExists(candidate);
    if (exists) return candidate;
  }
  if (userId) {
    const existing = await getLatestThreadForUser(userId);
    if (existing) {
      console.log('[ws] Reusing existing thread for user:', userId, existing.id);
      return existing.id;
    }
    console.log('[ws] Creating new thread for user:', userId);
    const thread = await createThread(userId);
    return thread.id;
  }
  const thread = await createThread();
  return thread.id;
}

/** Inbound schema: validate payload shape */
const InboundUserMessage = z.object({
  type: z.literal("user_message"),
  // threadId is optional; when provided we accept any string here,
  // then ensure/normalize it via ensureThreadId()
  threadId: z.string().optional(),
  userId: z.string().min(1, "userId is required"), // REQUIRED for memory management
  message: z.string().min(1, "message is required").max(4000),
});
type InboundUserMessage = z.infer<typeof InboundUserMessage>;

/** Inbound cancel request schema */
const InboundCancelRequest = z.object({
  type: z.literal("cancel_request"),
  threadId: z.string().optional(),
});
type InboundCancelRequest = z.infer<typeof InboundCancelRequest>;

/** Inbound cleanup request schema */
const InboundCleanupRequest = z.object({
  type: z.literal("cleanup_stale_request"),
  threadId: z.string().optional(),
});
type InboundCleanupRequest = z.infer<typeof InboundCleanupRequest>;

/** Inbound interview message schema (for Interviewer mode - user answering a question) */
const InboundInterviewMessage = z.object({
  type: z.literal("interview_message"),
  threadId: z.string().optional(),
  userId: z.string().min(1, "userId is required"),
  message: z.string().min(1, "message is required").max(4000),
  activityId: z.string().min(1, "activityId is required"),
});
type InboundInterviewMessage = z.infer<typeof InboundInterviewMessage>;

/** Inbound start interview schema (for Interviewer mode - initialize session)
 * threadId is REQUIRED: frontend must pre-resolve it via HTTP (POST /api/thread with activityId)
 * before sending this event, so WS never creates threads internally.
 */
const InboundStartInterview = z.object({
  type: z.literal("start_interview"),
  threadId: z.string().min(1, "threadId is required"),
  userId: z.string().min(1, "userId is required"),
  activityId: z.string().min(1, "activityId is required"),
});
type InboundStartInterview = z.infer<typeof InboundStartInterview>;

/** Extend ws with liveness flag for heartbeat */
type LiveWS = WebSocket & { 
  isAlive?: boolean;
  abortController?: AbortController; // Track current request's abort controller
  lastUserMessageId?: string; // Track the last user message ID for cancellation cleanup
};

/** Helper: Delete message from both databases */
async function deleteMessageFromBothDBs(messageId: string): Promise<void> {
  // 1) Delete from Derived DB (conversation_event)
  await deleteConversationEventByRefMessageId(messageId);
  // 2) Delete from Product DB (messages table)
  await deleteMessage(messageId);
}

/** Helper: Handle cancel or cleanup requests */
async function handleCancelOrCleanup(
  messageType: 'cancel_request' | 'cleanup_stale_request',
  obj: any,
  sock: LiveWS,
): Promise<boolean> {
  const isUserCancel = messageType === 'cancel_request';
  const schema = isUserCancel ? InboundCancelRequest : InboundCleanupRequest;
  
  // Validate schema
  const check = schema.safeParse(obj);
  if (!check.success) {
    return false;
  }
  
  // Abort the active AI request for both user cancellation and auto-cleanup
  // Without abort, the AI would still complete and send ai_reply, which would
  // clear the timeout banner on the frontend
  if (sock.abortController) {
    const logMsg = isUserCancel ? 'Cancelling current AI request' : 'Aborting timed-out AI request';
    console.log(`[ws] ${logMsg}`);
    sock.abortController.abort();
    sock.abortController = undefined;
  } else {
    console.log(`[ws] No active AI request to abort (${messageType})`);
  }
  
  // Delete the message from both databases if exists
  if (sock.lastUserMessageId) {
    try {
      await deleteMessageFromBothDBs(sock.lastUserMessageId);
      const action = isUserCancel ? 'Cancelled' : 'Auto-cleaned up';
      console.log(`[ws] ${action} message from both databases:`, sock.lastUserMessageId);
      sock.lastUserMessageId = undefined;
    } catch (err: any) {
      console.error(`[ws] Failed to delete message (${messageType}):`, err?.message);
      // Continue anyway - don't block on cleanup failure
    }
  } else {
    console.log("[ws] No message to cancel or cleanup for timed-out request");
  }
  
  // Send appropriate response
  if (isUserCancel) {
    send(sock, {
      type: "error",
      code: "request_cancelled",
      message: "Request cancelled by user"
    });
  } else {
    send(sock, {
      type: "error",
      code: "request_timeout_cleanup",
      message: "Timed-out request cleaned up automatically"
    });
  }
  
  return true;
}

/** Attach a WebSocket server to the given HTTP server */
export function attachWS(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Heartbeat timer (server-side ping + dead peer detection)
  const interval = setInterval(() => {
    for (const client of wss.clients) {
      const c = client as LiveWS;
      if (c.readyState !== WebSocket.OPEN) continue;
      if (c.isAlive === false) {
        c.terminate(); // no pong since last ping
        continue;
      }
      c.isAlive = false;
      c.ping();
    }
  }, 15000);

  // On new connection
  wss.on("connection", (ws, req) => {
    console.log("[ws] New connection from", req.socket.remoteAddress, req.url);
    const sock = ws as LiveWS;
    sock.isAlive = true; // mark alive when connected
    sock.on("pong", () => (sock.isAlive = true)); // mark alive on pong

    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const threadIdFromUrl = url.searchParams.get("threadId") ?? undefined;
    const userIdFromUrl = url.searchParams.get("userId") ?? undefined;

    // Resolve a usable thread id first, then ACK back to the client.
    (async () => {
      const resolvedThreadId = await ensureThreadId(threadIdFromUrl, userIdFromUrl);
      console.log("[ws] resolvedThreadId:", resolvedThreadId, "for userId:", userIdFromUrl);
      send(sock, { type: "ack", threadId: resolvedThreadId });

      // Main message handler — dispatches by type
      sock.on("message", async (buf) => {
        console.log("[ws] message received:", buf.toString());

        // Parse JSON first
        let obj: any;
        let messageType: string;
        try {
          obj = JSON.parse(buf.toString());
          messageType = obj.type;
        } catch (err) {
          return sendError(sock, "invalid_json", "payload must be valid JSON");
        }

        // ── cancel / cleanup ──────────────────────────────────────────────
        if (messageType === "cancel_request" || messageType === "cleanup_stale_request") {
          const handled = await handleCancelOrCleanup(
            messageType as 'cancel_request' | 'cleanup_stale_request',
            obj,
            sock
          );
          if (!handled) sendError(sock, "invalid_payload", `Invalid ${messageType}`);
          return;
        }

        // ── start_interview ───────────────────────────────────────────────
        // Initializes an interview session. Calls AI for the first question
        // if the thread is new, or returns the last pending question if in-progress.
        if (messageType === "start_interview") {
          const check = InboundStartInterview.safeParse(obj);
          if (!check.success) {
            return sendError(sock, "invalid_payload", check.error.issues[0]?.message ?? "bad payload");
          }
          const { threadId, userId, activityId } = check.data;

          sock.abortController = new AbortController();

          try {
            // 1) Check if activity is already completed for this user (re-entry guard)
            const completionStatus = await getActivityCompletionStatus(userId, activityId);
            if (completionStatus === 'completed') {
              console.log('[ws] start_interview: activity already completed for user:', userId);
              send(sock, { type: "interview_ended", threadId });
              sock.abortController = undefined;
              return;
            }

            // 2) threadId is pre-resolved by frontend via HTTP — use it directly
            // 3) Check if thread already has an AI interviewer question (in-progress re-entry)
            const lastMsg = await getLastInterviewerAiMessage(threadId);

            if (lastMsg) {
              // In-progress: return existing pending question, no AI call needed
              console.log('[ws] start_interview: in-progress, reusing last question:', lastMsg.id);
              send(sock, {
                type: "interview_question",
                threadId,
                question: lastMsg.content,
                questionMessageId: lastMsg.id,
              });
            } else {
              // Not started: call AI for the first question
              console.log('[ws] start_interview: new thread, calling AI for first question');
              const ai = await generateInterviewReply(threadId, '', userId, activityId);
              console.log('[ws] start_interview: AI response:', ai);

              if (!ai.ok || !ai.replyQuestion) {
                return sendError(sock, "ai_error", ai.error?.message ?? "AI failed to generate first question");
              }

              // Save AI question message (mode=interviewer) to Product DB
              const aiMsg = await appendMessage({
                threadId,
                role: MessageRole.ai,
                mode: MessageMode.interviewer,
                content: ai.replyQuestion,
              });

              // Save to Derived DB
              await createConversationEvent({
                userId,
                threadId,
                refMessageId: aiMsg.id,
                role: MessageRole.ai,
                mode: MessageMode.interviewer,
                content: ai.replyQuestion,
              });

              console.log('[ws] start_interview: first question saved, id:', aiMsg.id);
              send(sock, {
                type: "interview_question",
                threadId,
                question: ai.replyQuestion,
                questionMessageId: aiMsg.id,
              });
            }
          } catch (err: any) {
            console.error('[ws] start_interview failed:', err?.message ?? err);
            sendError(sock, "internal_error", "unexpected server error");
          } finally {
            sock.abortController = undefined;
          }
          return;
        }

        // ── interview_message ─────────────────────────────────────────────
        // User answers the current question. Saves user message, calls AI
        // for the next question, saves AI reply, and pushes interview_question.
        if (messageType === "interview_message") {
          const check = InboundInterviewMessage.safeParse(obj);
          if (!check.success) {
            return sendError(sock, "invalid_payload", check.error.issues[0]?.message ?? "bad payload");
          }
          const { userId, message, activityId } = check.data;
          const effectiveThreadId = check.data.threadId ?? resolvedThreadId;

          sock.abortController = new AbortController();
          const signal = sock.abortController.signal;

          try {
            // 1) Save user answer message (mode=interviewer) to Product DB
            const userMsg = await appendMessage({
              threadId: effectiveThreadId,
              role: MessageRole.user,
              mode: MessageMode.interviewer,
              content: message,
            });
            sock.lastUserMessageId = userMsg.id;

            // Save to Derived DB
            await createConversationEvent({
              userId,
              threadId: effectiveThreadId,
              refMessageId: userMsg.id,
              role: 'user',
              mode: 'interviewer',
              content: message,
            });

            if (signal.aborted) { sock.abortController = undefined; return; }

            // 2) find last AI interviewer message → questionMessageId
            const lastQuestion = await getLastInterviewerAiMessage(effectiveThreadId);
            const questionMessageId = lastQuestion?.id;
            console.log('[ws] interview_message: questionMessageId:', questionMessageId);

            // 3) Call AI for the next question
            const ai = await generateInterviewReply(
              effectiveThreadId,
              message,
              userId,
              activityId,
              userMsg.id,
              questionMessageId,
            );
            console.log('[ws] interview_message: AI response:', ai);

            if (signal.aborted) { sock.abortController = undefined; return; }

            if (!ai.ok) {
              return sendError(sock, "ai_error", ai.error?.message ?? "AI failed to generate next question");
            }

            // 4) Interview ended: AI has no more questions
            if (ai.interviewEnded) {
              console.log('[ws] interview_message: interview ended for thread:', effectiveThreadId);
              send(sock, { type: "interview_ended", threadId: effectiveThreadId, userId, activityId });
              sock.abortController = undefined;
              sock.lastUserMessageId = undefined;
              return;
            }

            if (!ai.replyQuestion) {
              return sendError(sock, "ai_error", "AI returned no question and interview is not ended");
            }

            // 5) Save AI next-question message (mode=interviewer) to Product DB
            const aiMsg = await appendMessage({
              threadId: effectiveThreadId,
              role: MessageRole.ai,
              mode: MessageMode.interviewer,
              content: ai.replyQuestion,
            });

            // Save to Derived DB
            await createConversationEvent({
              userId,
              threadId: effectiveThreadId,
              refMessageId: aiMsg.id,
              role: 'ai',
              mode: 'interviewer',
              content: ai.replyQuestion,
            });

            // 6) Push next question to frontend
            send(sock, {
              type: "interview_question",
              threadId: effectiveThreadId,
              question: ai.replyQuestion,
              questionMessageId: aiMsg.id,
            });

            sock.abortController = undefined;
            sock.lastUserMessageId = undefined;
          } catch (err: any) {
            sock.abortController = undefined;
            sock.lastUserMessageId = undefined;
            console.error('[ws] interview_message failed:', err?.message ?? err);
            sendError(sock, "internal_error", "unexpected server error");
          }
          return;
        }

        // ── user_message (impersonation mode) ────────────────────────────
        if (messageType === "user_message") {
          const check = InboundUserMessage.safeParse(obj);
          if (!check.success) {
            console.log("[ws] invalid payload:", check.error.issues);
            return sendError(sock, "invalid_payload", check.error.issues[0]?.message ?? "bad payload");
          }
          const parsed = check.data;

          // Create abort controller for this request
          sock.abortController = new AbortController();
          const signal = sock.abortController.signal;

          try {

            // ============================================
            // ARCHITECTURE: Real-time Feedback Loop
            // ============================================    

            const effectiveThreadId = await ensureThreadId(
              parsed.threadId ?? resolvedThreadId
            );
            
            // Check if already cancelled
            if (signal.aborted) {
              console.log("[ws] Request was cancelled before AI call");
              sock.abortController = undefined;
              return;
            }
            
            const existingMemories: ExistingMemory[] | undefined = undefined;

            // 1) Write to Product DB (messages table)
            const userMessage = await appendMessage({
              threadId: effectiveThreadId,
              role: MessageRole.user,
              content: parsed.message,
            });
            
            // Store the message ID for potential cancellation cleanup
            sock.lastUserMessageId = userMessage.id;

            // 2) Write to Derived DB (conversation_event table)
            await createConversationEvent({
              userId: parsed.userId,
              threadId: effectiveThreadId,
              refMessageId: userMessage.id,
              role: 'user',
              content: parsed.message,
            });

            // 3) Call AI service
            const ai = await generateChatReply(
              effectiveThreadId, 
              parsed.message, 
              parsed.userId, 
              existingMemories
            );
            console.log(" 111[ws] AI response received:", ai);
            
            // Check if cancelled after AI call
            if (signal.aborted) {
              console.log("[ws] Request was cancelled after AI call, not sending response");
              sock.abortController = undefined;
              return;
            }

            // 4) Immediately send ai_reply event to frontend for instant display
            console.log("$ [ws] Sending ai_reply for instant display");
            send(sock, {
              type: "ai_reply",
              threadId: effectiveThreadId,
              reply: ai.reply,
              ok: ai.ok,
              error: ai.error,
              meta: ai.meta
            });

            // 5) Extract memory operations from AI reply text (background processing)
            // const extractResponse = await extractMemoryOperations(parsed.userId, parsed.message, 'questionMessageId');
            // const memoryOperationFlag = extractResponse.flag;
            // const memoryOperations = extractResponse.memoryOperations ?? [];
            // console.log("111[ws] Memory operation flag:", memoryOperationFlag);
            // console.log("111[ws] Memory operations:", JSON.stringify(memoryOperations, null, 2));

            // 6) Execute memory operations if AI suggested any
            const operationResults: MemoryOperationResult[] = [];
            // if (memoryOperationFlag && memoryOperations && (memoryOperations as any).new_memories) {
            //   for (const newMemory of (memoryOperations as any).new_memories) {
            //     try {
            //       const created = await createMemory({
            //         userId: parsed.userId,
            //         type: 'ai',
            //         content: newMemory.content,
            //         source: 'AI Chat Analysis',
            //         categories: newMemory.categories
            //       });
            //       operationResults.push({
            //         success: true,
            //         memoryId: created.id
            //       });
            //     } catch (opError: any) {
            //       operationResults.push({
            //         success: false,
            //         error: opError?.message || 'Unknown error'
            //       });
            //     }
            //   }
            // }
            
            // 7) Write to Product DB (messages table)
            console.log("[ws] appendMessage (ai)", { threadId: effectiveThreadId, reply: ai.reply, operationResults });
            const aiMessage = await appendMessage({
              threadId: effectiveThreadId,
              role: MessageRole.ai,
              content: ai.reply || '',
            });

            // 8) Write to Derived DB (conversation_event table)
            await createConversationEvent({
              userId: parsed.userId,
              threadId: effectiveThreadId,
              refMessageId: aiMessage.id,
              role: 'ai',
              content: ai.reply || '',
              // memoryOperations: memoryOperations,
              memoryOperations: [],
              operationResults: operationResults,
            });

            // 9) Send operationResults back to AI backend for sync
            // feedbackOperationResultsToAI(effectiveThreadId, parsed.userId, operationResults).catch((err) => {
            //   console.error("[ws] Failed to send feedback to AI backend:", err);
            // });

            // 10) Auto-trigger profile update after memory operations
            // const successCount = memoryOperationFlag ? 1 : 0;
            // console.log(`111[ws] Memory operations completed with ${successCount}`);
            // const updateResult = await handleMemoryOperationUpdateProfile(
            //   parsed.userId,
            //   successCount
            // );
            // console.log('[ws] Profile auto-update status:', updateResult);

            // 11) Send memory_processed event with results
            // if (updateResult.triggered) {
            //   if (updateResult.profileData) {
            //     console.log(`$ [ws] Sending profile_auto_update`);
            //     send(sock, {
            //       type: 'profile_auto_update',
            //       threadId: effectiveThreadId,
            //       message: updateResult.message,
            //       userId: parsed.userId,
            //       timestamp: new Date().toISOString(),
            //       profileData: updateResult.profileData,
            //       reply: ai.reply,
            //       ok: ai.ok,
            //       error: ai.error,
            //       meta: ai.meta,
            //       memoryOperations: memoryOperations,
            //       operationResults: operationResults
            //     });
            //   } else {
            //     console.error(`$ [ws] Profile update triggered but no profileData, sending memory_processed with error`);
            //     send(sock, {
            //       type: "memory_processed",
            //       threadId: effectiveThreadId,
            //       operationResults,
            //       profileAutoUpdate: {
            //         triggered: false,
            //         error: updateResult.error || 'Failed to fetch updated profile'
            //       }
            //     });
            //   }
            // } else {
            //   // Profile NOT auto-updated: send memory_processed event
            //   console.log(`$ [ws] No profile update, sending memory_processed`);
            //   send(sock, {
            //     type: "memory_processed",
            //     threadId: effectiveThreadId,
            //     operationResults,
            //     profileAutoUpdate: undefined
            //   });
            // }
            
            // Clear abort controller and message ID after successful completion
            sock.abortController = undefined;
            sock.lastUserMessageId = undefined;

          } catch (err: any) {
            // Clear abort controller and message ID on error
            sock.abortController = undefined;
            sock.lastUserMessageId = undefined;
            
            console.error("[ws] user_message failed:", err?.message ?? err);
            sendError(sock, "internal_error", "unexpected server error");
          }
          return;
        }

        // ── unknown type ──────────────────────────────────────────────────
        sendError(sock, "unknown_type", `Unknown message type: ${messageType}`);
      });
    })();
  });

  // Clear heartbeat interval when server closes
  wss.on("close", () => clearInterval(interval));
}
