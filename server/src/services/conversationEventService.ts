import { derivedPrisma } from './db.js'
import type { Prisma } from '../generated/derived/index.js'

// ============================================
// Type Definitions
// ============================================

export interface MemoryOperation {
  type: 'create' | 'update' | 'delete'
  memoryId?: string
  memContent?: string
  source?: string
  categories?: string[]
}

export interface OperationResult {
  success: boolean
  memoryId?: string
  error?: string
}

export interface ConversationEventData {
  userId: string
  threadId: string
  refMessageId: string
  role: 'user' | 'ai' | 'system'
  mode?: 'impersonation' | 'interviewer'  // chat mode, defaults to 'impersonation'
  content: string
  memoryOperations?: MemoryOperation[]
  operationResults?: OperationResult[]
}

export interface ConversationEventResult {
  id: string
  userId: string
  threadId: string
  refMessageId: string | null
  data: Prisma.JsonValue
  createdAt: Date
}

// ============================================
// Conversation Event Operations
// ============================================

/**
 * Create a new conversation event in Derived DB
 * Stores user or AI message with associated metadata
 * 
 * @param data - Conversation event data
 * @returns Created conversation event record
 */
export async function createConversationEvent(
  data: ConversationEventData
): Promise<ConversationEventResult> {
  try {
    // Build data object based on role
    const eventData: Record<string, any> = {
      userId: data.userId,
      threadId: data.threadId,
      refMessageId: data.refMessageId,
      role: data.role,
      mode: data.mode ?? 'impersonation',
      content: data.content,
    }

    // Only include memoryOperations and operationResults for AI messages
    if (data.role === 'ai') {
      if (data.memoryOperations) {
        eventData.memoryOperations = data.memoryOperations
      }
      if (data.operationResults) {
        eventData.operationResults = data.operationResults
      }
    }

    const event = await derivedPrisma.conversationEvent.create({
      data: {
        userId: data.userId,
        threadId: data.threadId,
        refMessageId: data.refMessageId,
        data: eventData,
      },
      select: {
        id: true,
        userId: true,
        threadId: true,
        refMessageId: true,
        data: true,
        createdAt: true,
      },
    })

    console.log('[ConversationEventService] Event created:', event.id, 'role:', data.role)
    return event
  } catch (error: any) {
    console.error('[ConversationEventService] Error creating event:', error)
    throw new Error(`Failed to create conversation event: ${error?.message}`)
  }
}

/**
 * Delete conversation event by reference message ID
 * 
 * @param refMessageId - Reference message ID to delete
 * @returns true if deleted successfully
 */
export async function deleteConversationEventByRefMessageId(
  refMessageId: string
): Promise<boolean> {
  try {
    const result = await derivedPrisma.conversationEvent.deleteMany({
      where: { refMessageId }
    })
    
    console.log('[ConversationEventService] Event(s) deleted for refMessageId:', refMessageId, 'count:', result.count)
    return result.count > 0
  } catch (error: any) {
    console.error('[ConversationEventService] Error deleting event:', error)
    throw new Error(`Failed to delete conversation event: ${error?.message}`)
  }
}