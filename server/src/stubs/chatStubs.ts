// ============================================
// Type Definitions
// ============================================

export type AIError = {
  code: string // e.g., "invalid_input" | "rate_limited" | "upstream_timeout" | "internal_error"
  message: string // Human-readable message for frontend
  retryable?: boolean // Whether frontend can auto-retry
  details?: unknown // Stack trace, field errors, etc. (frontend may choose not to display)
}

// ============================================
// Memory Operations Types
// ============================================

/**
 * Memory operation types that AI can suggest
 */
export type MemoryOperationType = 'create' | 'update' | 'delete'

/**
 * Memory context provided to AI (Optional - for on-demand loading)
 * AI backend manages its own memory database, so this is only used when:
 * - Initial sync is needed
 * - AI explicitly requests memory refresh
 */
export interface ExistingMemory {
  id: string // Memory ID from database
  content: string // Memory content
  categories: string[] // Memory categories/tags
  type: 'ai' | 'user' // Who created this memory
  timestamp: string // When it was created (ISO string)
}

/**
 * Memory operation structure
 * AI uses this to tell backend what memory changes to make
 * 
 * ARCHITECTURE: Real-time Feedback Loop
 * - AI backend has its own memory database
 * - AI sends memoryOperations based on its own context
 * - Node.js backend executes operations and returns operationResults
 * - AI receives memoryId immediately and syncs to its own database
 * 
 * IMPORTANT:
 * - For UPDATE/DELETE: memoryId comes from AI's own database (not from Node.js)
 * - For CREATE: memoryId should NOT be provided (backend will generate)
 * - AI manages memoryIds internally via operationResults feedback
 */
export interface MemoryOperation {
  type: MemoryOperationType
  memoryId?: string // Required for update/delete (from AI's own DB), omit for create
  memContent?: string // Required for create/update
  source?: string // Optional: where this memory came from
  categories?: string[] // Updated to match new schema (was 'category')
}

/**
 * Result of executing a memory operation
 * Backend returns this after applying memoryOperations
 */
export interface MemoryOperationResult {
  success: boolean
  memoryId?: string // For CREATE: the newly generated ID; for UPDATE/DELETE: the same ID
  error?: string // Error message if success=false
}

export interface AIReply {
  ok: boolean // true means success; false means error
  reply?: string // Short summary for UI (backward compatible)
  error?: AIError // Present when ok=false
  // memoryOperations?: MemoryOperation[] // Memory changes AI wants to make
  meta: {
    userId: string // AI must know which user's memories to manage
    threadId: string
    messageId?: string // Can be filled after backend persistence
    createdAt: string // ISO string
    model?: string // e.g., "gpt-4.1", "my-reranker"
    latency_ms?: number
  }
}

// ============================================
// Stub Data
// ============================================

/**
 * Generate simple echo-style chat response stub
 * Similar to the original stub() function but with cleaner structure
 * 
 * ARCHITECTURE: Simplified for Real-time Feedback Loop
 * - AI backend manages its own memories, so no existingMemories needed
 * - Randomly generates CREATE operations only (AI would handle update/delete based on its own DB)
 * - Backend returns operationResults with memoryId for AI to sync
 * 
 * @param message - User's message
 * @param userId - User identifier
 * @param threadId - Thread identifier
 * @returns AIReply with echo response and optional memory operations
 */
export function getChatStub(
  message: string, 
  userId: string,
  threadId: string
): AIReply {
  const now = new Date().toISOString()

  // 90% chance to include memory operations (simulate AI learning from chat)
  // const shouldIncludeMemoryOps = Math.random() < 0.9;
  // const memoryOperations: MemoryOperation[] = [];

  // Simulate a fake memory pool for update/delete
  // In real AI, this comes from AI's own DB
  // const fakeMemoryPool = [
  //   { id: 'stub-1', content: 'Fake memory 1' },
  //   { id: 'stub-2', content: 'Fake memory 2' },
  //   { id: 'stub-3', content: 'Fake memory 3' }
  // ];

  // if (shouldIncludeMemoryOps) {
  //   // Randomly choose operation type
  //   const opType = Math.random();
  //   if (opType < 0.9) {
  //     // 90%: create
  //     memoryOperations.push({
  //       type: 'create',
  //       memContent: `User mentioned: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
  //       source: 'Chat Analysis',
  //       categories: ['conversation', 'user-interest']
  //     });
  //   } else if (opType < 0.1) {
  //     // 10%: update (pick a random fake memory)
  //     const mem = fakeMemoryPool[Math.floor(Math.random() * fakeMemoryPool.length)];
  //     memoryOperations.push({
  //       type: 'update',
  //       memoryId: mem.id,
  //       memContent: `${mem.content} [Updated: user said "${message.substring(0, 20)}"]`,
  //       source: 'Chat Analysis',
  //       categories: ['conversation', 'updated']
  //     });
  //   } else {
  //     // delete (pick a random fake memory)
  //     const mem = fakeMemoryPool[Math.floor(Math.random() * fakeMemoryPool.length)];
  //     memoryOperations.push({
  //       type: 'delete',
  //       memoryId: mem.id
  //     });
  //   }
  // }
  
  return {
    ok: true,
    reply: `Echo: ${message}`,
    // memoryOperations: memoryOperations.length > 0 ? memoryOperations : undefined,
    meta: {
      userId,
      threadId,
      createdAt: now,
      model: "stub-chat-v1",
      latency_ms: 1,
    },
  }
}
