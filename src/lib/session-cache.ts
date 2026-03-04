// Simple in-memory session cache for the Digit scraper
interface SessionInfo {
  cookies: string;
  expiresAt: number;
}

let cachedSession: SessionInfo | null = null;
let loginPromise: Promise<string | null> | null = null;

export function getCachedSession(): string | null {
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    console.log("[SESSION] Using cached session cookie");
    return cachedSession.cookies;
  }
  return null;
}

export function setCachedSession(cookies: string) {
  // Session typically lasts for 1 hour, let's keep it for 50 minutes to be safe
  const expiry = Date.now() + 50 * 60 * 1000;
  cachedSession = { cookies, expiresAt: expiry };
  console.log("[SESSION] Cached new session cookie");
}

export function clearCachedSession() {
  cachedSession = null;
  console.log("[SESSION] Cleared cached session");
}

/**
 * Ensures only one login happens at a time.
 * If a login is in progress, subsequent calls wait for it.
 */
export async function getSession(loginFn: () => Promise<string | null>): Promise<string | null> {
  // 1. Check if we have a valid cache
  const cached = getCachedSession();
  if (cached) return cached;

  // 2. If already logging in, wait for it
  if (loginPromise) {
    console.log("[SESSION] Waiting for existing login process...");
    return loginPromise;
  }

  // 3. Start login process
  console.log("[SESSION] Starting fresh login process...");
  loginPromise = (async () => {
    try {
      const cookies = await loginFn();
      if (cookies) {
        setCachedSession(cookies);
      }
      return cookies;
    } catch (error) {
      console.error("[SESSION] Login function failed:", error);
      return null;
    } finally {
      loginPromise = null;
    }
  })();

  return loginPromise;
}
