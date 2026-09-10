import { Controller, Get, Post, Patch, Delete, Route, Path, Query, Body, Response } from 'tsoa';
import * as memoryService from "../services/memoryService.js";
import { syncMemoryOperationsToAI } from "../aiService.js";
import { CreateMemoryRequest, UpdateMemoryRequest, Memory } from '../dtos/MemoryDTOs.js';

@Route('api/memories')
export class MemoryController extends Controller {
  /**
   * Get all memories for a specific user
   * @param userId The user ID to fetch memories for
   * @param includeDeleted Whether to include soft-deleted memories (default: false)
   * @returns Array of memory objects
   */
  @Get('user/{userId}')
  @Response<any>(500, 'Internal server error')
  async getMemoriesByUser(
    @Path() userId: string,
    @Query() includeDeleted?: boolean
  ): Promise<any> {
    try {
      const memories = await memoryService.getMemoriesByUserId(userId, includeDeleted || false);
      
      return {
        status: 200,
        message: `Retrieved ${memories.length} memories`,
        apiId: "API-MEMORY-GET-USER-001",
        data: { 
          memories,
          count: memories.length
        }
      };
    } catch (error: any) {
      console.error("[Memory API] Get user memories error:", error);
      this.setStatus(500);
      throw error;
    }
  }

  /**
   * /api/memories
   * Create a new memory
   * @param request Memory creation request with userId, type, content, etc.
   * @returns Newly created memory object
   */
  @Post()
  @Response<any>(400, 'Missing required fields')
  @Response<any>(500, 'Internal server error')
  async createMemory(@Body() body: CreateMemoryRequest): Promise<any> {
    try {
      const { userId, type, content, source, categories, sectionIds } = body;
      
      // Validate required fields
      if (!userId || !type || !content) {
        this.setStatus(400);
        return {
          status: 400,
          message: "Missing required fields: userId, type, content",
          apiId: "API-MEMORY-CREATE-001",
          data: {}
        };
      }
      
      // Create memory using service
      const newMemory = await memoryService.createMemory({
        userId,
        type,
        content,
        source: source || 'Manual entry',
        categories: categories || [],
        sectionIds
      });
      
      // Sync to AI Server
      syncMemoryOperationsToAI(
        userId,
        [{
          type: 'create',
          memoryId: newMemory.id,
          content: newMemory.content,
          source: newMemory.source,
          categories: newMemory.categories,
          createdAt: newMemory.createdAt.toISOString()
        }],
        'memory_modal'
      ).catch(err => {
        console.error('[Memory API] Failed to sync create to AI:', err);
      });
      
      this.setStatus(201);
      return {
        status: 201,
        message: "Memory created successfully",
        apiId: "API-MEMORY-CREATE-001",
        data: { memory: newMemory }
      };
    } catch (error: any) {
      console.error("[Memory API] Create error:", error);
      this.setStatus(500);
      throw error;
    }
  }

  /**
   * /api/memories/{memoryId}
   * Update an existing memory
   * @param memoryId The ID of the memory to update
   * @param request Update request with optional content, source, categories
   * @returns Updated memory object
   */
  @Patch('{memoryId}')
  @Response<any>(404, 'Memory not found')
  @Response<any>(500, 'Internal server error')
  async updateMemory(
    @Path() memoryId: string,
    @Body() body: UpdateMemoryRequest
  ): Promise<any> {
    try {
      const { content, source, categories } = body;
      
      // Update memory using service
      const updatedMemory = await memoryService.updateMemory(memoryId, {
        content,
        source,
        categories
      });
      
      // Sync to AI Server
      syncMemoryOperationsToAI(
        updatedMemory.userId,
        [{
          type: 'update',
          memoryId: updatedMemory.id,
          content: updatedMemory.content,
          source: updatedMemory.source,
          categories: updatedMemory.categories,
          createdAt: updatedMemory.updatedAt.toISOString()
        }],
        'memory_modal'
      ).catch(err => {
        console.error('[Memory API] Failed to sync update to AI:', err);
      });
      
      return {
        status: 200,
        message: "Memory updated successfully",
        apiId: "API-MEMORY-UPDATE-001",
        data: { memory: updatedMemory }
      };
    } catch (error: any) {
      console.error("[Memory API] Update error:", error);
      
      // Check if error is "not found"
      if (error?.message?.includes('not found')) {
        this.setStatus(404);
        return {
          status: 404,
          message: error.message,
          apiId: "API-MEMORY-UPDATE-001",
          data: {}
        };
      }
      
      this.setStatus(500);
      throw error;
    }
  }

  /**
   * /api/memories/{memoryId}?mode=""
   * Delete a memory (soft or hard delete)
   * @param memoryId The ID of the memory to delete
   * @param mode Delete mode: 'soft' (default, marks as deleted) or 'hard' (completely removes)
   * @returns Deletion confirmation
   */
  @Delete('{memoryId}')
  @Response<any>(404, 'Memory not found')
  @Response<any>(500, 'Internal server error')
  async deleteMemory(
    @Path() memoryId: string,
    @Query() mode?: 'soft' | 'hard'
  ): Promise<any> {
    try {
      const deleteMode = mode === "hard" ? "hard" : "soft";
      
      // Get memory info before deletion (for AI sync)
      const memoryBeforeDelete = await memoryService.getMemoryById(memoryId);
      if (!memoryBeforeDelete) {
        this.setStatus(404);
        return {
          status: 404,
          message: `Memory ${memoryId} not found`,
          apiId: "API-MEMORY-DELETE-001",
          data: {}
        };
      }
      
      // Delete memory using service
      const result = await memoryService.deleteMemory(memoryId, deleteMode);
      
      // Sync to AI Server
      syncMemoryOperationsToAI(
        memoryBeforeDelete.userId,
        [{
          type: 'delete',
          memoryId: memoryBeforeDelete.id,
          content: memoryBeforeDelete.content,
          source: memoryBeforeDelete.source,
          categories: memoryBeforeDelete.categories,
          deleteMode: deleteMode,
          createdAt: new Date().toISOString()
        }],
        'memory_modal'
      ).catch(err => {
        console.error('[Memory API] Failed to sync delete to AI:', err);
      });
      
      if (deleteMode === "hard") {
        // Hard delete returns confirmation
        return {
          status: 200,
          message: "Memory hard deleted",
          apiId: "API-MEMORY-HARD-DELETE-001",
          data: {}
        };
      } else {
        // Soft delete returns updated memory
        return {
          status: 200,
          message: "Memory marked as deleted",
          apiId: "API-MEMORY-SOFT-DELETE-001",
          data: { memory: result }
        };
      }
    } catch (error: any) {
      console.error("[Memory API] Delete error:", error);
      
      // Check if error is "not found"
      if (error?.message?.includes('not found')) {
        this.setStatus(404);
        return {
          status: 404,
          message: error.message,
          apiId: "API-MEMORY-DELETE-001",
          data: {}
        };
      }
      
      this.setStatus(500);
      throw error;
    }
  }
}
