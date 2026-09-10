import axios from "axios";

import { 
  getChatResponseStub, 
  getSynchronizedStubs,
  getInterviewResponseStub,
  getMemoryExtractResponseStub,
  type StubProfile,
  type AIReply,
  type AIError,
  type MemoryOperation,
  type MemoryOperationType,
  type ExistingMemory,
  type MemoryOperationResult,
  type MemoryExtractResponse,
  type QuestionType,
  type NewMemory,
  type MemoryOperationsExtract,
  type InterviewReply
} from "./stubs/index.js";

// Additional module types (not in stubs)
export type Module = TextModule | ImageModule | AudioModule | DocumentModule | ChartModule;
export type TextModule = { type: 'text'; content: string };
export type ImageModule = { type: 'image'; url: string };
export type AudioModule = { type: 'audio'; url: string };
export type DocumentModule = { type: 'document'; url: string };
export type ChartModule = { type: 'chart'; data: unknown };

// Re-export types for backward compatibility
export type { 
  AIReply,
  AIError,
  MemoryOperation,
  MemoryOperationType,
  ExistingMemory,
  MemoryOperationResult,
  MemoryExtractResponse,
  QuestionType,
  NewMemory,
  MemoryOperationsExtract,
  InterviewReply
} from "./stubs/index.js";

const AI_BASE = process.env.AI_BASE_URL;

// ============================================
// Chat Response from AI Service
// ============================================

/**
 * Main entry point for calling AI service
 * This is the public API used by routes and WebSocket handlers
 * 
 * @param threadId - Thread identifier
 * @param message - User's message
 * @param userId - User identifier (REQUIRED for memory management)
 * @param existingMemories - Optional: User's current memories (only when AI requests sync)
 * @returns AIReply with chat response
 */
export async function generateChatReply(
  threadId: string,
  message: string,
  userId: string,
  existingMemories?: ExistingMemory[]
): Promise<AIReply> {
  // Validate input
  if (!message || !message.trim()) {
    return {
      ok: false,
      error: { code: "invalid_input", message: "message required" },
      meta: { userId, threadId, createdAt: new Date().toISOString() },
    };
  }
  
  // Use new stub system if no AI_BASE is configured
  if (!AI_BASE) {
    return generateChatReplyStub(message, userId, threadId, existingMemories);
  }
  
  // Try to call actual AI service
  const _started = Date.now();
  try {
    // Call /generate to get reply_text
    const generateResponse = await axios.post(
      `${AI_BASE}/generate`,
      { threadId, message, userId, existingMemories }, // existingMemories may be undefined
      { timeout: 300000 }
    );

    if (!generateResponse.data || typeof generateResponse.data.ok !== "boolean" || !generateResponse.data.reply) {
      throw new Error("Invalid generate response: must contain reply");
    }

    const replyText = generateResponse.data.reply;
    const generateMeta = generateResponse.data.meta || {};

    // Return reply_text with empty memoryOperations (will be extracted separately)
    const aiReply: AIReply = {
      ok: true,
      reply: replyText,
      meta: {
        userId,
        threadId,
        createdAt: generateMeta.createdAt || new Date().toISOString(),
        model: generateMeta.model || 'unknown',
        latency_ms: Date.now() - _started
      }
    };

    return aiReply;
  } catch (err: any) {
    console.warn("[AI] Real AI service failed, falling back to stub:", err?.message ?? err);
    // Fallback to stub on error
    return generateChatReplyStub(message, userId, threadId, existingMemories);
  }
}

export async function generateChatReplyStub(
  message: string,
  userId: string,
  threadId: string,
  existingMemories?: ExistingMemory[]
): Promise<AIReply> {
  const startTime = Date.now()
  
  try {
    const AIReplyDelay = 1000
    await new Promise(resolve => setTimeout(resolve, AIReplyDelay))
    
    const response = getChatResponseStub(message, userId, threadId)
    // response.memoryOperations = []
    response.meta.latency_ms = Date.now() - startTime
    
    console.log(`[AI Chat Response] Generated reply text for user ${userId}, message: "${message}"`)
    
    return response
  } catch (error: any) {
    console.error('[AI Chat Response] Error:', error)
    
    const now = new Date().toISOString()
    return {
      ok: false,
      error: {
        code: 'chat_response_failed',
        message: 'Failed to generate chat response from AI',
        retryable: true,
        details: { reason: error?.message ?? String(error) }
      },
      meta: {
        userId,
        threadId,
        createdAt: now,
        model: 'stub-chat-v1',
        latency_ms: Date.now() - startTime
      }
    }
  }
}

