// Stub management - Centralized stub exports
import { allProfileStubs, StubProfile } from './profileStubs.js'
import { allMemoryStubs, StubMemory } from './memoryStubs.js'
import { getChatStub, type AIReply, type MemoryOperation } from './chatStubs.js'
import { getInterviewStub, type InterviewReply } from './interviewStubs.js'
import { 
  getRandomMemoryExtractStub,
  getMemoryExtractStubByIndex,
  type MemoryExtractResponse,
  type QuestionType,
  type NewMemory,
  type MemoryOperationsExtract
} from './memoryExtractStubs.js'

// Export types for external use
export type { StubProfile } from './profileStubs.js'
export type { StubMemory } from './memoryStubs.js'
export type { 
  AIReply, 
  AIError,
  MemoryOperation,
  MemoryOperationType,
  ExistingMemory,
  MemoryOperationResult
} from './chatStubs.js'
export type { InterviewReply } from './interviewStubs.js'
export type { 
  MemoryExtractResponse,
  QuestionType,
  NewMemory,
  MemoryOperationsExtract
} from './memoryExtractStubs.js'

/**
 * Get synchronized profile and memory stubs at the same evolution stage
 * This ensures that profile and memories are from the same time period
 * @param index Optional index (0-2). If not provided, returns random synchronized pair
 * @returns Object containing both profile and memories from the same stage
 */
export function getSynchronizedStubs(index?: number): { profile: StubProfile; memories: StubMemory[] } {
  const targetIndex = index !== undefined 
    ? (index >= 0 && index < allProfileStubs.length ? index : 0)
    : Math.floor(Math.random() * allProfileStubs.length)
  
  return {
    profile: allProfileStubs[targetIndex],
    memories: allMemoryStubs[targetIndex]
  }
}

// ============================================
// Profile Stub Functions
// ============================================

/**
 * Get a specific profile stub by index (for testing purposes)
 * @param index 0-based index (0 = early, 1 = mid, 2 = advanced)
 * @returns Profile stub at specified index
 */
export function getProfileStubByIndex(index: number): StubProfile {
  if (index < 0 || index >= allProfileStubs.length) {
    console.warn(`Invalid profile stub index ${index}, returning first stub`)
    return allProfileStubs[0]
  }
  return allProfileStubs[index]
}

/**
 * Get all available profile stubs (for debugging)
 * @returns Array of all profile stubs
 */
export function getAllProfileStubs(): StubProfile[] {
  return allProfileStubs
}

/**
 * Get profile stub count
 * @returns Number of available profile stubs
 */
export function getProfileStubCount(): number {
  return allProfileStubs.length
}

// ============================================
// Memory Stub Functions
// ============================================

/**
 * Get a specific memory stub by index (for testing purposes)
 * @param index 0-based index (0 = early, 1 = mid, 2 = advanced)
 * @returns Memory stub array at specified index
 */
export function getMemoryStubByIndex(index: number): StubMemory[] {
  if (index < 0 || index >= allMemoryStubs.length) {
    console.warn(`Invalid memory stub index ${index}, returning first stub`)
    return allMemoryStubs[0]
  }
  return allMemoryStubs[index]
}

/**
 * Get all available memory stubs (for debugging)
 * @returns Array of all memory stub arrays
 */
export function getAllMemoryStubs(): StubMemory[][] {
  return allMemoryStubs
}

/**
 * Get memory stub count
 * @returns Number of available memory stub stages
 */
export function getMemoryStubCount(): number {
  return allMemoryStubs.length
}

// ============================================
// Chat/AI Stubs
// ============================================

/**
 * Get chat response stub
 * This is a wrapper function that provides a consistent interface
 * for getting chat stubs, similar to getSynchronizedStubs() for profiles
 * 
 * ARCHITECTURE: Real-time Feedback Loop
 * - No existingMemories needed - AI manages its own memory database
 * 
 * @param message - User's message
 * @param userId - User identifier
 * @param threadId - Thread identifier
 * @returns AIReply with chat response
 */
export function getChatResponseStub(
  message: string, 
  userId: string,
  threadId: string
): AIReply {
  return getChatStub(message, userId, threadId)
}

// Also export the direct function for flexibility
export { getChatStub } from './chatStubs.js'

// ============================================
// Interview Stubs
// ============================================

/**
 * Get interview response stub
 * Simulates AI interviewer asking questions or providing feedback
 * 
 * @param userMessage - User's previous response (empty for start activity)
 * @param userId - User identifier
 * @param threadId - Thread identifier
 * @param activityId - Activity identifier
 * @param userMessageId - ID of user's message (NULL for start activity)
 * @param questionMessageId - ID of question message (NULL for start activity)
 * @returns InterviewReply with interview response
 */
export function getInterviewResponseStub(
  userMessage: string,
  userId: string,
  threadId: string,
  activityId: string,
  userMessageId?: string,
  questionMessageId?: string
): InterviewReply {
  return getInterviewStub(userMessage, userId, threadId, activityId, userMessageId, questionMessageId)
}

// Also export the direct function for flexibility
export { getInterviewStub } from './interviewStubs.js'

// ============================================
// Memory Extract Stubs
// ============================================

/**
 * Get memory extract response stub
 * Simulates AI extracting memories from conversation
 * 
 * @param userId - User identifier
 * @returns MemoryExtractResponse with extracted memories
 */
export function getMemoryExtractResponseStub(userId: string): MemoryExtractResponse {
  const stub = getRandomMemoryExtractStub()
  // Update userId to match the request
  stub.meta.userId = userId
  stub.meta.createdAt = new Date().toISOString()
  return stub
}

/**
 * Get memory extract stub by index
 * @param userId - User identifier
 * @param index - Index of the stub (0-4)
 * @returns MemoryExtractResponse at specified index
 */
export function getMemoryExtractResponseStubByIndex(userId: string, index: number): MemoryExtractResponse {
  const stub = getMemoryExtractStubByIndex(index)
  stub.meta.userId = userId
  stub.meta.createdAt = new Date().toISOString()
  return stub
}
