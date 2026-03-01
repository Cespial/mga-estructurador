/**
 * Retry wrapper with exponential backoff for transient API errors.
 * Only retries on 429 (rate limit), 500, 502, 503 errors.
 * Respects the Retry-After header on 429 responses.
 */

interface RetryOptions {
  maxRetries?: number;
  baseMs?: number;
}

interface RetryableError extends Error {
  status?: number;
  retryAfterMs?: number;
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503]);

function isRetryableError(err: unknown): err is RetryableError {
  if (!(err instanceof Error)) return false;
  const status = (err as RetryableError).status;
  if (status && RETRYABLE_STATUS_CODES.has(status)) return true;
  // Also retry on network errors (no status)
  if (!status && err.message.includes("fetch")) return true;
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 3, baseMs = 1000 } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === maxRetries || !isRetryableError(err)) {
        throw err;
      }

      // Calculate delay: exponential backoff with jitter
      const retryAfterMs = (err as RetryableError).retryAfterMs;
      const exponentialDelay = baseMs * Math.pow(2, attempt);
      const jitter = Math.random() * baseMs * 0.5;
      const delay = retryAfterMs
        ? Math.max(retryAfterMs, exponentialDelay)
        : exponentialDelay + jitter;

      console.warn(
        `[retry] Attempt ${attempt + 1}/${maxRetries} failed (status: ${(err as RetryableError).status ?? "unknown"}). Retrying in ${Math.round(delay)}ms...`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wraps a fetch call to extract status codes and Retry-After headers
 * into RetryableError format for the retry wrapper.
 */
export async function fetchWithRetryInfo(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const response = await fetch(url, init);

  if (!response.ok && RETRYABLE_STATUS_CODES.has(response.status)) {
    const error = new Error(
      `API error: ${response.status} ${response.statusText}`,
    ) as RetryableError;
    error.status = response.status;

    // Parse Retry-After header (seconds)
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        error.retryAfterMs = seconds * 1000;
      }
    }

    throw error;
  }

  return response;
}
