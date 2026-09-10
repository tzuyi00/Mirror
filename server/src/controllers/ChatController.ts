import { Controller, Post, Body, Route, Response } from 'tsoa';
import { MessageRole } from "@prisma/client";
import { MessageMode } from '../generated/product/index.js';
import { ChatRequest, ChatReplyResponse, ProcessMemoryRequest, ProcessMemoryResponse, InterviewMessageResponse, InterviewStartRequest, InterviewStartResponse, GenerateRequest, GenerateResponse, GreetingRequest, GreetingResponse } from '../dtos/ChatDTOs.js';
import { requestContext } from '../middleware/requestContext.js';
import {
  generateChatReply,
  generateInterviewReply,
  extractMemoryOperations,
  ExistingMemory,
  MemoryOperationResult,
  feedbackOperationResultsToAI,
} from "../aiService.js";
import { createThread, appendMessage, deleteMessage, getLatestThreadForUser, getLastInterviewerAiMessage } from "../services/chatService.js";
import { handleMemoryOperationUpdateProfile } from "../services/profileAutoUpdateService.js";
import { createConversationEvent, deleteConversationEventByRefMessageId } from "../services/conversationEventService.js";
import { getActivityCompletionStatus } from "../services/activityService.js";

/**
 * Helper function to clean up a user message from both databases
 * Used when a request is cancelled/aborted
 */
async function deleteUserMessageFromDatabases(messageId: string): Promise<void> {
  try {
    // 1) Delete from Derived DB (conversation_event)
    await deleteConversationEventByRefMessageId(messageId);
    
    // 2) Delete from Product DB (messages table)
    await deleteMessage(messageId);
    
    console.log("[ChatController] Successfully deleted user message:", messageId);
  } catch (err: any) {
    console.error("[ChatController] Failed to delete user message:", err?.message);
  }
}

/**
 * Proactive greeting messages for re-engagement
 */
const MOCK_GREETINGS: string[] = [
  "(Me2)Hey, it's been a while! 👋 How have you been? I've been thinking about you.",
  "(Me2)Hi there! 😊 We haven't chatted in a few days — anything new going on?",
  "(Me2)Just checking in! 🌟 I'm here whenever you feel like talking.",
  "(Me2)It's been quiet without you! 💬 Hope everything's going well on your end.",
  "(Me2)Hey! I noticed we haven't talked recently. Feel free to drop a message anytime! 🙌",
];

