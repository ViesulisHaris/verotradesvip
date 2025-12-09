// JWT Token Validation and Retry Utilities
// This module provides robust JWT handling for API requests

export interface JWTValidationResult {
  isValid: boolean;
  error?: string;
  segments?: string[];
  tokenLength?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * Validates JWT token format and structure
 */
export function validateJWTToken(token: string): JWTValidationResult {
  if (!token || typeof token !== 'string') {
    return {
      isValid: false,
      error: 'Token is missing or not a string'
    };
  }

  const segments = token.split('.');
  
  if (segments.length !== 3) {
    return {
      isValid: false,
      error: `Invalid JWT format: expected 3 segments, got ${segments.length}`,
      segments,
      tokenLength: token.length
    };
  }

  // Check if all segments are non-empty
  const emptySegments = segments.filter(segment => segment.length === 0);
  if (emptySegments.length > 0) {
    return {
      isValid: false,
      error: 'JWT contains empty segments',
      segments,
      tokenLength: token.length
    };
  }

  // Check minimum token length (basic sanity check)
  if (token.length < 100) {
    return {
      isValid: false,
      error: `JWT token too short: ${token.length} characters (minimum 100)`,
      segments,
      tokenLength: token.length
    };
  }

  // Check maximum token length (prevent truncation detection)
  if (token.length > 2048) {
    return {
      isValid: false,
      error: `JWT token too long: ${token.length} characters (maximum 2048)`,
      segments,
      tokenLength: token.length
    };
  }

  return {
    isValid: true,
    segments,
    tokenLength: token.length
  };
}

/**
 * Validates JWT token and provides detailed logging
 */
export function validateJWTWithLogging(token: string, context: string = 'unknown'): JWTValidationResult {
  const result = validateJWTToken(token);
  
  console.log(`🔍 [JWT_VALIDATION:${context}] Token validation result:`, {
    isValid: result.isValid,
    error: result.error,
    tokenLength: result.tokenLength,
    segmentCount: result.segments?.length || 0,
    segmentLengths: result.segments?.map(s => s.length) || [],
    timestamp: new Date().toISOString()
  });

  return result;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Implements exponential backoff retry mechanism
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context: string = 'unknown'
): Promise<T> {
  const finalConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    ...config
  };

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      console.log(`🔄 [RETRY:${context}] Attempt ${attempt + 1}/${finalConfig.maxRetries + 1}`);
      
      const result = await operation();
      
      if (attempt > 0) {
        console.log(`✅ [RETRY:${context}] Success on attempt ${attempt + 1}`);
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.error(`❌ [RETRY:${context}] Attempt ${attempt + 1} failed:`, {
        error: lastError.message,
        stack: lastError.stack,
        timestamp: new Date().toISOString()
      });

      // Don't retry on authentication errors (4xx)
      if (lastError.message.includes('401') || lastError.message.includes('Authentication')) {
        console.log(`🚫 [RETRY:${context}] Authentication error - not retrying`);
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt),
        finalConfig.maxDelay
      );

      console.log(`⏳ [RETRY:${context}] Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }
  }

  console.error(`💥 [RETRY:${context}] All attempts failed`);
  throw lastError;
}

/**
 * Enhanced fetch with JWT validation and retry logic
 */
export async function fetchWithJWTValidation(
  url: string,
  options: RequestInit,
  context: string = 'unknown'
): Promise<Response> {
  // Extract and validate token before making request
  const authHeader = options.headers as Record<string, string>;
  const token = authHeader?.Authorization?.replace('Bearer ', '');

  if (token) {
    const validation = validateJWTWithLogging(token, context);
    
    if (!validation.isValid) {
      throw new Error(`JWT validation failed: ${validation.error}`);
    }
  }

  // Implement retry logic for the actual fetch
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      return response;
    },
    {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffFactor: 2
    },
    context
  );
}

/**
 * Token refresh utility (placeholder for future implementation)
 */
export async function refreshJWTToken(): Promise<string | null> {
  console.log('🔄 [JWT_REFRESH] Attempting to refresh token...');
  
  try {
    // This would integrate with your auth context
    // For now, return null to indicate no refresh capability
    return null;
  } catch (error) {
    console.error('❌ [JWT_REFRESH] Token refresh failed:', error);
    return null;
  }
}