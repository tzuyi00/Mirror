import { Controller, Get, Post, Route, Path, Body, Response } from 'tsoa'
import {
  getActivities,
  getActivityStatusForUser
} from '../services/activityService.js'
import {
  ActivityDTO,
  ActivityStatusDTO,
  GetActivitiesResponse,
  GetActivityStatusResponse
} from '../dtos/ActivityDTOs.js'

@Route('api')
export class ActivityController extends Controller {
  /**
   * /api/activities
   * Get all activities with their questions
   * 
   * @returns All activities and their associated questions
   */
  @Get('activities')
  @Response<any>(500, 'Internal server error')
  async getActivities(): Promise<any> {
    try {
      console.log('[ActivityController] GET /activities')

      const activities = await getActivities()

      // Transform to DTO format
      const activitiesDTO: ActivityDTO[] = activities.map(activity => ({
        id: activity.id,
        name: activity.name,
        description: activity.description,
        category: activity.category,
        createdAt: activity.createdAt.toISOString(),
        questions: activity.questions.map(q => ({
          id: q.id,
          questionText: q.questionText
        }))
      }))

      return {
        status: 200,
        message: 'Activities fetched successfully',
        apiId: 'API-ACTIVITY-GET-001',
        version: '1.0.0',
        data: {
          activities: activitiesDTO
        }
      }
    } catch (error: any) {
      console.error('[ActivityController] Error fetching activities:', error)
      this.setStatus(500)
      throw new Error(error?.message ?? 'Failed to fetch activities')
    }
  }

  /**
   * /api/activities/status/:userId
   * Get the status of all activities for a specific user
   * Status includes: not_started, in_progress, completed
   * 
   * @param userId - The user ID to get activity statuses for
   * @returns Activity statuses for the user
   */
  @Get('activities/status/{userId}')
  @Response<any>(400, 'Bad request')
  @Response<any>(500, 'Internal server error')
  async getActivityStatus(
    @Path() userId: string
  ): Promise<any> {
    try {
      if (!userId) {
        this.setStatus(400)
        throw new Error('userId is required')
      }

      console.log('[ActivityController] GET /activities/status/:userId', { userId })

      const statuses = await getActivityStatusForUser(userId)

      // Transform to DTO format
      const statusesDTO: ActivityStatusDTO[] = statuses.map(status => ({
        activityId: status.activityId,
        activityName: status.activityName,
        status: status.status,
        questionCount: status.questionCount,
        answeredCount: status.answeredCount,
        extractedCount: status.extractedCount
      }))

      return {
        status: 200,
        message: 'Activity statuses fetched successfully',
        apiId: 'API-ACTIVITY-STATUS-GET-001',
        version: '1.0.0',
        data: {
          statuses: statusesDTO
        }
      }
    } catch (error: any) {
      console.error('[ActivityController] Error fetching activity status:', error)
      this.setStatus(500)
      throw new Error(error?.message ?? 'Failed to fetch activity status')
    }
  }
}
