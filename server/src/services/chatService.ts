import { productPrisma } from './db.js'
import {
  MessageRole,
  MessageMode
} from '../generated/product/index.js'
import type {
  Prisma
} from '../generated/product/index.js'
// ============================================
// Type Definitions
// ============================================

export interface ThreadResult {
  id: string
  createdAt: Date
  userId: string | null
  activityId?: string | null
}

export interface MessageResult {
  id: string
  createdAt: Date
  role: MessageRole
  data: Prisma.JsonValue
}

export interface CreateMessageData {
  threadId: string
  role: MessageRole
  mode?: MessageMode  // impersonation (default) or interviewer
  content: string  // Message content (user input or AI reply text)
}

// ============================================
// Thread Operations
// ============================================

/**
 * Create a new thread
 * 
 * @param userId - Optional user ID to associate with thread
 * @param activityId - Optional activity ID for activity-specific threads (interviewer mode)
 * @returns Created thread record
 */
export async function createThread(userId?: string, activityId?: string): Promise<ThreadResult> {
  try {
    const thread = await productPrisma.thread.create({
      data: { 
        userId: userId ?? null,
        activityId: activityId ?? null
      },
      select: { id: true, createdAt: true, userId: true, activityId: true },
    })
    
    const logMsg = activityId 
      ? `[ChatService] Activity thread created: ${thread.id} (activityId: ${activityId})`
      : `[ChatService] Thread created: ${thread.id}`
    console.log(logMsg)
    return thread
  } catch (error: any) {
    console.error('[ChatService] Error creating thread:', error)
    throw new Error(`Failed to create thread: ${error?.message}`)
  }
}

/**
 * Get thread by ID
 * 
 * @param threadId - Thread UUID to fetch
 * @returns Thread record or null if not found
 */
export async function getThreadById(threadId: string): Promise<ThreadResult | null> {
  try {
    const thread = await productPrisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, createdAt: true, userId: true, activityId: true },
    })
    return thread
  } catch (error: any) {
    console.error('[ChatService] Error fetching thread:', error)
    throw new Error(`Failed to fetch thread: ${error?.message}`)
  }
}

/**
 * Get the latest thread for a user, optionally filtered by activity.
 *
 * @param userId     - User UUID to fetch latest thread for
 * @param activityId - Controls which thread is returned:
 *                     • undefined (default) → latest impersonation thread (activityId IS NULL)
 *                     • 'any'               → latest interviewer thread with the user's last message (activityId NOT NULL, ordered by latest user message)
 *                     • '<specific-id>'     → latest thread for that exact activityId
 * @returns Latest matching thread record or null if none found
 */
export async function getLatestThreadForUser(userId: string, activityId?: string): Promise<ThreadResult | null> {
  try {
    if (activityId === 'any') {
      // Special case: find the interviewer thread where user last sent a message
      // Query: Get all threads with activityId NOT NULL, where at least one message has role='user'
      // Order by the latest user message's createdAt in that thread
      const threads = await productPrisma.thread.findMany({
        where: {
          userId,
          NOT: { activityId: null },
          messages: {
            some: {
              role: MessageRole.user,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, userId: true, activityId: true },
        take: 1,
      })

      const thread = threads[0] || null
      console.log(
        `[ChatService] Latest 'any' thread with user message ${userId}:`,
        thread?.activityId ?? 'none'
      )
      return thread
    }

    const where =
      activityId === undefined
        ? { userId, activityId: null }
        : { userId, activityId }

    const thread = await productPrisma.thread.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, userId: true, activityId: true },
    })

    const logMsg =
      activityId === undefined
        ? `[ChatService] Latest impersonation thread for user ${userId}`
        : `[ChatService] Latest interviewer thread for user ${userId} (activityId: ${activityId})`
    console.log(logMsg)

    return thread
  } catch (error: any) {
    console.error('[ChatService] Error fetching latest thread for user:', error)
    throw new Error(`Failed to fetch latest thread for user: ${error?.message}`)
  }
}

/**
 * Check if a thread exists
 *
 * @param threadId - Thread UUID to check
 * @returns true if thread exists, false otherwise
 */
export async function threadExists(threadId: string): Promise<boolean> {
  try {
    const thread = await productPrisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true }
    })
    return thread !== null
  } catch (error) {
    return false
  }
}

// ============================================
// Message Operations
// ============================================

/**
 * Append a message to a thread with automatic turnIndex calculation
 * Data format: { content: string, turnIndex: number }
 * 
 * @param data - Message creation data (threadId, role, content)
 * @returns Created message record
 */
export async function appendMessage(data: CreateMessageData): Promise<MessageResult> {
  try {
    // Calculate turnIndex: find max turnIndex in thread and add 1
    // This handles cases where messages are deleted
    const lastMessage = await productPrisma.message.findFirst({
      where: { threadId: data.threadId },
      orderBy: { createdAt: 'desc' },
      select: { data: true }
    })
    
    // Extract turnIndex from last message's data field (JSON)
    const lastTurnIndex = (lastMessage?.data as any)?.turnIndex || 0
    const turnIndex = lastTurnIndex + 1

    // Create message with new data format: { content, turnIndex }
    const message = await productPrisma.message.create({
      data: {
        threadId: data.threadId,
        role: data.role,
        mode: data.mode ?? 'impersonation',
        data: {
          content: data.content,
          turnIndex: turnIndex
        },
      },
      select: { id: true, createdAt: true, role: true, data: true },
    })
    
    console.log('[ChatService] Message appended to thread:', data.threadId, 'turnIndex:', turnIndex, 'lastTurnIndex:', lastTurnIndex)
    return message
  } catch (error: any) {
    console.error('[ChatService] Error appending message:', error)
    throw new Error(`Failed to append message: ${error?.message}`)
  }
}

/**
 * Delete a message by ID
 * 
 * @param messageId - Message UUID to delete
 * @returns true if deleted successfully
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    await productPrisma.message.delete({
      where: { id: messageId }
    })
    
    console.log('[ChatService] Message deleted:', messageId)
    return true
  } catch (error: any) {
    console.error('[ChatService] Error deleting message:', error)
    throw new Error(`Failed to delete message: ${error?.message}`)
  }
}

/**
 * Get the last AI interviewer message in a thread
 * 
 * @param threadId - Thread UUID to fetch the last interviewer AI message for
 * @returns Last AI interviewer message or null if none exists
 */
export async function getLastInterviewerAiMessage(threadId: string): Promise<{ id: string; content: string } | null> {
  try {
    const lastMsg = await productPrisma.message.findFirst({
      where: { threadId, role: MessageRole.ai, mode: MessageMode.interviewer },
      orderBy: { createdAt: 'desc' },
      select: { id: true, data: true },
    });
    if (!lastMsg) return null;
    return {
      id: lastMsg.id,
      content: (lastMsg.data as any)?.content ?? '',
    };
  } catch (error: any) {
    console.error('[ChatService] Error fetching last interviewer AI message:', error);
    throw new Error(`Failed to fetch last interviewer AI message: ${error?.message}`);
  }
}

/**
 * Get all messages for a thread, ordered by creation time
 * 
 * @param threadId - Thread UUID to fetch messages for
 * @returns Array of message records
 */
export async function getThreadMessages(threadId: string): Promise<MessageResult[]> {
  try {
    const messages = await productPrisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true, role: true, data: true },
    })
    return messages
  } catch (error: any) {
    console.error('[ChatService] Error fetching thread messages:', error)
    throw new Error(`Failed to fetch thread messages: ${error?.message}`)
  }
}

// Export prisma instance for direct use if needed
export { productPrisma }
