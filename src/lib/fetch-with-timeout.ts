/**
 * Fetch wrapper with configurable timeout using AbortController.
 * Prevents indefinite hangs on slow external APIs.
 */

const DEFAULT_TIMEOUT = 15000; // 15 seconds

export class FetchTimeoutError extends Error {
  constructor(url: string, timeout: number) {
    super(`Request to ${url} timed out after ${timeout}ms`);
    this.name = "FetchTimeoutError";
  }
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new FetchTimeoutError(url, timeout);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
