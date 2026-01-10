/**
 * Security utilities for the application
 */

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Check if an action is rate limited
 * @returns true if the action should be blocked
 */
export function isRateLimited(
  key: string,
  config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 }
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return false;
  }

  record.count++;
  if (record.count > config.maxRequests) {
    return true;
  }

  return false;
}

/**
 * Get remaining rate limit attempts
 */
export function getRateLimitRemaining(
  key: string,
  config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 }
): number {
  const record = rateLimitStore.get(key);
  const now = Date.now();

  if (!record || now > record.resetAt) {
    return config.maxRequests;
  }

  return Math.max(0, config.maxRequests - record.count);
}

/**
 * Generate a simple HMAC-like signature for WebRTC messages
 * Uses a combination of userId, requestId, and timestamp for verification
 */
export function generateSignalSignature(
  userId: string,
  requestId: string,
  timestamp: number
): string {
  // Simple hash based on inputs - in production use proper HMAC with secret
  const data = `${userId}:${requestId}:${timestamp}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Verify a signal signature
 */
export function verifySignalSignature(
  userId: string,
  requestId: string,
  timestamp: number,
  signature: string,
  maxAgeMs: number = 30000
): boolean {
  // Check timestamp is within acceptable range
  const now = Date.now();
  if (Math.abs(now - timestamp) > maxAgeMs) {
    return false;
  }

  // Verify signature
  const expectedSignature = generateSignalSignature(userId, requestId, timestamp);
  return signature === expectedSignature;
}

/**
 * Sanitize error messages for production
 */
export function sanitizeErrorMessage(error: unknown, isDev: boolean = false): string {
  if (isDev) {
    return error instanceof Error ? error.message : String(error);
  }

  // Generic messages for production
  return "An error occurred. Please try again.";
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Safe console.error that only logs in development
 */
export function safeError(message: string, error?: unknown): void {
  if (isDevelopment()) {
    console.error(message, error);
  }
}
