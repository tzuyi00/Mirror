import { Controller, Post, Get, Path, Body, Route } from 'tsoa';
import { ThreadCreateResponse, ThreadMessagesResponse } from '../dtos/ThreadDTOs.js';
import { createThread, getThreadMessages, getLatestThreadForUser } from '../services/chatService.js';

@Route('api')
export class ThreadController extends Controller {
  /**
   * /api/thread
   * Create a new conversation thread or get/create the latest thread for a user
   * 
   * If body is empty: Creates a new generic thread
   * If body contains userId: Gets or creates the latest thread for user (optionally filtered by activityId)
   * 
   * @param body Optional request body containing userId and optional activityId
   * @returns Thread response with threadId, createdAt, and optional activityId
   */
  @Post('thread')
  async createOrGetUserThread(
    @Body() body?: { userId?: string; activityId?: string }
  ): Promise<ThreadCreateResponse & { activityId?: string }> {
    // If no userId provided, create a generic thread
    if (!body?.userId) {
      const thread = await createThread();
      return { 
        threadId: thread.id, 
        createdAt: thread.createdAt.toISOString()
      };
    }

    // If userId provided, get or create the latest thread (with optional activity filter)
    // Special case: activityId = 'any' → find latest thread with any non-null activityId (read-only, no creation)
    if (body.activityId === 'any') {
      const thread = await getLatestThreadForUser(body.userId, 'any');
      console.log(`[ThreadController] Last activity thread for user ${body.userId}:`, thread?.activityId ?? 'none');
      return {
        threadId: thread?.id ?? '',
        createdAt: thread?.createdAt.toISOString() ?? new Date().toISOString(),
        activityId: thread?.activityId ?? undefined,
      };
    }

    let thread = await getLatestThreadForUser(body.userId, body.activityId);
    if (!thread) {
      thread = await createThread(body.userId, body.activityId);
    }
    
    const logMsg = body.activityId
      ? `[ThreadController] Got or created activity thread for user ${body.userId} (activityId: ${body.activityId}): ${thread.id}`
      : `[ThreadController] Got or created impersonation thread for user ${body.userId}: ${thread.id}`;
    console.log(logMsg);
    
    return { 
      threadId: thread.id, 
      createdAt: thread.createdAt.toISOString(),
      activityId: thread.activityId || undefined
    };
  }

  /**
   * /api/thread/{threadId}/messages
   * Get all messages for a specific thread
   * @param threadId The thread ID to fetch messages for
   * @returns Thread messages response with threadId and messages array
   */
  @Get('thread/{threadId}/messages')
  async getThreadMessages(@Path() threadId: string): Promise<ThreadMessagesResponse> {
    const messages = await getThreadMessages(threadId);
    return {
      threadId,
      messages: messages.map(msg => ({
        id: msg.id,
        createdAt: msg.createdAt.toISOString(),
        role: msg.role,
        data: msg.data
      }))
    };
  }
}