// ============================================
// Interview Response from AI Service
// ============================================

/**
 * Generate interview response from AI service
 * 
 * @param threadId - Thread identifier
 * @param userMessage - User's message/answer (NULL for start activity)
 * @param userId - User identifier
 * @param activityId - Activity identifier
 * @param userMessageId - ID of user's message (NULL for start activity)
 * @param questionMessageId - ID of question message (NULL for start activity)
 * @returns InterviewReply with interview response
 */
export async function generateInterviewReply(
  threadId: string,
  userMessage: string,
  userId: string,
  activityId: string,
  userMessageId?: string,
  questionMessageId?: string
): Promise<InterviewReply> {

  // Use new stub system if no AI_BASE is configured
  if (!AI_BASE) {
    return generateInterviewReplyStub(threadId, userMessage, userId, activityId, userMessageId, questionMessageId);
  }
  // Try to call actual AI service
  const _started = Date.now();
  try {
    // Call /interview to get interview response
    const interviewResponse = await axios.post(
      `${AI_BASE}/interview`,
      { threadId, userMessage, userId, activityId, userMessageId, questionMessageId },
      { timeout: 120000 }
    );

    if (!interviewResponse.data || typeof interviewResponse.data.ok !== "boolean") {
      throw new Error("Invalid interview response: missing ok field");
    }

    // interviewEnded=true means the interview is complete; replyQuestion will be absent
    const interviewEnded: boolean = interviewResponse.data.interviewEnded === true;
    if (!interviewEnded && !interviewResponse.data.replyQuestion) {
      throw new Error("Invalid interview response: must contain replyQuestion when interviewEnded is false");
    }

    const replyText = interviewResponse.data.replyQuestion;
    const interviewMeta = interviewResponse.data.meta || {};

    // Return interview response
    const aiReply: InterviewReply = {
      ok: true,
      replyQuestion: replyText,
      interviewEnded,
      meta: {
        userId,
        threadId,
        createdAt: interviewMeta.createdAt || new Date().toISOString(),
        model: interviewMeta.model || 'unknown',
        latency_ms: Date.now() - _started
      }
    };

    return aiReply;
  } catch (err: any) {
    console.warn("[AI] Real AI interview service failed, falling back to stub:", err?.message ?? err);
    // Fallback to stub on error
    return generateInterviewReplyStub(threadId, userMessage, userId, activityId, userMessageId, questionMessageId);
  }
}

export async function generateInterviewReplyStub(
  threadId: string,
  userMessage: string,
  userId: string,
  activityId: string,
  userMessageId?: string,
  questionMessageId?: string
): Promise<InterviewReply> {
  const startTime = Date.now()
  
  try {
    const AIReplyDelay = 1000
    await new Promise(resolve => setTimeout(resolve, AIReplyDelay))
    
    const response = getInterviewResponseStub(userMessage, userId, threadId, activityId, userMessageId, questionMessageId)
    response.meta.latency_ms = Date.now() - startTime
    
    console.log(`[AI Interview Response] Generated replyQuestion for user ${userId}, message: "${userMessage}"`)
    
    return response
  } catch (error: any) {
    console.error('[AI Interview Response] Error:', error)
    
    const now = new Date().toISOString()
    return {
      ok: false,
      error: {
        code: 'interview_response_failed',
        message: 'Failed to generate interview response from AI',
        retryable: true,
        details: { reason: error?.message ?? String(error) }
      },
      meta: {
        userId,
        threadId,
        createdAt: now,
        model: 'stub-interview-v1',
        latency_ms: Date.now() - startTime
      }
    }
  }
}

// ============================================
// Memory Operations Extraction from AI Service
// ============================================

/**
 * Extract memory operations from AI service
 * 
 * @param userId - User identifier
 * @param userMessage - User's message to extract memories from
 * @param questionMessageId - The question's ID in the message table
 * @returns MemoryExtractResponse with extracted memories
 */
