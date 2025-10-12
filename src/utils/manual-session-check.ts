import { supabase } from '@/integrations/supabase/client';

export const checkSessionManually = async () => {
  const sessionData = localStorage.getItem('admin_session');
  if (!sessionData) {
    console.log('No session found');
    return;
  }

  try {
    const session = JSON.parse(sessionData);
    const sessionToken = session.sessionToken || session.token;
    const userId = session.id;
    
    console.log('Current session:', {
      userId,
      sessionToken: sessionToken?.substring(0, 10) + '...',
      email: session.email
    });

    // Check database
    const { data, error } = await supabase
      .from('admin_users')
      .select('current_session_token, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.log('Database error:', error);
      return;
    }

    console.log('Database session:', {
      stored: data.current_session_token?.substring(0, 10) + '...',
      email: data.email,
      matches: data.current_session_token === sessionToken
    });

  } catch (error) {
    console.log('Session check error:', error);
  }
};

// Add to window for manual testing
(window as any).checkSession = checkSessionManually;