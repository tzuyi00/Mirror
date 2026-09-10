import {
  incrementMemoryOperationCount,
  resetMemoryOperationCount,
} from "./memoryService.js";
import { saveCompleteProfile, ProfileView, UserProfileData } from "./profileService.js";
import { generateProfileFromAI } from "../aiService.js";

/**
 * Result of attempting to auto-update profile based on memory operations
 */
export interface ProfileAutoUpdateResult {
  triggered: boolean; // Whether profile update was triggered
  newCount?: number; // New memory operation count (before triggering)
  error?: string; // Error message if something failed
  message: string; // Human-readable status message
  profileData?: UserProfileData; // Complete profile data if update was successful
}

/**
 * Handle memory operation counting and potentially trigger profile auto-update
 * 
 * This is the unified logic used across:
 * - WebSocket message handler (ws.ts)
 * - HTTP chat endpoint (chat.ts)
 * - Future: memory modal mutations
 * 
 * @param userId - The user ID to update profile for
 * @param successCount - Number of successful memory operations
 * @returns Result object indicating if profile was updated and any errors
 */
export async function handleMemoryOperationUpdateProfile(
  userId: string,
  successCount: number
): Promise<ProfileAutoUpdateResult> {
  // Only proceed if there were successful operations
  if (successCount <= 0) {
    return {
      triggered: false,
      message: "No successful memory operations to count",
    };
  }

  try {
    const THRESHOLD = 3;
    // Increment the memory operation counter
    const newCount = await incrementMemoryOperationCount(userId);
    console.log(`$ [ProfileAutoUpdateService] Memory operation count: ${newCount}/${THRESHOLD}`);

    // Check if we've reached the threshold for profile auto-update
    if (newCount >= THRESHOLD) {
      console.log(`$ [ProfileAutoUpdateService] Reached (${newCount} >= ${THRESHOLD}), triggering profile auto-update`);

      // Reset counter for next cycle
      await resetMemoryOperationCount(userId);

      // Generate new profile from AI
      try {
        const aiResult = await generateProfileFromAI(userId);

        if (aiResult.ok && aiResult.profile) {
          // Save the generated profile to database
          await saveCompleteProfile(aiResult.profile, userId);

          // Fetch the updated profile data to return to frontend
          const profileData = await ProfileView(userId, true);
  
          if (!profileData) {
            return {
              triggered: true,
              newCount,
              error: "Profile saved but failed to fetch updated data",
              message: "Profile auto-update completed but failed to fetch data",
            };
          }

          return {
            triggered: true,
            newCount,
            message: "Profile auto-update completed successfully",
            profileData, // Include complete profile data for frontend
          };
        } else {
          const errorMsg =
            typeof aiResult.error === "string"
              ? aiResult.error
              : aiResult.error?.message || "Profile generation returned non-ok status";

          return {
            triggered: false,
            newCount,
            error: errorMsg,
            message: "Profile auto-update attempted but generation failed",
          };
        }
      } catch (genError: any) {

        return {
          triggered: false,
          newCount,
          error: genError?.message || "Unknown error during profile generation",
          message: "Profile auto-update encountered an error",
        };
      }
    } else {
      // Threshold not yet reached
      console.log(`$ [ProfileAutoUpdateService] Count ${newCount}/3, no auto-update triggered`);

      return {
        triggered: false,
        newCount,
        message: `Memory operation count updated to ${newCount}/3`,
      };
    }
  } catch (countError: any) {
    return {
      triggered: false,
      error: countError?.message || "Unknown error during count increment",
      message: "Failed to process memory operation count",
    };
  }
}