export async function extractMemoryOperations(
  userId: string,
  userMessage: string,
  questionMessageId: string
): Promise<MemoryExtractResponse> {
  // Use stub system if no AI_BASE is configured
  if (!AI_BASE) {
    return extractMemoryOperationsStub(userId, userMessage, questionMessageId);
  }

  try {
    console.log("[AI Memory Extract] Request:", { userId, userMessage, questionMessageId });
    const extractResponse = await axios.post(
      `${AI_BASE}/memory/extract`,
      { userId, userMessage, questionMessageId },
      { timeout: 60000 }
    );

    if (!extractResponse.data || typeof extractResponse.data.ok !== "boolean") {
      throw new Error("Invalid memory extract response");
    }

    return extractResponse.data as MemoryExtractResponse;
  } catch (err: any) {
    console.warn("[AI Memory Extract] Failed, falling back to stub:", err?.message ?? err);
    return extractMemoryOperationsStub(userId, userMessage, questionMessageId);
  }
}

/**
 * Extract memory operations from AI reply text (stub version)
 * 
 * @param userId - User identifier
 * @param userMessage - User's message to extract memories from
 * @param questionMessageId - ID of the question message
 * @returns MemoryExtractResponse with extracted memories
 */
export async function extractMemoryOperationsStub(
  userId: string,
  userMessage: string,
  questionMessageId: string
): Promise<MemoryExtractResponse> {
  try {
    // Simulate processing delay
    const startTime = Date.now()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Get stub response
    const stubResponse = getMemoryExtractResponseStub(userId)
    stubResponse.meta.latency_ms = Date.now() - startTime
    
    console.log(`[AI Memory Extract Stub] Extracted ${stubResponse.memoryOperations.new_memories.length} memories for user ${userId}`)
    return stubResponse
  } catch (error: any) {
    console.error('[AI Memory Extract Stub] Error:', error)
    const now = new Date().toISOString()
    return {
      ok: false,
      memoryOperations: {
        new_memories: []
      },
      questionType: 'STANDARD' as QuestionType,
      memoryExtracted: false,
      flag: false,
      meta: {
        userId,
        source: 'conversation',
        latency_ms: Date.now() - Date.parse(now),
        createdAt: now
      }
    }
  }
}

// ============================================
// Chat Feedback results to AI Service
// ============================================

/**
 * Send operation results back to AI service for immediate sync
 * This allows AI to update its own memory database with real memoryIds
 * 
 * @param threadId - Thread identifier
 * @param userId - User identifier
 * @param operationResults - Results of memory operations executed by Node.js
 * @param source - Source of the operation
 * @returns true if sent successfully, false if skipped or failed
 */
export async function feedbackOperationResultsToAI(
  threadId: string,
  userId: string,
  operationResults: MemoryOperationResult[],
  source: string = 'conversation'
): Promise<boolean> {
  // Only send if AI_BASE is configured
  if (!AI_BASE) {
    console.log('[AI Feedback] No AI_BASE configured, skipping feedback (stub mode)');
    return false;
  }

  if (!operationResults || operationResults.length === 0) {
    console.log('[AI Feedback] No operation results to send');
    return true; // No-op, but not a failure
  }

  try {
    console.log(`[AI Feedback] Sending ${operationResults.length} operation results to AI backend...`);
    
    const response = await axios.post(
      `${AI_BASE}/feedback/operations`,
      { 
        threadId, 
        userId,
        operationResults, 
        source
      },
      { timeout: 5000 }
    );

    console.log('[AI Feedback] Successfully sent operation results to AI backend', response.data);
    return true;
  } catch (err: any) {
    console.warn('[AI Feedback] Failed to send operation results to AI backend:', err?.message ?? err);
    return false;
  }
}

// ============================================
// Sync Manual Memory Operations to AI Service
// ============================================

export interface MemorySyncOperation {
  type: 'create' | 'update' | 'delete'
  memoryId: string
  content?: string
  source?: string
  categories?: string[]
  deleteMode?: 'soft' | 'hard'  // For delete operations
  createdAt: string
}

/**
 * Sync manual memory operations to AI service
 * Used when user manually creates/updates/deletes memories
 * 
 * @param userId - User identifier
 * @param operations - Memory operations performed manually
 * @param source - Source of the operation
 * @returns true if synced successfully, false if skipped or failed
 */