@Route('api')
export class ChatController extends Controller {
  /**
   * /api/chat/reply
   * Send a message to the AI and receive only the reply text
   * @param request The chat request containing userId, message, and optional threadId
   * @returns Simple response with AI reply text
   */
  @Post('chat/reply')
  @Response<ChatReplyResponse>(400, 'Bad Request')
  @Response<ChatReplyResponse>(502, 'AI Service Error')
  async reply(
    @Body() request: ChatRequest
  ): Promise<ChatReplyResponse> {
    try {
      const { threadId: tid, message, userId } = request;

      // Get the request context from AsyncLocalStorage (set by middleware)
      const context = requestContext.getStore();
      const abortController = context?.abortController;
      const signal = abortController?.signal;
      const res = context?.response;

      // Helper function to check if client is still connected
      const isClientConnected = () => {
        if (!res) return true; // Default to true if no response object
        // Check if response is writable (client still connected)
        return res.writable && !res.writableEnded && !res.destroyed;
      };

      // If client already disconnected, abort immediately
      if (!isClientConnected()) {
        console.log('[HTTP Reply] Client already disconnected at start');
        abortController?.abort();
      }

      // Validate required fields
      if (!message) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "message required" },
          meta: {
            userId: userId ?? "unknown",
            threadId: tid ?? "unknown",
            createdAt: new Date().toISOString(),
          },
        };
      }

      if (!userId) {
        this.setStatus(400);
        return {
          ok: false,
          error: {
            code: "invalid_input",
            message: "userId required",
          },
          meta: {
            userId: "unknown",
            threadId: tid ?? "unknown",
            createdAt: new Date().toISOString(),
          },
        };
      }

      // No threadId → first look for an existing thread for the user, create one if none exists
      const threadId = tid ?? (await getLatestThreadForUser(userId))?.id ?? (await createThread(userId)).id;
      const existingMemories: ExistingMemory[] | undefined = undefined;

      // 1) Write to Product DB (messages table)
      const userMessage = await appendMessage({
        threadId,
        role: MessageRole.user,
        content: message,
      });

      // Check if client disconnected during DB write
      if (!isClientConnected()) {
        console.log('[HTTP Reply] Client disconnected after saving user message');
        abortController?.abort();
      }

      // Check if request was cancelled after saving user message
      if (signal?.aborted) {
        console.log("[HTTP Reply] Request cancelled after saving user message, cleaning up...");
        await deleteUserMessageFromDatabases(userMessage.id);

        this.setStatus(499); // Client Closed Request
        return {
          ok: false,
          error: { code: "request_aborted", message: "Request was cancelled by client" },
          meta: {
            userId,
            threadId,
            createdAt: new Date().toISOString(),
          },
        };
      }

      // 2) Write to Derived DB (conversation_event table)
      await createConversationEvent({
        userId,
        threadId,
        refMessageId: userMessage.id,
        role: 'user',
        content: message,
      });

      // 3) Call AI service (only for reply text)
      const ai = await generateChatReply(
        threadId,
        message,
        userId,
        existingMemories
      );
      console.log('[HTTP Reply] AI response received', ai);

      // Check if client disconnected during AI processing
      if (!isClientConnected()) {
        console.log('[HTTP Reply] Client disconnected after AI response');
        abortController?.abort();
      }

      // Check if request was cancelled after AI response
      if (signal?.aborted) {
        console.log("[HTTP Reply] Request cancelled after AI response, cleaning up user message...");
        await deleteUserMessageFromDatabases(userMessage.id);

        this.setStatus(499); // Client Closed Request
        return {
          ok: false,
          error: { code: "request_aborted", message: "Request was cancelled by client" },
          meta: {
            userId,
            threadId,
            createdAt: new Date().toISOString(),
          },
        };
      }

      return {
        ok: ai.ok,
        reply: ai.reply,
        error: ai.error,
        meta: {
          ...ai.meta,
          messageId: userMessage.id, // Return user message ID for potential cancellation
        }
      };
    } catch (e: any) {
      console.error('[HTTP Reply] Error:', e);
      this.setStatus(502);
      return {
        ok: false,
        error: { code: "reply_only_failed", message: e?.message ?? String(e) },
        meta: {
          userId: "unknown",
          threadId: "unknown",
          createdAt: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * /api/chat/process-memory
   * Process memory operations for a given AI reply text
   * @param request The memory processing request
   * @returns Memory operation results and profile auto-update info
   */
  @Post('chat/process-memory')
  @Response<ProcessMemoryResponse>(400, 'Bad Request')
  @Response<ProcessMemoryResponse>(502, 'Server Error')
  async processMemory(
    @Body() request: ProcessMemoryRequest
  ): Promise<ProcessMemoryResponse> {
    console.log('[HTTP Process-Memory] Request received:', JSON.stringify(request, null, 2));
    try {
      const { threadId, userId, replyText, source = "conversation" } = request;

      // Validate required fields
      if (!threadId || !userId || !replyText) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "threadId, userId, and replyText are required" },
        };
      }

      // 1) Extract memory operations from AI reply text
      // const extractResponse = await extractMemoryOperations(userId, request.userMessage || '', 'questionMessageId');
      // const memoryOperationFlag = extractResponse.flag;
      // const memoryOperations = extractResponse.memoryOperations ?? [];
      // console.log("111[HTTP Process-Memory] Memory operation flag:", memoryOperationFlag);
      // console.log("111[HTTP Process-Memory] Memory operations:", JSON.stringify(memoryOperations, null, 2));

      // 2) Execute memory operations if AI suggested any
      const operationResults: MemoryOperationResult[] = [];
      // if (memoryOperationFlag && memoryOperations && (memoryOperations as any).new_memories) {
      //   for (const newMemory of (memoryOperations as any).new_memories) {
      //     try {
      //       const created = await createMemory({
      //         userId: userId,
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

      // 3) Write to Product DB (messages table)
      console.log("[HTTP Process-Memory] appendMessage (ai)", { threadId, reply: replyText, operationResults });
      const aiMessage = await appendMessage({
        threadId,
        role: MessageRole.ai,
        content: replyText || '',
      });

      // 4) Write to Derived DB (conversation_event table)
      await createConversationEvent({
        userId,
        threadId,
        refMessageId: aiMessage.id,
        role: 'ai',
        content: replyText || '',
        // memoryOperations: memoryOperations,
        memoryOperations: [],
        operationResults: operationResults,
      });

      // 5) Send operationResults back to AI backend for sync
      // feedbackOperationResultsToAI(threadId, userId, operationResults).catch((err) => {
      //   console.error("[HTTP Process-Memory] Failed to send feedback to AI backend:", err);
      // });

      // 6) Auto-trigger profile update after memory operations
      // const successCount = memoryOperationFlag ? 1 : 0;
      // console.log(`[HTTP Process-Memory] Memory operations completed with ${successCount}`);
      // const updateResult = await handleMemoryOperationUpdateProfile(
      //   userId,
      //   successCount
      // );
      // console.log('[HTTP Process-Memory] Profile auto-update status:', updateResult);

      return {
        ok: true,
        operationResults,
        // profileAutoUpdate: updateResult.triggered ? {
        //   triggered: true,
        //   message: updateResult.message,
        //   profileData: updateResult.profileData
        // } : undefined
      };
    } catch (e: any) {
      console.error('[HTTP Process-Memory] Error:', e);
      this.setStatus(502);
      return {
        ok: false,
        error: { code: "process_memory_failed", message: e?.message ?? String(e) },
      };
    }
  }

  /**
   * /api/chat/start-interview
   * Initializes an interview session: returns the existing pending question if
   * the thread is already in-progress, otherwise calls AI for the first question,
   * saves it to both DBs, and returns it.
   * @param request The start interview request
   * @returns First (or existing pending) interview question
   */
  @Post('chat/start-interview')
  @Response<InterviewStartResponse>(400, 'Bad Request')
  @Response<InterviewStartResponse>(502, 'AI Service Error')
  async startInterview(
    @Body() request: InterviewStartRequest
  ): Promise<InterviewStartResponse> {
    try {
      const { threadId, userId, activityId } = request;

      // Validate required fields
      if (!threadId) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "threadId required" },
          meta: { userId: userId ?? "unknown", threadId: "unknown", createdAt: new Date().toISOString() },
        };
      }

      if (!userId) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "userId required" },
          meta: { userId: "unknown", threadId, createdAt: new Date().toISOString() },
        };
      }

      if (!activityId) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "activityId required" },
          meta: { userId, threadId, createdAt: new Date().toISOString() },
        };
      }

      // 1) Check if activity is already completed for this user (re-entry guard)
      const completionStatus = await getActivityCompletionStatus(userId, activityId);
      if (completionStatus === 'completed') {
        console.log('[HTTP StartInterview] Activity already completed for user:', userId);
        return {
          ok: true,
          interviewEnded: true,
          meta: { userId, threadId, createdAt: new Date().toISOString() },
        };
      }

      // 2) Check if thread already has an AI interviewer question (in-progress re-entry)
      const lastMsg = await getLastInterviewerAiMessage(threadId);

      if (lastMsg) {
        // In-progress: return existing pending question, no AI call needed
        console.log('[HTTP StartInterview] In-progress, reusing last question:', lastMsg.id);
        return {
          ok: true,
          replyQuestion: lastMsg.content,
          questionMessageId: lastMsg.id,
          meta: {
            userId,
            threadId,
            messageId: lastMsg.id,
            createdAt: new Date().toISOString(),
          },
        };
      }

      // 3) New thread: call AI for the first question
      console.log('[HTTP StartInterview] New thread, calling AI for first question');
      const ai = await generateInterviewReply(threadId, '', userId, activityId);
      console.log('[HTTP StartInterview] AI response:', ai);

      if (!ai.ok || !ai.replyQuestion) {
        this.setStatus(502);
        return {
          ok: false,
          error: ai.error ?? { code: "ai_error", message: "AI failed to generate first question" },
          meta: { userId, threadId, createdAt: new Date().toISOString() },
        };
      }

      // 3) Save AI first-question to Product DB (mode=interviewer)
      const aiMsg = await appendMessage({
        threadId,
        role: MessageRole.ai,
        mode: MessageMode.interviewer,
        content: ai.replyQuestion,
      });

      // 4) Save AI first-question to Derived DB (mode=interviewer)
      await createConversationEvent({
        userId,
        threadId,
        refMessageId: aiMsg.id,
        role: 'ai',
        mode: 'interviewer',
        content: ai.replyQuestion,
      });

      console.log('[HTTP StartInterview] First question saved, id:', aiMsg.id);

      return {
        ok: true,
        replyQuestion: ai.replyQuestion,
        questionMessageId: aiMsg.id,
        meta: {
          ...ai.meta,
          messageId: aiMsg.id,
        },
      };
    } catch (e: any) {
      console.error('[HTTP StartInterview] Error:', e);
      this.setStatus(502);
      return {
        ok: false,
        error: { code: "start_interview_failed", message: e?.message ?? String(e) },
        meta: { userId: "unknown", threadId: "unknown", createdAt: new Date().toISOString() },
      };
    }
  }

  /**
   * /api/chat/interview
   * User submits an answer; server saves it, calls AI for the next question,
   * saves the AI question to both DBs, and returns it.
   * @param request The interview message request
   * @returns Next interview question from AI
   */
  @Post('chat/interview')
  @Response<InterviewMessageResponse>(400, 'Bad Request')
  @Response<InterviewMessageResponse>(502, 'AI Service Error')
  async interview(
    @Body() request: ChatRequest & { activityId: string }
  ): Promise<InterviewMessageResponse> {
    try {
      const { threadId: tid, message, userId, activityId } = request;

      // Get the request context from AsyncLocalStorage (set by middleware)
      const context = requestContext.getStore();
      const abortController = context?.abortController;
      const signal = abortController?.signal;
      const res = context?.response;

      // Helper function to check if client is still connected
      const isClientConnected = () => {
        if (!res) return true;
        return res.writable && !res.writableEnded && !res.destroyed;
      };

      // If client already disconnected, abort immediately
      if (!isClientConnected()) {
        console.log('[HTTP Interview] Client already disconnected at start');
        abortController?.abort();
      }

      // Validate required fields
      if (!message) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "message required" },
          meta: { userId: userId ?? "unknown", threadId: tid ?? "unknown", createdAt: new Date().toISOString() },
        };
      }

      if (!userId) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "userId required" },
          meta: { userId: "unknown", threadId: tid ?? "unknown", createdAt: new Date().toISOString() },
        };
      }

      if (!activityId) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "activityId required for interview mode" },
          meta: { userId, threadId: tid ?? "unknown", createdAt: new Date().toISOString() },
        };
      }

      // threadId MUST be pre-resolved by the frontend
      if (!tid) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "threadId required for interview mode" },
          meta: { userId, threadId: "unknown", createdAt: new Date().toISOString() },
        };
      }

      const threadId = tid;

      // 1) Save user answer to Product DB (mode=interviewer)
      const userMessage = await appendMessage({
        threadId,
        role: MessageRole.user,
        mode: MessageMode.interviewer,
        content: message,
      });
      console.log('[HTTP Interview] Saved user message:', userMessage.id);

      // Check if client disconnected during DB write
      if (!isClientConnected()) {
        console.log('[HTTP Interview] Client disconnected after saving user message');
        abortController?.abort();
      }

      // Check if request was cancelled after saving user message
      if (signal?.aborted) {
        console.log('[HTTP Interview] Request cancelled after saving user message, cleaning up...');
        await deleteUserMessageFromDatabases(userMessage.id);
        this.setStatus(499);
        return {
          ok: false,
          error: { code: "request_aborted", message: "Request was cancelled by client" },
          meta: { userId, threadId, createdAt: new Date().toISOString() },
        };
      }

      // 2) Save user answer to Derived DB (mode=interviewer)
      await createConversationEvent({
        userId,
        threadId,
        refMessageId: userMessage.id,
        role: 'user',
        mode: 'interviewer',
        content: message,
      });

      // 3) Get the last AI question → questionMessageId
      const lastQuestion = await getLastInterviewerAiMessage(threadId);
      const questionMessageId = lastQuestion?.id;
      console.log('[HTTP Interview] questionMessageId:', questionMessageId);

      // 4) Call AI for the next interview question
      const ai = await generateInterviewReply(
        threadId,
        message,
        userId,
        activityId,
        userMessage.id,
        questionMessageId,
      );
      console.log('[HTTP Interview] AI response received', ai);

      // Check if client disconnected during AI processing
      if (!isClientConnected()) {
        console.log('[HTTP Interview] Client disconnected after AI response');
        abortController?.abort();
      }

      // Check if request was cancelled after AI response
      if (signal?.aborted) {
        console.log('[HTTP Interview] Request cancelled after AI response, cleaning up user message...');
        await deleteUserMessageFromDatabases(userMessage.id);
        this.setStatus(499);
        return {
          ok: false,
          error: { code: "request_aborted", message: "Request was cancelled by client" },
          meta: { userId, threadId, createdAt: new Date().toISOString() },
        };
      }

      if (!ai.ok) {
        this.setStatus(502);
        return {
          ok: false,
          error: ai.error ?? { code: "ai_error", message: "AI failed to generate next question" },
          meta: { userId, threadId, createdAt: new Date().toISOString() },
        };
      }

      // 5) Interview ended: no AI message to save, return ended flag
      if (ai.interviewEnded) {
        console.log('[HTTP Interview] Interview ended for user:', userId, 'activity:', activityId);
        return {
          ok: true,
          interviewEnded: true,
          meta: {
            ...ai.meta,
            messageId: userMessage.id,
          },
        };
      }

      // Activity status updates will be handled by frontend
      // Frontend will fetch updated status via getActivityStatus API when interview ends

      // 6) Save AI next-question to Product DB (mode=interviewer)
      const aiMsg = await appendMessage({
        threadId,
        role: MessageRole.ai,
        mode: MessageMode.interviewer,
        content: ai.replyQuestion!,
      });

      // 7) Save AI next-question to Derived DB (mode=interviewer)
      await createConversationEvent({
        userId,
        threadId,
        refMessageId: aiMsg.id,
        role: 'ai',
        mode: 'interviewer',
        content: ai.replyQuestion!,
      });

      console.log('[HTTP Interview] Saved AI question:', aiMsg.id);

      return {
        ok: true,
        replyQuestion: ai.replyQuestion,
        interviewEnded: false,
        questionMessageId: aiMsg.id,
        meta: {
          ...ai.meta,
          messageId: userMessage.id,
        },
      };
    } catch (e: any) {
      console.error('[HTTP Interview] Error:', e);
      this.setStatus(502);
      return {
        ok: false,
        error: { code: "interview_failed", message: e?.message ?? String(e) },
        meta: { userId: "unknown", threadId: "unknown", createdAt: new Date().toISOString() },
      };
    }
  }

  /**
   * /api/chat/generate
   * Combined endpoint for sending a message and processing memory operations.
   * Saves user message to both DBs, calls AI, saves AI reply to both DBs,
   * and executes any memory operations in one request.
   * @param request The generate request containing userId, message, and optional threadId
   * @returns AI reply and memory operation results
   */
  @Post('chat/generate')
  @Response<GenerateResponse>(400, 'Bad Request')
  @Response<GenerateResponse>(502, 'AI Service Error')
  async generate(
    @Body() request: GenerateRequest
  ): Promise<GenerateResponse> {
    try {
      const { threadId: tid, message, userId, source = "conversation" } = request;

      // Get the request context from AsyncLocalStorage (set by middleware)
      const context = requestContext.getStore();
      const abortController = context?.abortController;
      const signal = abortController?.signal;
      const res = context?.response;

      // Helper function to check if client is still connected
      const isClientConnected = () => {
        if (!res) return true;
        return res.writable && !res.writableEnded && !res.destroyed;
      };

      // If client already disconnected, abort immediately
      if (!isClientConnected()) {
        console.log('[HTTP Generate] Client already disconnected at start');
        abortController?.abort();
      }

      // Validate required fields
      if (!message) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "message required" },
          meta: {
            userId: userId ?? "unknown",
            threadId: tid ?? "unknown",
            createdAt: new Date().toISOString(),
          },
        };
      }

      if (!userId) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "userId required" },
          meta: {
            userId: "unknown",
            threadId: tid ?? "unknown",
            createdAt: new Date().toISOString(),
          },
        };
      }

      // No threadId → first look for an existing thread for the user, create one if none exists
      const threadId = tid ?? (await getLatestThreadForUser(userId))?.id ?? (await createThread(userId)).id;
      const existingMemories: ExistingMemory[] | undefined = undefined;

      // Check if already cancelled
      if (signal?.aborted) {
        console.log('[HTTP Generate] Request already cancelled at validation');
        this.setStatus(499);
        return {
          ok: false,
          error: { code: "request_aborted", message: "Request was cancelled by client" },
          meta: {
            userId,
            threadId,
            createdAt: new Date().toISOString(),
          },
        };
      }

      // 1) Write to Product DB (messages table)
      const userMessage = await appendMessage({
        threadId,
        role: MessageRole.user,
        content: message,
      });

      // Check if client disconnected during DB write
      if (!isClientConnected()) {
        console.log('[HTTP Generate] Client disconnected after saving user message');
        abortController?.abort();
      }

      // Check if request was cancelled after saving user message
      if (signal?.aborted) {
        console.log('[HTTP Generate] Request cancelled after saving user message, cleaning up...');
        await deleteUserMessageFromDatabases(userMessage.id);
        this.setStatus(499);
        return {
          ok: false,
          error: { code: "request_aborted", message: "Request was cancelled by client" },
          meta: {
            userId,
            threadId,
            createdAt: new Date().toISOString(),
          },
        };
      }

      // 2) Write to Derived DB (conversation_event table)
      await createConversationEvent({
        userId,
        threadId,
        refMessageId: userMessage.id,
        role: 'user',
        content: message,
      });

      // 3) Call AI service
      const ai = await generateChatReply(
        threadId,
        message,
        userId,
        existingMemories
      );
      console.log('[HTTP Generate] AI response received:', ai);

      // Check if client disconnected during AI processing
      if (!isClientConnected()) {
        console.log('[HTTP Generate] Client disconnected after AI response');
        abortController?.abort();
      }

      // Check if request was cancelled after AI response
      if (signal?.aborted) {
        console.log('[HTTP Generate] Request cancelled after AI response, cleaning up user message...');
        await deleteUserMessageFromDatabases(userMessage.id);
        this.setStatus(499);
        return {
          ok: false,
          error: { code: "request_aborted", message: "Request was cancelled by client" },
          meta: {
            userId,
            threadId,
            createdAt: new Date().toISOString(),
          },
        };
      }

      // 5) Execute memory operations if AI suggested any
      const operationResults: MemoryOperationResult[] = [];

      // 6) Write to Product DB (messages table)
      console.log('[HTTP Generate] appendMessage (ai)', { threadId, reply: ai.reply, operationResults });
      const aiMessage = await appendMessage({
        threadId,
        role: MessageRole.ai,
        content: ai.reply || '',
      });

      // 7) Write to Derived DB (conversation_event table)
      await createConversationEvent({
        userId,
        threadId,
        refMessageId: aiMessage.id,
        role: 'ai',
        content: ai.reply || '',
        memoryOperations: [],
        operationResults: operationResults,
      });

      return {
        ok: ai.ok,
        reply: ai.reply,
        error: ai.error,
        operationResults,
        meta: {
          ...ai.meta,
          messageId: userMessage.id,
        }
      };
    } catch (e: any) {
      console.error('[HTTP Generate] Error:', e);
      this.setStatus(502);
      return {
        ok: false,
        error: { code: "generate_failed", message: e?.message ?? String(e) },
        meta: {
          userId: "unknown",
          threadId: "unknown",
          createdAt: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * /api/greeting/generate
   * Request a proactive greeting message for user re-engagement.
   * Called when a user's coldness index exceeds the threshold.
   * @param request The greeting request containing userId and threadId
   * @returns Greeting message text randomly selected from MOCK_GREETINGS
   */
  @Post('greeting/generate')
  @Response<GreetingResponse>(400, 'Bad Request')
  @Response<GreetingResponse>(502, 'Server Error')
  async getGreeting(
    @Body() request: GreetingRequest
  ): Promise<GreetingResponse> {
    try {
      const { userId, threadId } = request;

      // Validate required fields
      if (!userId) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "userId required" },
          meta: {
            userId: "unknown",
            threadId: threadId ?? "unknown",
            createdAt: new Date().toISOString(),
          },
        };
      }

      if (!threadId) {
        this.setStatus(400);
        return {
          ok: false,
          error: { code: "invalid_input", message: "threadId required" },
          meta: {
            userId,
            threadId: "unknown",
            createdAt: new Date().toISOString(),
          },
        };
      }

      // Select a random greeting from MOCK_GREETINGS
      const randomIndex = Math.floor(Math.random() * MOCK_GREETINGS.length);
      const greeting = MOCK_GREETINGS[randomIndex];

      console.log('[HTTP Greeting] Generated greeting for user:', userId, 'greeting:', greeting);

      return {
        ok: true,
        greeting,
        meta: {
          userId,
          threadId,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (e: any) {
      console.error('[HTTP Greeting] Error:', e);
      this.setStatus(502);
      return {
        ok: false,
        error: { code: "greeting_generation_failed", message: e?.message ?? String(e) },
        meta: {
          userId: "unknown",
          threadId: "unknown",
          createdAt: new Date().toISOString(),
        },
      };
    }
  }
}


