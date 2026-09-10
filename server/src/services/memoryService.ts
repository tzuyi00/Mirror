import { productPrisma } from './db.js'
import type {
  MemoryType
} from '../generated/product/index.js'

// Type definitions for service operations
export interface CreateMemoryData {
  userId: string
  type: MemoryType
  content: string
  source: string
  categories: string[]  // Array of category tags
  sectionIds?: string[]
}

export interface UpdateMemoryData {
  content?: string
  source?: string
  categories?: string[]  // Array of category tags
}

export interface MemoryResult {
  id: string
  type: string
  content: string
  source: string
  timestamp: Date
  categories: string[]  // Array of category tags
  userId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Get a single memory by ID
 * 
 * @param memoryId - Memory UUID to fetch
 * @returns Memory record or null if not found
 */
export async function getMemoryById(memoryId: string): Promise<MemoryResult | null> {
  try {
    const memory = await productPrisma.memory.findUnique({
      where: { id: memoryId }
    })
    return memory
  } catch (error: any) {
    console.error('[MemoryService] Error fetching memory:', error)
    throw new Error(`Failed to fetch memory: ${error?.message}`)
  }
}

/**
 * Get all memories for a specific user
 * 
 * @param userId - User UUID to fetch memories for
 * @param includeDeleted - Whether to include soft-deleted memories (default: false)
 * @returns Array of memory records
 */
export async function getMemoriesByUserId(
  userId: string,
  includeDeleted: boolean = false
): Promise<MemoryResult[]> {
  try {
    let memories: MemoryResult[]
    
    if (includeDeleted) {
      memories = await productPrisma.memory.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      // Fetch all and filter out deleted ones in memory
      const allMemories = await productPrisma.memory.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      memories = allMemories.filter(m => !m.categories?.includes('deleted'))
    }
    
    console.log(`[MemoryService] Found ${memories.length} memories for user ${userId}`)
    return memories
  } catch (error: any) {
    console.error('[MemoryService] Error fetching memories:', error)
    throw new Error(`Failed to fetch memories: ${error?.message}`)
  }
}

/**
 * Create a new memory
 * 
 * @param data - Memory creation data
 * @returns Created memory record
 */
export async function createMemory(data: CreateMemoryData): Promise<MemoryResult> {
  try {
    const newMemory = await productPrisma.memory.create({
      data: {
        type: data.type,
        content: data.content,
        source: data.source,
        categories: data.categories,  // Now using array
        userId: data.userId,
        sections: data.sectionIds ? {
          connect: data.sectionIds.map(id => ({ id }))
        } : undefined
      }
    })
    
    console.log('[MemoryService] Memory created successfully:', newMemory.id)
    return newMemory
  } catch (error: any) {
    console.error('[MemoryService] Error creating memory:', error)
    throw new Error(`Failed to create memory: ${error?.message}`)
  }
}

/**
 * Update an existing memory
 * 
 * @param memoryId - Memory UUID to update
 * @param data - Memory update data
 * @returns Updated memory record
 */
export async function updateMemory(
  memoryId: string,
  data: UpdateMemoryData
): Promise<MemoryResult> {
  try {
    // Check if memory exists
    const existingMemory = await productPrisma.memory.findUnique({
      where: { id: memoryId }
    })
    
    if (!existingMemory) {
      throw new Error(`Memory ${memoryId} not found`)
    }
    
    // Update memory
    const updatedMemory = await productPrisma.memory.update({
      where: { id: memoryId },
      data: {
        ...(data.content !== undefined && { content: data.content }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.categories !== undefined && { categories: data.categories })
      }
    })
    
    console.log('[MemoryService] Memory updated successfully:', memoryId)
    return updatedMemory
  } catch (error: any) {
    console.error('[MemoryService] Error updating memory:', error)
    throw error
  }
}

/**
 * Delete a memory (supports soft and hard delete)
 * 
 * Soft delete: Adds 'deleted' tag to category field (preserves history)
 * Hard delete: Actually removes from database (irreversible)
 * 
 * @param memoryId - Memory UUID to delete
 * @param mode - Delete mode: 'soft' (default) or 'hard'
 * @returns Updated memory (soft delete) or null (hard delete)
 */
export async function deleteMemory(
  memoryId: string,
  mode: 'soft' | 'hard' = 'soft'
): Promise<MemoryResult | null> {
  try {
    // Check if memory exists
    const existingMemory = await productPrisma.memory.findUnique({
      where: { id: memoryId }
    })
    
    if (!existingMemory) {
      throw new Error(`Memory ${memoryId} not found`)
    }
    
    if (mode === 'hard') {
      // Hard delete: remove from database
      await productPrisma.memory.delete({
        where: { id: memoryId }
      })
      console.log('[MemoryService] Memory hard deleted:', memoryId)
      return null
    } else {
      // Soft delete: add 'deleted' tag to categories array
      const alreadyDeleted = existingMemory.categories?.includes('deleted')
      const updatedMemory = await productPrisma.memory.update({
        where: { id: memoryId },
        data: {
          categories: alreadyDeleted 
            ? existingMemory.categories 
            : [...(existingMemory.categories || []), 'deleted']
        }
      })
      console.log('[MemoryService] Memory soft deleted:', memoryId)
      return updatedMemory
    }
  } catch (error: any) {
    console.error('[MemoryService] Error deleting memory:', error)
    throw error
  }
}

/**
 * Increment the memory operation counter for a user
 * Used to track when to auto-trigger profile updates
 * 
 * @param userId - User UUID
 * @returns New operation count
 */
export async function incrementMemoryOperationCount(userId: string): Promise<number> {
  try {
    const updated = await productPrisma.user.update({
      where: { id: userId },
      data: {
        memoryOperationCount: {
          increment: 1
        }
      },
      select: {
        memoryOperationCount: true
      }
    })
    console.log(`[MemoryService] User ${userId} operation count: ${updated.memoryOperationCount}`)
    return updated.memoryOperationCount
  } catch (error: any) {
    console.error('[MemoryService] Error incrementing operation count:', error)
    throw new Error(`Failed to increment operation count: ${error?.message}`)
  }
}

/**
 * Reset the memory operation counter for a user
 * Called after auto-triggering a profile update
 * 
 * @param userId - User UUID
 */
export async function resetMemoryOperationCount(userId: string): Promise<void> {
  try {
    await productPrisma.user.update({
      where: { id: userId },
      data: {
        memoryOperationCount: 0,
        lastAutoUpdateAt: new Date()
      }
    })
    console.log(`[MemoryService] Reset operation count for user ${userId}`)
  } catch (error: any) {
    console.error('[MemoryService] Error resetting operation count:', error)
    throw new Error(`Failed to reset operation count: ${error?.message}`)
  }
}

// Export prisma instance for direct use if needed
export { productPrisma }
