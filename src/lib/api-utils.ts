import { NextResponse } from 'next/server';

/**
 * Standardized error response for API routes
 */
export function apiError(message: string, status: number = 500, details?: any) {
  const response: any = {
    error: message,
    success: false,
  };

  if (process.env.NODE_ENV === 'development' && details) {
    response.details = details;
  }

  // Add digest for production errors (can be used to look up logs)
  if (status >= 500 && process.env.NODE_ENV === 'production') {
    response.digest = generateDigest(message, details);
  }

  return NextResponse.json(response, { status });
}

/**
 * Generate a short digest/hash for error tracking
 */
function generateDigest(message: string, details?: any): string {
  const str = `${message}-${JSON.stringify(details)}`;
  // Simple hash - in production you might want something more robust
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `err_${Math.abs(hash).toString(36)}`;
}

/**
 * Wrapper for API route handlers to catch errors automatically
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args): Promise<ReturnType<T>> => {
    try {
      return await handler(...args);
    } catch (err: any) {
      // Log the error
      console.error(`API Error [${handler.name}]:`, err);

      // Return standardized error response
      return apiError(
        err.message || 'Internal server error',
        err.status || 500,
        process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
      ) as any;
    }
  };
}

/**
 * Validate required fields in request data
 */
export function validateRequest(data: any, requiredFields: string[]): { valid: boolean; error?: string } {
  const missing = requiredFields.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`,
    };
  }

  return { valid: true };
}
