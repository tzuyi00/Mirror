import { Controller, Get, Post, Route, Path, Query, Body, Response } from 'tsoa';
import { generateProfileFromAI, getGEvalFromAI } from '../aiService.js';
import { saveCompleteProfile, ProfileView } from '../services/profileService.js';
import { handleMemoryOperationUpdateProfile } from '../services/profileAutoUpdateService.js';
import {
  ProfileViewResponse,
  GenerateProfileRequest,
  GenerateProfileResponse,
  TriggerAutoUpdateRequest,
  TriggerAutoUpdateResponse,
  GEvalResponse,
  GEvalRequest
} from '../dtos/ProfileDTOs.js';

@Route('api')
export class ProfileController extends Controller {
  /**
   * /api/profile-views/{userId}
   * Get the profile view for a user (composite view with sections and optionally memories)
   * @param userId The ID of the user
   * @param includeMemories Optional flag to include memories in the response
   * @returns Profile view data with sections and optionally memories
   */
  @Get('profile-views/{userId}')
  @Response<any>(404, 'Profile not found')
  @Response<any>(500, 'Internal server error')
  async getProfileView(
    @Path() userId: string,
    @Query() include?: string
  ): Promise<any> {
    try {
      const includeMemories = include === 'memories';
      
      console.log('[Profile View API] Fetching profile for userId:', userId);
      console.log('[Profile View API] Include memories:', includeMemories);
      
      // Fetch from database using profileService
      const profileData = await ProfileView(userId, includeMemories);
      
      if (!profileData) {
        console.warn('[Profile View API] Profile not found for userId:', userId);
        this.setStatus(404);
        throw new Error(`Profile not found for user: ${userId}`);
      }
      
      console.log('[Profile View API] Sections count:', profileData.sections.length);
      console.log('[Profile View API] Memories count:', profileData.memories?.length || 0);
      
      // Return profile data in the expected format
      return {
        status: 200,
        message: 'Profile view fetched successfully',
        apiId: 'API-PROFILE-VIEW-GET-001',
        data: { profileView: profileData }
      };
    } catch (error: any) {
      console.error('[Profile View API] Error:', error);
      this.setStatus(500);
      throw error;
    }
  }

  /**
   * /api/profile/generate
   * Generate a user profile using AI and save to database
   * @param request Generation request with optional userId
   * @returns Generated profile metadata
   */
  @Post('profile/generate')
  @Response<any>(400, 'Bad request')
  @Response<any>(500, 'AI service or database error')
  async generateProfile(@Body() request: GenerateProfileRequest): Promise<any> {
    try {
      const userId = request.userId;
      console.log('[Profile Generate API] Target userId:', userId || 'new user (will be auto-generated)');
      
      // Step 1: Call AI service to generate profile
      const aiResult = await generateProfileFromAI(userId as any);
      
      if (!aiResult.ok || !aiResult.profile) {
        console.error('[Profile Generate API] AI generation failed:', aiResult.error);
        this.setStatus(500);
        throw new Error(aiResult.error?.message || 'AI generation failed');
      }
      
      console.log('[Profile Generate API] AI generation successful aiResult:', aiResult);
      
      // Step 2: Save generated profile to database
      const saveResult = await saveCompleteProfile(
        aiResult.profile,
        userId
      );
      
      if (!saveResult.success) {
        console.error('[Profile Generate API] Database save failed:', saveResult.error);
        this.setStatus(500);
        throw new Error(saveResult.error || 'Failed to save profile');
      }
      
      console.log('[Profile Generate API] Profile saved to database');
      console.log('[Profile Generate API] Saved userId:', saveResult.userId);
      
      // Step 3: Return success response with metadata
      return {
        status: 200,
        message: 'Profile generated and saved successfully',
        apiId: 'API-PROFILE-GENERATE-001',
        data: {
          userId: saveResult.userId,
          generatedAt: aiResult.meta.generatedAt,
          model: aiResult.meta.model,
          sectionsCount: aiResult.profile.sections.length,
          latency_ms: aiResult.meta.latency_ms
        }
      };
    } catch (error: any) {
      console.error('[Profile Generate API] Unexpected error:', error);
      throw error;
    }
  }

  /**
   * /api/profile/trigger-auto-update
   * Trigger profile auto-update after memory operations
   * @param request Auto-update request with userId and successCount
   * @returns Auto-update result with triggered status
   */
  @Post('profile/trigger-auto-update')
  @Response<any>(400, 'Missing required fields')
  @Response<any>(500, 'Internal server error')
  async triggerAutoUpdate(@Body() request: TriggerAutoUpdateRequest): Promise<any> {
    try {
      const { userId, successCount } = request;
      
      // Validate input
      if (!userId) {
        this.setStatus(400);
        return {
          status: 400,
          message: 'userId is required',
          apiId: 'API-PROFILE-TRIGGER-AUTO-UPDATE-001',
          data: {
            triggered: false,
            message: 'userId is required'
          }
        };
      }
      
      if (typeof successCount !== 'number' || successCount < 0) {
        this.setStatus(400);
        return {
          status: 400,
          message: 'successCount must be a non-negative number',
          apiId: 'API-PROFILE-TRIGGER-AUTO-UPDATE-001',
          data: {
            triggered: false,
            message: 'successCount must be a non-negative number'
          }
        };
      }
      
      console.log('[Profile Auto-Update API] Processing request:', { userId, successCount });
      
      // Use unified service to handle memory operation counting and profile update
      const result = await handleMemoryOperationUpdateProfile(userId, successCount);
      
      console.log('$ [Profile Auto-Update API] Result:', result);
      
      // Prepare response data based on whether update was triggered
      const responseData: any = {
        triggered: result.triggered,
        newCount: result.newCount,
        message: result.message,
        error: result.error
      };
      
      // Include profileData if update was triggered and successful
      if (result.triggered && result.profileData) {
        responseData.profileData = result.profileData;
      }
      
      // Return the unified result
      return {
        status: 200,
        message: result.triggered ? 'Profile auto-update triggered' : 'Operation processed',
        apiId: 'API-PROFILE-TRIGGER-AUTO-UPDATE-001',
        data: responseData
      };
    } catch (error: any) {
      console.error('[Profile Auto-Update API] Unexpected error:', error);
      this.setStatus(500);
      throw error;
    }
  }

  /**
   * /api/profile/g-eval
   * Get g-eval score from AI server
   * @param request G-eval request with userId
   * @returns G-eval score
   */
  @Post('profile/g-eval')
  @Response<any>(500, 'Internal server error')
  async getGEval(@Body() request: GEvalRequest): Promise<any> {
    try {
      console.log('[G-Eval API] Fetching g-eval score from AI service for userId:', request.userId);

      // Call AI service through aiService
      const aiResult = await getGEvalFromAI(request.userId);

      if (!aiResult.ok || aiResult.score === undefined) {
        console.error('[G-Eval API] AI service failed:', aiResult.error);
        this.setStatus(500);
        throw new Error(aiResult.error?.message || 'Failed to fetch g-eval from AI service');
      }

      console.log('[G-Eval API] Received g-eval score:', aiResult.score);

      return {
        status: 200,
        message: 'G-eval score fetched successfully',
        apiId: 'API-PROFILE-G-EVAL-001',
        data: {
          score: aiResult.score
        }
      };
    } catch (error: any) {
      console.error('[G-Eval API] Unexpected error:', error);
      this.setStatus(500);
      throw error;
    }
  }
}
