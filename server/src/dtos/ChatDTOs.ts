import { ErrorInfo, MemoryOperation, MemoryOperationResult, MetaData, ProfileAutoUpdateInfo } from './CommonDTOs.js';

export interface ChatRequest {
  userId: string;
  message: string;
  threadId?: string;
}

export interface ChatReplyResponse {
  ok: boolean;
  reply?: string;
  error?: ErrorInfo;
  meta: MetaData;
}

export interface ProcessMemoryRequest {
  threadId: string;
  userId: string;
  replyText: string;
  userMessage: string;
  source?: string;
}

export interface ProcessMemoryResponse {
  ok: boolean;
  operationResults?: MemoryOperationResult[];
  profileAutoUpdate?: ProfileAutoUpdateInfo;
  error?: ErrorInfo;
}

// ── Interviewer Mode DTOs ─────────────────────────────────────────────────────

export interface InterviewStartRequest {
  threadId: string;
  userId: string;
  activityId: string;
}
export interface InterviewStartResponse {
  ok: boolean;
  replyQuestion?: string;
  questionMessageId?: string;
  interviewEnded?: boolean;
  error?: ErrorInfo;
  meta: MetaData;
}

export interface InterviewMessageResponse {
  ok: boolean;
  replyQuestion?: string;
  questionMessageId?: string;
  interviewEnded?: boolean;
  error?: ErrorInfo;
  meta: MetaData;
}

// ── Generate Mode DTOs (combined reply + process-memory) ─────────────────────

export interface GenerateRequest {
  userId: string;
  message: string;
  threadId?: string;
  source?: string;
}

export interface GenerateResponse {
  ok: boolean;
  reply?: string;
  operationResults?: MemoryOperationResult[];
  profileAutoUpdate?: ProfileAutoUpdateInfo;
  error?: ErrorInfo;
  meta: MetaData;
}

// ── Greeting Mode DTOs (proactive greeting messages) ──────────────────────────

export interface GreetingRequest {
  userId: string;
  threadId: string;
}

export interface GreetingResponse {
  ok: boolean;
  greeting?: string;
  error?: ErrorInfo;
  meta: MetaData;
}

