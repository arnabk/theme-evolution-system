/**
 * Session Management with localStorage
 */

const STORAGE_KEY = 'theme-evolution-session-id';

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''; // SSR guard
  
  // Check if session exists
  let sessionId = localStorage.getItem(STORAGE_KEY);
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
    console.log('✅ New session created:', sessionId);
  } else {
    console.log('✅ Existing session loaded:', sessionId);
  }
  
  return sessionId;
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEY);
  console.log('✅ Session cleared');
}

export function getSessionInfo(): { id: string; created: string } | null {
  if (typeof window === 'undefined') return null;
  
  const sessionId = getSessionId();
  const timestamp = sessionId.split('_')[1];
  const created = timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'Unknown';
  
  return { id: sessionId, created };
}