export async function syncMemoryOperationsToAI(
  userId: string,
  operations: MemorySyncOperation[],
  source: string = 'memory_modal'
): Promise<boolean> {
  // Only sync if AI_BASE is configured
  if (!AI_BASE) {
    console.log('[AI Sync] No AI_BASE configured, skipping sync (stub mode)');
    return false;
  }

  if (!operations || operations.length === 0) {
    console.log('[AI Sync] No operations to sync');
    return true;
  }

  try {
    console.log(`[AI Sync] Syncing ${operations.length} manual memory operations to AI backend...`);
    
    const response = await axios.post(
      `${AI_BASE}/memory/sync`,
      { 
        userId, 
        operations,
        source
      },
      { timeout: 5000 }
    );

    console.log('[AI Sync] Successfully synced operations to AI backend', response.data);
    return true;
  } catch (err: any) {
    console.warn('[AI Sync] Failed to sync operations to AI backend:', err?.message ?? err);
    return false;
  }
}

// ============================================
// Profile Generation from AI Service
// ============================================

export interface ProfileGenerationResult {
  ok: boolean
  profile?: StubProfile
  error?: AIError
  meta: {
    generatedAt: string
    model: string
    latency_ms: number
  }
}

/**
 * Generate user profile using AI
 * 
 * @param userId - User identifier
 * @returns Profile generation result with separated profile and memories
 */
export async function generateProfileFromAI(userId: string): Promise<ProfileGenerationResult> {
  // Use stub system if no AI_BASE is configured
  if (!AI_BASE) {
    return generateProfileFromAIStub(userId);
  }

  // Try to call actual AI service
  const _started = Date.now();
  try {
    console.log(`[AI] Calling AI profile service at: ${AI_BASE}/generate/profile`);
    const { data } = await axios.post(
      `${AI_BASE}/generate/profile`,
      { userId },
      { timeout: 60000 }
    );

    if (data && typeof data === "object" && typeof data.ok === "boolean") {
      const meta = (data as any).meta ??= { 
        generatedAt: new Date().toISOString(), 
        model: 'unknown',
        latency_ms: Date.now() - _started
      };
      data.meta.latency_ms = data.meta.latency_ms ?? (Date.now() - _started);
      return data as ProfileGenerationResult;
    }
    throw new Error("Invalid AI response: must match ProfileGenerationResult format");
  } catch (err: any) {
    console.warn("[AI] Real AI profile service failed at:", AI_BASE, "Error:", err?.message ?? err);
    return generateProfileFromAIStub(userId);
  }
}

/**
 * Generate user profile using AI stub system
 * Simulates AI by returning random stub data
 */
export async function generateProfileFromAIStub(userId: string): Promise<ProfileGenerationResult> {
  const startTime = Date.now()
  
  try {
    // Simulate AI processing delay (1000ms)
    const profileDelay = 1000
    await new Promise(resolve => setTimeout(resolve, profileDelay))
    
    const { profile } = getSynchronizedStubs()
    
    const latency = Date.now() - startTime
    console.log(`[AI Profile Generation] Latency: ${latency}ms`)
    
    return {
      ok: true,
      profile,
      meta: {
        generatedAt: new Date().toISOString(),
        model: 'stub-profile-v1',
        latency_ms: latency
      }
    }
  } catch (error: any) {
    console.error('[AI Profile Generation] Error:', error)
    
    return {
      ok: false,
      error: {
        code: 'profile_generation_failed',
        message: 'Failed to generate profile from AI',
        retryable: true,
        details: { reason: error?.message ?? String(error) }
      },
      meta: {
        generatedAt: new Date().toISOString(),
        model: 'stub-profile-v1',
        latency_ms: Date.now() - startTime
      }
    }
  }
}

// ============================================
// G-Eval from AI Service
// ============================================

export interface GEvalResult {
  ok: boolean
  score?: number
  error?: AIError
}

/**
 * Get g-eval score from AI service
 * 
 * @param userId - User identifier for g-eval
 * @returns G-eval result with score
 */
export async function getGEvalFromAI(userId: string): Promise<GEvalResult> {
  // Use stub system if no AI_BASE is configured
  if (!AI_BASE) {
    return { ok: true, score: 5 };
  }

  // Try to call actual AI service
  try {
    console.log(`[AI] Calling AI g-eval service at: ${AI_BASE}/g-eval for userId: ${userId}`);
    const { data } = await axios.post(
      `${AI_BASE}/g-eval`,
      { userId },
      { timeout: 600000 }
    );

    if (data && typeof data === "object" && typeof data.score === "number") {
      return {
        ok: true,
        score: data.score
      };
    }
    throw new Error("Invalid AI response: must contain score");
  } catch (err: any) {
    console.warn("[AI] Real AI g-eval service failed at:", AI_BASE, "Error:", err?.message ?? err);
    return { ok: true, score: 5 };
  }
}