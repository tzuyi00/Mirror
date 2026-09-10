/**
 * Common DTO types used across multiple endpoints
 */

export interface MetaData {
  userId: string;
  threadId?: string;
  messageId?: string;
  createdAt: string;
}

export interface ErrorInfo {
  code: string;
  message: string;
}

export interface MemoryOperation {
  type: 'create' | 'update' | 'delete';
  memoryId?: string;
  memContent?: string;
  source?: string;
  categories?: string[];
}

export interface MemoryOperationResult {
  success: boolean;
  memoryId?: string;
  error?: string;
}

export interface ProfileAutoUpdateInfo {
  triggered: boolean;
  message: string;
  profileData?: any;
}
