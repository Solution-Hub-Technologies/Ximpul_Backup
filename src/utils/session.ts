import { supabase } from '@/integrations/supabase/client';

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: string;
  sessionToken: string;
  token: string;
  expiresAt: number;
}

const SESSION_KEY = import.meta.env.VITE_SESSION_KEY || 'admin_session';
const SESSION_DURATION = (import.meta.env.VITE_SESSION_DURATION ? parseInt(import.meta.env.VITE_SESSION_DURATION) : 8) * 60 * 60 * 1000;

export const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const generateSecureToken = (): string => {
  return generateSessionToken();
};

export const createSession = (adminData: any): AdminSession => {
  const sessionToken = generateSessionToken();
  const expiresAt = Date.now() + SESSION_DURATION;
  
  const session: AdminSession = {
    id: adminData.id,
    email: adminData.email,
    name: adminData.name,
    role: adminData.role,
    sessionToken,
    expiresAt,
    token: sessionToken // Add token property for compatibility
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const getSession = (): AdminSession | null => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;
    
    const session: AdminSession = JSON.parse(sessionData);
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    
    return session;
  } catch {
    clearSession();
    return null;
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

export const refreshSession = (session: AdminSession): AdminSession => {
  const refreshedSession = {
    ...session,
    expiresAt: Date.now() + SESSION_DURATION
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(refreshedSession));
  return refreshedSession;
};