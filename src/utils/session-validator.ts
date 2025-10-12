import { supabase } from '@/integrations/supabase/client';

export const validateSession = async (sessionToken: string, userId: string): Promise<boolean> => {
  try {
    // Check if this session token matches the user's current active session
    const { data, error } = await supabase
      .from('admin_users')
      .select('current_session_token')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.log('Session validation error:', error);
      return true;
    }

    // If no current_session_token set, assume valid (backward compatibility)
    if (!data.current_session_token) {
      console.log('No session token set for user, assuming valid');
      return true;
    }

    const isValid = data.current_session_token === sessionToken;
    console.log('Session validation:', { 
      stored: data.current_session_token?.substring(0, 10) + '...', 
      current: sessionToken?.substring(0, 10) + '...', 
      isValid 
    });
    
    return isValid;
  } catch (error) {
    console.log('Session validation exception:', error);
    return true;
  }
};

export const startSessionValidation = (onInvalidSession: () => void) => {
  const interval = setInterval(async () => {
    const sessionData = localStorage.getItem('admin_session');
    if (!sessionData) return;

    try {
      const session = JSON.parse(sessionData);
      const sessionToken = session.sessionToken || session.token;
      const userId = session.id;
      
      if (!sessionToken || !userId) {
        console.log('Missing session data:', { sessionToken: !!sessionToken, userId: !!userId });
        return;
      }
      
      const isValid = await validateSession(sessionToken, userId);
      
      if (!isValid) {
        console.log('Session invalidated, logging out...');
        clearInterval(interval);
        onInvalidSession();
      }
    } catch (error) {
      console.error('Session validation check failed:', error);
    }
  }, 10000); // Check every 10 seconds for faster testing

  return interval;
};