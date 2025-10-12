import { supabase } from '@/integrations/supabase/client';

interface LoginData {
  userId: string;
  email: string;
  success: boolean;
  failureReason?: string;
  sessionId?: string;
}

interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
}

const parseUserAgent = (userAgent: string): DeviceInfo => {
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                 userAgent.includes('Firefox') ? 'Firefox' :
                 userAgent.includes('Safari') ? 'Safari' :
                 userAgent.includes('Edge') ? 'Edge' : 'Unknown';
  
  const os = userAgent.includes('Windows') ? 'Windows' :
            userAgent.includes('Mac') ? 'macOS' :
            userAgent.includes('Linux') ? 'Linux' :
            userAgent.includes('Android') ? 'Android' :
            userAgent.includes('iOS') ? 'iOS' : 'Unknown';
  
  const device = userAgent.includes('Mobile') ? 'Mobile' :
                userAgent.includes('Tablet') ? 'Tablet' : 'Desktop';
  
  return { browser, os, device };
};

const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'Unknown';
  }
};

const getLocationFromIP = async (ip: string): Promise<{ country: string; city: string }> => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    return {
      country: data.country_name || 'Unknown',
      city: data.city || 'Unknown'
    };
  } catch {
    return { country: 'Unknown', city: 'Unknown' };
  }
};

export const trackLogin = async (loginData: LoginData): Promise<void> => {
  try {
    const userAgent = navigator.userAgent;
    const deviceInfo = parseUserAgent(userAgent);
    const ipAddress = await getClientIP();
    const location = await getLocationFromIP(ipAddress);

    const { error } = await supabase
      .from('admin_login_history')
      .insert({
        user_id: loginData.userId === 'unknown' ? null : loginData.userId,
        email: loginData.email,
        ip_address: ipAddress,
        user_agent: userAgent,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device: deviceInfo.device,
        country: location.country,
        city: location.city,
        success: loginData.success,
        failure_reason: loginData.failureReason,
        session_id: loginData.sessionId
      });

    if (error) {
      console.error('Failed to track login:', error);
    }
  } catch (error) {
    console.error('Error tracking login:', error);
  }
};