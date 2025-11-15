/**
 * Timeout protection for AI gateway calls
 * Prevents indefinite hangs when Lovable AI workspace is paused
 */

export interface FetchWithTimeoutOptions {
  url: string;
  options: RequestInit;
  timeoutMs?: number;
}

export class AIError extends Error {
  constructor(
    message: string,
    public code: 'CREDITS_EXHAUSTED' | 'RATE_LIMIT_EXCEEDED' | 'TIMEOUT' | 'UNKNOWN',
    public statusCode: number
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Fetches from AI gateway with timeout protection
 * Throws AIError with specific codes for different failure modes
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Handle AI gateway specific errors
    if (response.status === 402) {
      throw new AIError(
        'AI service unavailable: credits exhausted',
        'CREDITS_EXHAUSTED',
        402
      );
    }
    
    if (response.status === 429) {
      throw new AIError(
        'AI service rate limit exceeded',
        'RATE_LIMIT_EXCEEDED',
        429
      );
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle abort/timeout
    if (error.name === 'AbortError') {
      throw new AIError(
        'AI request timed out',
        'TIMEOUT',
        408
      );
    }
    
    // Re-throw AIError as-is
    if (error instanceof AIError) {
      throw error;
    }
    
    // Wrap unknown errors
    throw new AIError(
      error instanceof Error ? error.message : 'Unknown AI gateway error',
      'UNKNOWN',
      500
    );
  }
}

/**
 * Handles AIError and returns appropriate Response
 */
export function handleAIError(
  error: unknown,
  corsHeaders: Record<string, string>,
  context: {
    endpoint: string;
    userId?: string;
    startTime: number;
  }
): Response {
  console.error(`[${context.endpoint}] AI Error:`, error);
  
  if (error instanceof AIError) {
    let userMessage: string;
    
    switch (error.code) {
      case 'CREDITS_EXHAUSTED':
        userMessage = 'AI service is currently unavailable. Please add credits in Settings → Cloud & AI balance.';
        break;
      case 'RATE_LIMIT_EXCEEDED':
        userMessage = 'AI service is experiencing high demand. Please try again in a few moments.';
        break;
      case 'TIMEOUT':
        userMessage = 'AI request timed out. The service may be experiencing issues. Please try again.';
        break;
      default:
        userMessage = 'AI service encountered an error. Please try again later.';
    }
    
    return new Response(
      JSON.stringify({
        error: error.code.toLowerCase(),
        message: userMessage
      }),
      {
        status: error.statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Unknown error
  return new Response(
    JSON.stringify({
      error: 'unknown',
      message: 'An unexpected error occurred. Please try again later.'
    }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
