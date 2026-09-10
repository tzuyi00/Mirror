// API Response Helpers
// Standardized response format for all API endpoints

import { Response } from 'express'
import { randomUUID } from 'crypto'

export interface ApiResponse<T = any> {
  status: number
  message: string
  apiId: string
  version: string
  requestId: string
  timestamp: string
  lang: string
  data?: T
  error?: {
    code: string
    details?: any
  }
}

/**
 * Send successful API response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  options?: {
    status?: number
    message?: string
    apiId?: string
    lang?: string
  }
): void {
  const response: ApiResponse<T> = {
    status: options?.status || 200,
    message: options?.message || 'Success',
    apiId: options?.apiId || 'API-PROFILE-001',
    version: '1.0',
    requestId: randomUUID(),
    timestamp: new Date().toISOString(),
    lang: options?.lang || 'en',
    data
  }
  
  res.status(response.status).json(response)
}

/**
 * Send error API response
 */
export function sendError(
  res: Response,
  options: {
    status: number
    message: string
    code: string
    apiId?: string
    lang?: string
    details?: any
  }
): void {
  const response: ApiResponse = {
    status: options.status,
    message: options.message,
    apiId: options.apiId || 'API-ERROR-001',
    version: '1.0',
    requestId: randomUUID(),
    timestamp: new Date().toISOString(),
    lang: options.lang || 'en',
    error: {
      code: options.code,
      details: options.details
    }
  }
  
  res.status(response.status).json(response)
}

/**
 * Send not found error
 */
export function sendNotFound(
  res: Response,
  message: string = 'Resource not found',
  details?: any
): void {
  sendError(res, {
    status: 404,
    message,
    code: 'NOT_FOUND',
    details
  })
}

/**
 * Send bad request error
 */
export function sendBadRequest(
  res: Response,
  message: string = 'Bad request',
  details?: any
): void {
  sendError(res, {
    status: 400,
    message,
    code: 'BAD_REQUEST',
    details
  })
}

/**
 * Send internal server error
 */
export function sendInternalError(
  res: Response,
  message: string = 'Internal server error',
  details?: any
): void {
  sendError(res, {
    status: 500,
    message,
    code: 'INTERNAL_ERROR',
    details
  })
}

/**
 * Send not implemented error
 */
export function sendNotImplemented(
  res: Response,
  message: string = 'Endpoint not yet implemented'
): void {
  sendError(res, {
    status: 501,
    message,
    code: 'NOT_IMPLEMENTED'
  })
}
