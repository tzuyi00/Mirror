import { StubProfile, StubProfileSection } from '../stubs/profileStubs.js'
import { StubMemory } from '../stubs/memoryStubs.js'

import { productPrisma } from './db.js'
import type {
  MemoryType, 
  SectionType
} from '../generated/product/index.js'

// Type definitions for service responses
export interface SaveProfileResult {
  success: boolean
  userId: string
  error?: string
}

export interface UserProfileData {
  userId: string
  name: string
  title: string
  bio: string
  sections: ProfileSectionData[]
  memories: MemoryData[]
}

export interface ProfileSectionData {
  id: string
  type: SectionType
  title: string
  description: string
  data: any
  memoryIds: string[]
  order: number
  metadata?: any
}

export interface MemoryData {
  id: string
  type: 'user' | 'ai'
  content: string
  source: string
  timestamp: string
  categories: string[]
}

/**
 * Save complete profile from AI-generated data to database
 * Strategy: Delete old profile sections
 * 
 * @param aiProfile - Profile data from AI service
 * @param userId - Target user ID (if updating existing user, provide their UUID)
 * @returns Result with success status and userId
 */
export async function saveCompleteProfile(
  aiProfile: StubProfile,
  userId?: string
): Promise<SaveProfileResult> {
  try {
    // Step 1: Delete existing profile sections if userId is provided
    if (userId) {
      await deleteUserProfileData(userId)
    }

    // Step 2: Create or update User
    const user = await saveUserProfile(aiProfile, userId)
    const finalUserId = user.id

    // Step 3: Save all profile sections
    for (const stubSection of aiProfile.sections) {
      await saveProfileSection(stubSection, finalUserId)
    }
    
    return {
      success: true,
      userId: finalUserId
    }
  } catch (error: any) {
    return {
      success: false,
      userId: userId || '',
      error: error?.message || 'Unknown error'
    }
  }
}

/**
 * Delete all profile-related data for a user
 */
async function deleteUserProfileData(userId: string): Promise<void> {
  // Delete profile sections (memories will be disconnected automatically)
  await productPrisma.profileSection.deleteMany({
    where: { userId }
  })

}

/**
 * Save or update User basic information
 * Uses upsert to handle both create and update scenarios
 * 
 * @param aiProfile - Profile data from AI
 * @param existingUserId - If provided, upsert this user; otherwise create new
 * @returns Created or updated User record
 */
async function saveUserProfile(
  aiProfile: StubProfile,
  existingUserId?: string
) {
  if (existingUserId) {
    // Upsert: Update if exists, create if not
    return await productPrisma.user.upsert({
      where: { id: existingUserId },
      update: {
        name: aiProfile.name,
        title: aiProfile.title,
        bio: aiProfile.bio
      },
      create: {
        id: existingUserId,
        name: aiProfile.name,
        title: aiProfile.title,
        bio: aiProfile.bio,
        email: null // Optional field
      }
    })
  } else {
    // Create new user with auto-generated UUID
    return await productPrisma.user.create({
      data: {
        name: aiProfile.name,
        title: aiProfile.title,
        bio: aiProfile.bio,
        email: null // Optional field
      }
    })
  }
}

/**
 * Save a single Memory record
 * 
 * @param stubMemory - Memory data from AI stub
 * @param userId - User ID to associate this memory with
 * @returns Created Memory record
 */
async function saveMemory(
  stubMemory: StubMemory,
  userId: string
) {
  return await productPrisma.memory.create({
    data: {
      type: stubMemory.type as MemoryType,
      content: stubMemory.content,
      source: stubMemory.source,
      timestamp: new Date(stubMemory.timestamp),
      categories: stubMemory.categories,
      userId: userId
    }
  })
}

/**
 * Save a ProfileSection
 * Simple version: just save the section data without memory connections
 * 
 * @param stubSection - Section data from AI stub
 * @param userId - User ID to associate this section with
 * @returns Created ProfileSection record
 */
async function saveProfileSection(
  stubSection: StubProfileSection,
  userId: string
) {
  return await productPrisma.profileSection.create({
    data: {
      type: stubSection.type as SectionType,
      title: stubSection.title,
      description: stubSection.description,
      data: stubSection.data, // Store as JSON
      metadata: stubSection.metadata || undefined, // Use undefined instead of null for optional JSON fields
      order: stubSection.order,
      userId: userId
    }
  })
}

/**
 * Retrieve complete user profile from database
 * Includes User info, all ProfileSections (ordered), and all Memories
 * 
 * @param userId - User UUID to fetch
 * @param includeMemories - Whether to include memories in response (default: true)
 * @returns Complete profile data or null if user not found
 */
export async function ProfileView(
  userId: string,
  includeMemories: boolean = true
): Promise<UserProfileData | null> {
  try {
    const user = await productPrisma.user.findUnique({
      where: { id: userId },
      include: {
        profileSections: {
          orderBy: { order: 'asc' },
          include: {
            memories: true // Include memories associated with each section
          }
        },
        memories: includeMemories // Include all user memories if requested
      }
    })

    if (!user) {
      return null
    }

    // Transform database structure to API response format
    const sections: ProfileSectionData[] = user.profileSections.map(section => ({
      id: section.id,
      type: section.type,
      title: section.title,
      description: section.description,
      data: section.data,
      memoryIds: section.memories.map(m => m.id), // Extract memory IDs from relation
      order: section.order,
      metadata: section.metadata
    }))

    const memories: MemoryData[] = includeMemories && user.memories
      ? user.memories.map(memory => ({
          id: memory.id,
          type: memory.type as 'user' | 'ai',
          content: memory.content,
          source: memory.source,
          timestamp: memory.timestamp.toISOString(),
          categories: memory.categories
        }))
      : []

    console.log('$ [ProfileService] Full sections:');
    sections.forEach(section => {
      console.log(JSON.stringify(section, null, 2));
    });

    console.log('$ [ProfileService] Full memories:');
    memories.forEach(memory => {
      console.log(JSON.stringify(memory, null, 2));
    });

    return {
      userId: user.id,
      name: user.name || '',
      title: user.title || '',
      bio: user.bio || '',
      sections,
      memories
    }
  } catch (error: any) {
    console.error('[ProfileService] Error fetching user profile:', error)
    return null
  }
}

/**
 * Check if a user exists in the database
 * 
 * @param userId - User UUID to check
 * @returns true if user exists, false otherwise
 */
export async function userExists(userId: string): Promise<boolean> {
  try {
    const user = await productPrisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })
    return user !== null
  } catch (error) {
    return false
  }
}

// Export prisma instance for direct use if needed
export { productPrisma }
