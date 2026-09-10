import { AsyncLocalStorage } from 'async_hooks';
import type { Request, Response, NextFunction } from 'express';

// Create an AsyncLocalStorage instance to store request context
export const requestContext = new AsyncLocalStorage<{
  abortController: AbortController;
  request: Request;
  response: Response;
}>();

/**
 * Middleware to store request context in AsyncLocalStorage
 * This allows us to access the request and abortController from anywhere in the request lifecycle
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  // Create an AbortController for this request
  const abortController = new AbortController();
  
  // Track client disconnection but don't abort automatically
  // Let the controller decide when to abort based on its own logic
  let clientDisconnected = false;
  
  req.on('aborted', () => {
    console.log('[RequestContext] aborted event fired');
    clientDisconnected = true;
  });
  
  req.on('close', () => {
    console.log('[RequestContext] close event fired - headersSent:', res.headersSent, 'writableEnded:', res.writableEnded);
    // Mark as disconnected only if response hasn't completed
    if (!res.headersSent && !res.writableEnded) {
      clientDisconnected = true;
    }
  });
  
  // Store the context and continue
  requestContext.run(
    {
      abortController,
      request: req,
      response: res,
    },
    next
  );
}
