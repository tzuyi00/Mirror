import { productPrisma } from './db.js'
import { ExtractionStatus } from '../generated/product/index.js'

// ============================================
// Type Definitions
// ============================================

export interface ActivityQuestion {
  id: string
  activityId: string
  questionText: string
}

export interface Activity {
  id: string
  name: string
  description: string | null
  category: string | null
  createdAt: Date
  questions: ActivityQuestion[]
}

export interface ActivityStatus {
  activityId: string
  activityName: string
  status: 'not_started' | 'in_progress' | 'completed'
  questionCount: number
  answeredCount: number
  extractedCount: number
}

// ============================================
// Activity Operations
// ============================================

/**
 * Get all activities with their questions
 * 
 * @returns Array of activities with questions
 */
export async function getActivities(): Promise<Activity[]> {
  try {
    const activities = await productPrisma.activity.findMany({
      include: {
        questions: {
          select: {
            id: true,
            activityId: true,
            questionText: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log('[ActivityService] Fetched', activities.length, 'activities')
    return activities as Activity[]
  } catch (error: any) {
    console.error('[ActivityService] Error fetching activities:', error)
    throw new Error(`Failed to fetch activities: ${error?.message}`)
  }
}

// ============================================
// Activity Answer & Interview Operations
// ============================================

/**
 * Calculate the status of all activities for a user
 * Status logic:
 *   Not Started: No answers exist for any questions in this activity
 *   In Progress: At least one answer exists BUT not all questions have been answered OR at least one answer has memoryExtracted = false
 *   Completed: ALL questions have answers AND ALL answers have memoryExtracted = true
 * 
 * @param userId - User ID
 * @returns Array of activity statuses
 */
export async function getActivityStatusForUser(userId: string): Promise<ActivityStatus[]> {
  try {
    // Get all activities with their questions
    const activities = await productPrisma.activity.findMany({
      include: {
        questions: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    const statuses: ActivityStatus[] = []

    for (const activity of activities) {
      const questionIds = activity.questions.map(q => q.id)
      // Total number of questions in this activity
      const totalQuestions = questionIds.length 

      // Get answers for this activity's questions
      const answers = await productPrisma.activityAnswer.findMany({
        where: {
          userId,
          questionId: { in: questionIds }
        }
      })

      // Total number of answered questions(including STANDARD and FOLLOW_UP)
      const answeredCount = answers.length
      // Total number of answered and done STANDARD questions
      const extractedCount = answers
        .filter(a => a.questionType === 'STANDARD')
        .filter(a => a.ExtractionStatus === ExtractionStatus.ANSWERED).length

      // Determine status based on completion logic
      let status: 'not_started' | 'in_progress' | 'completed'

      if (answeredCount === 0) {
        // No answers at all → Not Started
        status = 'not_started'
      } else if (extractedCount === totalQuestions) {
        // All questions answered AND all extracted → Completed
        status = 'completed'
      } else {
        // Partial answers OR some not extracted → In Progress
        status = 'in_progress'
      }

      statuses.push({
        activityId: activity.id,
        activityName: activity.name,
        status,
        questionCount: totalQuestions,
        answeredCount,
        extractedCount
      })
    }

    console.log('[ActivityService] Calculated status for', statuses.length, 'activities')
    return statuses
  } catch (error: any) {
    console.error('[ActivityService] Error calculating activity status:', error)
    throw new Error(`Failed to calculate activity status: ${error?.message}`)
  }
}

// Export prisma instance for direct use if needed
export { productPrisma }


/**
 * Get the completion status of a single activity for a specific user.
 * Uses the same logic as getActivityStatusForUser but targets one activity only.
 *
 * @param userId - User ID
 * @param activityId - Activity ID to check
 * @returns 'not_started' | 'in_progress' | 'completed'
 */
export async function getActivityCompletionStatus(
  userId: string,
  activityId: string
): Promise<'not_started' | 'in_progress' | 'completed'> {
  try {
    const activity = await productPrisma.activity.findUnique({
      where: { id: activityId },
      include: {
        questions: { select: { id: true } }
      }
    })

    if (!activity) {
      console.warn('[ActivityService] Activity not found:', activityId)
      return 'not_started'
    }

    const questionIds = activity.questions.map(q => q.id)
    const totalQuestions = questionIds.length

    if (totalQuestions === 0) return 'not_started'

    const answers = await productPrisma.activityAnswer.findMany({
      where: { userId, questionId: { in: questionIds } }
    })

    const answeredCount = answers.length
    const extractedCount = answers
      .filter(a => a.questionType === 'STANDARD')
      .filter(a => a.ExtractionStatus === ExtractionStatus.ANSWERED).length

    if (answeredCount === 0) return 'not_started'
    if (extractedCount === totalQuestions) return 'completed'
    return 'in_progress'
  } catch (error: any) {
    console.error('[ActivityService] Error checking activity completion status:', error)
    throw new Error(`Failed to check activity completion status: ${error?.message}`)
  }
}
