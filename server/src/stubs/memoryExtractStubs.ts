// Memory Extract stubs - Simulated AI memory extraction responses
// These stubs represent what the AI /memory/extract endpoint would return

export type QuestionType = 'STANDARD' | 'FOLLOW_UP'

export interface NewMemory {
  content: string
  categories: string[]
}

export interface MemoryOperationsExtract {
  new_memories: NewMemory[]
}

export interface MemoryExtractResponse {
  ok: boolean
  memoryOperations: MemoryOperationsExtract
  questionType: QuestionType
  memoryExtracted: boolean
  followUpQuestionText?: string
  flag: boolean
  meta: {
    userId: string
    source: string
    latency_ms: number
    createdAt: string
  }
}

// ==============================================
// Sample Memory Extract Responses
// ==============================================

/**
 * Sample response 1: Standard question with memory extraction
 */
export const memoryExtractStub1: MemoryExtractResponse = {
  ok: true,
  memoryOperations: {
    new_memories: [
      {
        content: "Interested in learning web development and React",
        categories: ["skills", "learning-style"]
      },
      {
        content: "Wants to build a portfolio project",
        categories: ["goals", "projects"]
      }
    ]
  },
  questionType: 'STANDARD',
  memoryExtracted: true,
  flag: true,
  meta: {
    userId: 'user-123',
    source: 'conversation',
    latency_ms: 523,
    createdAt: '2026-02-03T19:31:56.38Z'
  }
}

/**
 * Sample response 2: Follow-up question with memory extraction
 */
export const memoryExtractStub2: MemoryExtractResponse = {
  ok: true,
  memoryOperations: {
    new_memories: [
      {
        content: "Prefers hands-on learning approach over theoretical lectures",
        categories: ["learning-style", "preferences"]
      },
      {
        content: "Likes to see real-world examples and case studies",
        categories: ["learning-style"]
      }
    ]
  },
  questionType: 'FOLLOW_UP',
  memoryExtracted: true,
  followUpQuestionText: "Can you tell me more about the types of projects you enjoy working on?",
  flag: true,
  meta: {
    userId: 'user-123',
    source: 'conversation',
    latency_ms: 487,
    createdAt: '2026-02-03T19:32:15.45Z'
  }
}

/**
 * Sample response 3: No memory extracted
 */
export const memoryExtractStub3: MemoryExtractResponse = {
  ok: true,
  memoryOperations: {
    new_memories: []
  },
  questionType: 'STANDARD',
  memoryExtracted: false,
  flag: false,
  meta: {
    userId: 'user-123',
    source: 'conversation',
    latency_ms: 412,
    createdAt: '2026-02-03T19:32:45.62Z'
  }
}

/**
 * Sample response 4: Follow-up with memory extraction
 */
export const memoryExtractStub4: MemoryExtractResponse = {
  ok: true,
  memoryOperations: {
    new_memories: [
      {
        content: "Experienced in UI/UX design and user research",
        categories: ["skills", "achievements"]
      },
      {
        content: "Recently led design system project",
        categories: ["achievements", "projects"]
      },
      {
        content: "Enjoys mentoring junior team members",
        categories: ["traits", "preferences", "work-style"]
      }
    ]
  },
  questionType: 'FOLLOW_UP',
  memoryExtracted: true,
  followUpQuestionText: "That's impressive! How do you approach mentoring your team members?",
  flag: true,
  meta: {
    userId: 'user-123',
    source: 'conversation',
    latency_ms: 531,
    createdAt: '2026-02-03T19:33:12.71Z'
  }
}

/**
 * Sample response 5: Standard question with single memory
 */
export const memoryExtractStub5: MemoryExtractResponse = {
  ok: true,
  memoryOperations: {
    new_memories: [
      {
        content: "Highly values work-life balance and flexible work arrangements",
        categories: ["preferences", "traits"]
      }
    ]
  },
  questionType: 'STANDARD',
  memoryExtracted: true,
  flag: true,
  meta: {
    userId: 'user-123',
    source: 'conversation',
    latency_ms: 456,
    createdAt: '2026-02-03T19:33:45.89Z'
  }
}

// Export all stubs
export const allMemoryExtractStubs = [
  memoryExtractStub1,
  memoryExtractStub2,
  memoryExtractStub3,
  memoryExtractStub4,
  memoryExtractStub5
]

/**
 * Get a random memory extract stub
 * @returns Random MemoryExtractResponse
 */
export function getRandomMemoryExtractStub(): MemoryExtractResponse {
  const randomIndex = Math.floor(Math.random() * allMemoryExtractStubs.length)
  return JSON.parse(JSON.stringify(allMemoryExtractStubs[randomIndex]))
}

/**
 * Get memory extract stub by index
 * @param index 0-based index
 * @returns MemoryExtractResponse at specified index
 */
export function getMemoryExtractStubByIndex(index: number): MemoryExtractResponse {
  if (index < 0 || index >= allMemoryExtractStubs.length) {
    console.warn(`Invalid memory extract stub index ${index}, returning random stub`)
    return getRandomMemoryExtractStub()
  }
  return JSON.parse(JSON.stringify(allMemoryExtractStubs[index]))
}
