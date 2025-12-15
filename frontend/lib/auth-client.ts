import { createAuthClient } from "better-auth/client";
import { jwtClient } from "better-auth/client/plugins";

// Create auth client with JWT plugin for backend API authentication
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    jwtClient(), // Enable JWT token generation via authClient.token()
  ],
});

/**
 * Decode a JWT token to see its payload (for debugging)
 */
function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Generate and store a JWT token for backend API authentication.
 * Call this after successful login/signup.
 *
 * Uses Better Auth's jwtClient plugin - the correct method is authClient.token()
 */
export async function generateAndStoreJwtToken(): Promise<string | null> {
  try {
    console.log('[Auth] ========== GENERATING JWT TOKEN ==========');

    // Method 1: Use authClient.token() - the correct Better Auth way
    console.log('[Auth] Calling authClient.token()...');
    const response = await (authClient as any).token();
    console.log('[Auth] Token response:', response);

    if (!response.error && response.data?.token) {
      const token = response.data.token;
      if (typeof window !== "undefined") {
        // Decode and log the token payload to verify correct user
        const payload = decodeJwtPayload(token);
        console.log('[Auth] JWT token payload:', payload);
        console.log('[Auth] Token user ID (sub):', payload?.sub);
        console.log('[Auth] Token user email:', payload?.email);

        localStorage.setItem("bearer_token", token);
        console.log('[Auth] JWT token stored successfully, length:', token.length);
        return token;
      }
    }

    if (response.error) {
      console.warn('[Auth] authClient.token() failed:', response.error);
    }

    // Fallback: direct fetch to /api/auth/token with credentials
    console.log('[Auth] Attempting direct fetch to /api/auth/token...');
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const fetchResponse = await fetch(`${baseURL}/api/auth/token`, {
      method: 'GET',
      credentials: 'include', // Important: include cookies for session
    });

    console.log('[Auth] Direct fetch response status:', fetchResponse.status);

    if (fetchResponse.ok) {
      const data = await fetchResponse.json();
      console.log('[Auth] Direct fetch response data:', data);
      if (data?.token) {
        // Decode and log the token payload to verify correct user
        const payload = decodeJwtPayload(data.token);
        console.log('[Auth] JWT token payload (direct fetch):', payload);
        console.log('[Auth] Token user ID (sub):', payload?.sub);

        localStorage.setItem("bearer_token", data.token);
        console.log('[Auth] JWT token stored via direct fetch, length:', data.token.length);
        return data.token;
      }
    } else {
      const errorText = await fetchResponse.text();
      console.error('[Auth] Direct fetch failed:', fetchResponse.status, errorText);
    }

    console.warn('[Auth] All token generation methods failed');
    return null;
  } catch (error) {
    console.error('[Auth] Error generating JWT token:', error);
    return null;
  }
}

/**
 * Clear the stored JWT token and auth storage (call on logout)
 */
export function clearJwtToken(): void {
  if (typeof window !== "undefined") {
    console.log('[Auth] Clearing JWT token and auth storage');
    localStorage.removeItem("bearer_token");
    // Also clear Zustand persist storage to prevent re-hydration of stale token
    localStorage.removeItem("auth-storage");
    console.log('[Auth] Cleared: bearer_token, auth-storage');
  }
}
